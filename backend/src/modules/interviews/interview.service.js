import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { transcribeAudio } from "../../utils/deepgram.js";
import { uploadToS3 } from "../../utils/s3.js";
import { generateSpeech } from "../../utils/tts.js";
import {
  generateInterviewResponse,
  generateInterviewReport,
} from "../../utils/gemini.js";

const countAiQuestions = async (interviewId) => {
  return prisma.interviewTurn.count({
    where: { interviewId, speaker: "AI" },
  });
};

const INACTIVITY_TIMEOUT_MINUTES = 15;

export const cleanupStaleInterviews = async (userId) => {
  const cutoff = new Date(Date.now() - INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);

  const staleInterviews = await prisma.interview.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
    },
    include: {
      turns: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const idsToExpire = [];
  for (const interview of staleInterviews) {
    const lastActivity = interview.turns.length > 0
      ? interview.turns[0].createdAt
      : interview.startedAt || interview.createdAt;

    if (new Date(lastActivity) < cutoff) {
      idsToExpire.push(interview.id);
    }
  }

  if (idsToExpire.length > 0) {
    await prisma.interview.updateMany({
      where: { id: { in: idsToExpire } },
      data: { status: "FAILED", completedAt: new Date() },
    });
    console.log(`Auto-expired ${idsToExpire.length} stale interview(s) for user ${userId}`);
  }
};

const createAiTurn = async (interview, conversationHistory, questionNumber) => {
  const jobDescription = interview.application?.job?.job_description || "Not provided";
  const resumeText = interview.resumeText || "Not provided";

  const aiText = await generateInterviewResponse({
    conversationHistory,
    jobDescription,
    resumeText,
    targetRole: interview.targetRole,
    currentQuestion: questionNumber,
    maxQuestions: interview.maxQuestions,
    interviewType: interview.interviewType,
  });

  const aiAudioBuffer = await generateSpeech(aiText);
  
  // We can't avoid waiting for S3 because frontend needs the URL to play
  const aiAudioUrl = await uploadToS3(
    aiAudioBuffer,
    `ai-response-${interview.id}-q${questionNumber}.wav`,
    "audio/wav"
  );

  const nextTurnNumber = conversationHistory.length > 0 
    ? conversationHistory[conversationHistory.length - 1].turn_number + 1 
    : 1;

  const aiTurn = await prisma.interviewTurn.create({
    data: {
      interviewId: interview.id,
      turn_number: nextTurnNumber,
      speaker: "AI",
      text: aiText,
      audioUrl: aiAudioUrl,
    },
  });

  return aiTurn;
};

const generateReportAsync = async (interviewId, jobDescription) => {
  try {
    const turns = await prisma.interviewTurn.findMany({
      where: { interviewId },
      orderBy: { turn_number: "asc" },
    });

    if (turns.length === 0) return;

    const transcript = turns
      .map(
        (turn) =>
          `${turn.speaker === "AI" ? "Interviewer" : "Candidate"}: ${turn.text}`
      )
      .join("\n\n");

    const evaluationJson = await generateInterviewReport(
      transcript,
      jobDescription
    );

    await prisma.report.update({
      where: { interviewId },
      data: {
        generationStatus: "READY",
        tech_score: evaluationJson.tech_score,
        comm_score: evaluationJson.comm_score,
        problemSolvingScore: evaluationJson.problemSolvingScore,
        clarityScore: evaluationJson.clarityScore,
        strengths: evaluationJson.strengths,
        weaknesses: evaluationJson.weaknesses,
        finalRecommendation: evaluationJson.finalRecommendation,
        final_verdict: evaluationJson.final_verdict,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Async report generation failed:", error);
    await prisma.report.update({
      where: { interviewId },
      data: {
        generationStatus: "FAILED",
        finalRecommendation: "Report generation failed. Please review manually.",
        final_verdict: "NEEDS REVIEW",
      },
    });
  }
};

export const startJobInterview = async (interviewId) => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: { job: true },
      },
    },
  });

  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.status !== "PENDING") {
    throw new AppError("This interview has already been started", 400);
  }

  const startedAt = new Date();
  const durationSeconds = interview.durationSeconds || 1800; // default 30 mins
  const timerExpiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: interviewId },
      data: { 
        status: "IN_PROGRESS", 
        startedAt,
        durationSeconds,
        timerExpiresAt
      },
    });

    if (interview.applicationId) {
      await tx.application.update({
        where: { id: interview.applicationId },
        data: { status: "INTERVIEWING" },
      });
    }
  });

  const updatedInterview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: { include: { job: true } },
    },
  });

  try {
    const aiTurn = await createAiTurn(updatedInterview, [], 1);
    return { interview: updatedInterview, firstTurn: aiTurn };
  } catch (error) {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw error;
  }
};

export const startMockInterview = async (userId, resumeText, targetRole) => {
  const startedAt = new Date();
  const durationSeconds = 600; // 10 minutes
  const timerExpiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  const interview = await prisma.interview.create({
    data: {
      userId,
      interviewType: "MOCK",
      roundType: "MOCK",
      status: "IN_PROGRESS",
      maxQuestions: 6,
      durationSeconds,
      timerExpiresAt,
      resumeText,
      targetRole: targetRole || "Software Engineer",
      startedAt,
    },
  });

  try {
    const aiTurn = await createAiTurn(interview, [], 1);
    return { interview, firstTurn: aiTurn };
  } catch (error) {
    await prisma.interview.update({
      where: { id: interview.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw error;
  }
};

export const processAnswer = async (interviewId, audioBuffer, audioName) => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: { include: { job: true } },
    },
  });

  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.status !== "IN_PROGRESS") {
    throw new AppError("This interview is not in progress", 400);
  }

  // 1. Parallelize initial tasks
  const [userText, userAudioUrl, conversationHistory, aiQuestionCount] = await Promise.all([
    transcribeAudio(audioBuffer),
    uploadToS3(audioBuffer, audioName || "user-answer.webm", "audio/webm"),
    prisma.interviewTurn.findMany({
      where: { interviewId },
      orderBy: { turn_number: "asc" },
    }),
    countAiQuestions(interviewId)
  ]);

  const userTurnNumber = conversationHistory.length > 0 
    ? conversationHistory[conversationHistory.length - 1].turn_number + 1 
    : 1;

  const userTurnData = {
    interviewId,
    turn_number: userTurnNumber,
    speaker: "USER",
    text: userText,
    audioUrl: userAudioUrl,
  };

  // Add the newly transcribed user turn to history manually so AI has it
  const updatedHistory = [...conversationHistory, userTurnData];

  // 2. Start saving user turn to DB in the background
  const userTurnPromise = prisma.interviewTurn.create({ data: userTurnData });

  if (aiQuestionCount >= interview.maxQuestions) {
    await userTurnPromise; // Ensure user turn is saved before report
    const report = await finishInterview(interviewId);
    return { aiTurn: null, isComplete: true, report, userText };
  }

  try {
    const aiTurn = await createAiTurn(
      interview,
      updatedHistory,
      aiQuestionCount + 1
    );

    await userTurnPromise; // Ensure user turn is done saving
    return { aiTurn, isComplete: false, report: null, userText };
  } catch (error) {
    console.error("AI turn generation failed, rolling back user turn:", error.message);
    await userTurnPromise; // wait for it to be created before deleting
    await prisma.interviewTurn.deleteMany({
      where: { interviewId, turn_number: userTurnNumber },
    });
    throw new AppError("Failed to generate AI response. Please try answering again.", 500);
  }
};

export const finishInterview = async (interviewId) => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: { include: { job: true } },
      report: true,
    },
  });

  if (!interview) throw new AppError("Interview not found", 404);

  if (interview.report && interview.report.generationStatus === "READY") {
    return interview.report;
  }

  const userTurns = await prisma.interviewTurn.count({
    where: { interviewId, speaker: "USER" },
  });

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  if (userTurns === 0) {
    if (!interview.report) {
      return await prisma.report.create({
        data: {
          interviewId,
          generationStatus: "READY",
          tech_score: 0,
          comm_score: 0,
          problemSolvingScore: 0,
          clarityScore: 0,
          strengths: [],
          weaknesses: ["Interview ended before any questions were answered"],
          finalRecommendation: "The interview was ended before the candidate provided any answers.",
          final_verdict: "NO HIRE",
          generatedAt: new Date(),
        },
      });
    }
    return interview.report;
  }

  let report = interview.report;
  if (!report) {
    report = await prisma.report.create({
      data: {
        interviewId,
        generationStatus: "PENDING",
        tech_score: 0,
        comm_score: 0,
        problemSolvingScore: 0,
        clarityScore: 0,
        strengths: [],
        weaknesses: [],
        finalRecommendation: "Report is being generated...",
        final_verdict: "PENDING",
      },
    });
  }

  const jobDescription = interview.application?.job?.job_description || "Not provided";
  // Kick off async without awaiting
  generateReportAsync(interviewId, jobDescription).catch(console.error);

  return report;
};

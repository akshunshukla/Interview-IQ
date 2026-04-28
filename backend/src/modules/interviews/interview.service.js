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

const getInterviewContext = async (interview) => {
  let jobDescription = "General Interview";
  let resumeText = interview.resumeText || "";

  if (interview.application) {
    const app = interview.application;
    jobDescription = app.job?.job_description || jobDescription;
    resumeText = resumeText || app.resume_text || "";
  }

  return { jobDescription, resumeText };
};

const createAiTurn = async (interview, conversationHistory, questionNumber) => {
  const { jobDescription, resumeText } = await getInterviewContext(interview);

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
  const aiAudioUrl = await uploadToS3(
    aiAudioBuffer,
    `ai-response-${interview.id}-q${questionNumber}.wav`,
    "audio/wav"
  );

  const lastTurn = await prisma.interviewTurn.findFirst({
    where: { interviewId: interview.id },
    orderBy: { turn_number: "desc" },
  });
  const nextTurnNumber = lastTurn ? lastTurn.turn_number + 1 : 1;

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

const generateReport = async (interview) => {
  const turns = await prisma.interviewTurn.findMany({
    where: { interviewId: interview.id },
    orderBy: { turn_number: "asc" },
  });

  if (turns.length === 0) {
    throw new AppError("Cannot generate report for an empty interview", 400);
  }

  const transcript = turns
    .map(
      (turn) =>
        `${turn.speaker === "AI" ? "Interviewer" : "Candidate"}: ${turn.text}`
    )
    .join("\n\n");

  const { jobDescription } = await getInterviewContext(interview);

  const evaluationJson = await generateInterviewReport(
    transcript,
    jobDescription
  );

  const report = await prisma.report.create({
    data: {
      interviewId: interview.id,
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

  await prisma.interview.update({
    where: { id: interview.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return report;
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

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
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
  const interview = await prisma.interview.create({
    data: {
      userId,
      interviewType: "MOCK",
      roundType: "MOCK",
      status: "IN_PROGRESS",
      maxQuestions: 6,
      resumeText,
      targetRole: targetRole || "Software Engineer",
      startedAt: new Date(),
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

  const userText = await transcribeAudio(audioBuffer);

  const userAudioUrl = await uploadToS3(
    audioBuffer,
    audioName || "user-answer.webm",
    "audio/webm"
  );

  const lastTurn = await prisma.interviewTurn.findFirst({
    where: { interviewId },
    orderBy: { turn_number: "desc" },
  });
  const userTurnNumber = lastTurn ? lastTurn.turn_number + 1 : 1;

  const userTurn = await prisma.interviewTurn.create({
    data: {
      interviewId,
      turn_number: userTurnNumber,
      speaker: "USER",
      text: userText,
      audioUrl: userAudioUrl,
    },
  });

  const aiQuestionCount = await countAiQuestions(interviewId);

  if (aiQuestionCount >= interview.maxQuestions) {
    const report = await generateReport(interview);
    return { aiTurn: null, isComplete: true, report, userText };
  }

  // If AI generation fails, roll back user turn to prevent corrupted history
  try {
    const conversationHistory = await prisma.interviewTurn.findMany({
      where: { interviewId },
      orderBy: { turn_number: "asc" },
    });

    const aiTurn = await createAiTurn(
      interview,
      conversationHistory,
      aiQuestionCount + 1
    );

    return { aiTurn, isComplete: false, report: null, userText };
  } catch (error) {
    console.error("AI turn generation failed, rolling back user turn:", error.message);
    await prisma.interviewTurn.delete({ where: { id: userTurn.id } });
    throw error;
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

  if (interview.report) {
    return interview.report;
  }

  const userTurns = await prisma.interviewTurn.count({
    where: { interviewId, speaker: "USER" },
  });

  if (userTurns === 0) {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    const report = await prisma.report.create({
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
    return report;
  }

  try {
    return await generateReport(interview);
  } catch (error) {
    console.error("Report generation failed during finish:", error);
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    const report = await prisma.report.create({
      data: {
        interviewId,
        generationStatus: "FAILED",
        tech_score: 0,
        comm_score: 0,
        problemSolvingScore: 0,
        clarityScore: 0,
        strengths: [],
        weaknesses: [],
        finalRecommendation: "Report generation failed. Please review the interview transcript manually.",
        final_verdict: "NEEDS REVIEW",
        generatedAt: new Date(),
      },
    });
    return report;
  }
};

import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  startJobInterview,
  startMockInterview,
  processAnswer,
  finishInterview as finishInterviewService,
  cleanupStaleInterviews,
} from "./interview.service.js";

export const startInterview = asyncHandler(async (req, res, next) => {
  const { interviewId, targetRole, interviewType } = req.body;

  if (interviewType === "MOCK") {
    await cleanupStaleInterviews(req.user.id);

    let resumeText = "";
    if (req.file) {
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: req.file.buffer });
        const result = await parser.getText();
        resumeText = result.text.replace(/\0/g, "");
        await parser.destroy();
      } catch (error) {
        throw new AppError("Failed to read resume PDF", 400);
      }
    }

    const result = await startMockInterview(
      req.user.id,
      resumeText,
      targetRole
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          interview: result.interview,
          firstTurn: result.firstTurn,
        },
        "Mock interview started successfully"
      )
    );
  }


  if (!interviewId) {
    throw new AppError("interviewId is required for job interviews", 400);
  }


  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.userId !== req.user.id) {
    throw new AppError("You are not authorized to start this interview", 403);
  }

  const result = await startJobInterview(interviewId);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        interview: result.interview,
        firstTurn: result.firstTurn,
      },
      "Interview started successfully"
    )
  );
});

export const processInterviewTurn = asyncHandler(async (req, res, next) => {
  const { interviewId } = req.body;
  const audioFile = req.file;

  if (!interviewId || !audioFile) {
    throw new AppError("Interview ID and audio file are required", 400);
  }


  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.userId !== req.user.id) {
    throw new AppError("You are not authorized for this interview", 403);
  }

  const result = await processAnswer(
    interviewId,
    audioFile.buffer,
    audioFile.originalname
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        turn: result.aiTurn,
        isComplete: result.isComplete,
        report: result.report,
        userText: result.userText,
      },
      result.isComplete
        ? "Interview completed! Report generated."
        : "Interview turn processed successfully"
    )
  );
});

export const endInterview = asyncHandler(async (req, res, next) => {
  const { id: interviewId } = req.params;


  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.userId !== req.user.id) {
    throw new AppError("You are not authorized for this interview", 403);
  }

  const report = await finishInterviewService(interviewId);

  res.status(200).json(
    new ApiResponse(
      200,
      { report },
      "Interview completed and report generated successfully"
    )
  );
});

export const getInterviewDetails = asyncHandler(async (req, res, next) => {
  const { id: interviewId } = req.params;

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      turns: { orderBy: { turn_number: "asc" } },
      report: true,
      application: {
        include: {
          job: {
            select: { id: true, title: true, job_description: true },
          },
        },
      },
    },
  });

  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.userId !== req.user.id) {
    throw new AppError("You are not authorized to view this interview", 403);
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { interview }, "Interview details fetched successfully")
    );
});

export const getMyInterviews = asyncHandler(async (req, res, next) => {
  await cleanupStaleInterviews(req.user.id);

  const interviews = await prisma.interview.findMany({
    where: { userId: req.user.id },
    include: {
      report: {
        select: {
          tech_score: true,
          comm_score: true,
          problemSolvingScore: true,
          clarityScore: true,
          final_verdict: true,
          generationStatus: true,
        },
      },
      application: {
        select: {
          status: true,
          job: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { interviews }, "Interviews fetched successfully")
    );
});

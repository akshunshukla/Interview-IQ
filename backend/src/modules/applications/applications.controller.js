import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadToS3, generatePresignedUrl } from "../../utils/s3.js";

export const applyForJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const applicantId = req.user.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "OPEN") {
    throw new AppError("This job is no longer accepting applications", 404);
  }

  if (job.max_applicants) {
    const appCount = await prisma.application.count({ where: { jobId } });
    if (appCount >= job.max_applicants) {
      throw new AppError("This job has reached the maximum number of applicants", 400);
    }
  }

  const existingApplication = await prisma.application.findFirst({
    where: { jobId, applicantId },
  });
  if (existingApplication) {
    throw new AppError("You have already applied for this job", 400);
  }

  if (!req.file) {
    throw new AppError("Please upload your resume as a PDF", 400);
  }

  let resume_text = "";
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    resume_text = result.text.replace(/\0/g, "");
    await parser.destroy();
  } catch (error) {
    throw new AppError(
      "Failed to read the PDF. Please ensure it is a valid text-based PDF.",
      400
    );
  }

  const resumeS3Url = await uploadToS3(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        jobId,
        applicantId,
        resume_text,
        resumeFileUrl: resumeS3Url,
        status: "APPLIED",
      },
    });

    const interview = await tx.interview.create({
      data: {
        userId: applicantId,
        applicationId: application.id,
        interviewType: "JOB",
        roundType: "SCREENING",
        status: "PENDING",
        maxQuestions: 7,
        resumeText: resume_text,
      },
    });

    return { application, interview };
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        application: result.application,
        interview: result.interview,
      },
      "Successfully applied for the job"
    )
  );
});

export const getJobApplications = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError("Job not found", 404);

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id, orgId: job.orgId },
  });
  if (!membership) {
    throw new AppError("You do not have permission to view this job's applicants", 403);
  }

  const applications = await prisma.application.findMany({
    where: { jobId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      interviews: {
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
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sorted = await Promise.all(applications.map(async (app) => {
    const interview = app.interviews[0];
    const report = interview?.report;
    const avgScore = report
      ? ((report.tech_score || 0) +
        (report.comm_score || 0) +
        (report.problemSolvingScore || 0) +
        (report.clarityScore || 0)) / 4
      : null;
    
    let presignedResume = app.resumeFileUrl;
    if (presignedResume) {
      presignedResume = await generatePresignedUrl(presignedResume);
    }

    return { ...app, resumeFileUrl: presignedResume, _totalScore: avgScore };
  }));

  sorted.sort((a, b) => {
      if (a._totalScore === null && b._totalScore === null) return 0;
      if (a._totalScore === null) return 1;
      if (b._totalScore === null) return -1;
      return b._totalScore - a._totalScore;
    });

  res.status(200).json(new ApiResponse(200, { applications: sorted }));
});

export const updateVerdict = asyncHandler(async (req, res, next) => {
  const { applicationId } = req.params;
  const { status, decisionReason } = req.body;

  const validStatuses = ["SHORTLISTED", "REJECTED", "HIRED"];
  if (!validStatuses.includes(status)) {
    throw new AppError(
      `Status must be one of: ${validStatuses.join(", ")}`,
      400
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id, orgId: application.job.orgId },
  });

  if (!membership) {
    throw new AppError(
      "You do not have permission to update this application",
      403
    );
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status,
      reviewedById: req.user.id,
      reviewedAt: new Date(),
      decisionReason: decisionReason || null,
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { application: updated }, "Verdict updated successfully")
    );
});

export const getApplicationDetails = asyncHandler(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      job: {
        select: {
          id: true,
          title: true,
          job_description: true,
          tech_stack: true,
          workMode: true,
        },
      },
      interviews: {
        include: {
          turns: { orderBy: { turn_number: "asc" } },
          report: true,
          snapshots: { orderBy: { capturedAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id, orgId: application.job.orgId },
  });

  if (!membership) {
    throw new AppError(
      "You do not have permission to view this application",
      403
    );
  }

  if (application.resumeFileUrl) {
    application.resumeFileUrl = await generatePresignedUrl(application.resumeFileUrl);
  }

  if (application.interviews) {
    for (const interview of application.interviews) {
      if (interview.snapshots) {
        for (const snapshot of interview.snapshots) {
          if (snapshot.imageUrl) {
            snapshot.imageUrl = await generatePresignedUrl(snapshot.imageUrl);
          }
        }
      }
      if (interview.turns) {
        for (const turn of interview.turns) {
          if (turn.audioUrl) {
            turn.audioUrl = await generatePresignedUrl(turn.audioUrl);
          }
        }
      }
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, { application }, "Application details fetched"));
});

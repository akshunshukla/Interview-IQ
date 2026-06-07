import crypto from "crypto";
import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const createJob = asyncHandler(async (req, res, next) => {
  const {
    title,
    job_description,
    tech_stack,
    location,
    workMode,
    experienceLevel,
    max_applicants,
    eligibility_rules,
    isUnlisted,
  } = req.body;

  if (!title || !job_description || !max_applicants) {
    throw new AppError(
      "Title, job description, and max applicants are required",
      400,
    );
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id },
  });

  if (!membership) {
    throw new AppError("You must belong to an organization to post a job", 403);
  }

  // Generate a unique access code for unlisted (invite-only) jobs
  const accessCode = isUnlisted
    ? crypto.randomBytes(4).toString("hex").toUpperCase()
    : null;

  const newJob = await prisma.job.create({
    data: {
      orgId: membership.orgId,
      title,
      job_description,
      tech_stack,
      location,
      workMode,
      experienceLevel,
      max_applicants,
      eligibility_rules,
      isUnlisted: Boolean(isUnlisted),
      accessCode,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, { job: newJob }, "Job posted successfully"));
});

export const getAllJobs = asyncHandler(async (req, res, next) => {
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN", isUnlisted: false },
    include: {
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res
    .status(200)
    .json(new ApiResponse(200, { jobs }, "Jobs fetched successfully"));
});

export const getJobByAccessCode = asyncHandler(async (req, res, next) => {
  const { code } = req.params;

  const job = await prisma.job.findUnique({
    where: { accessCode: code },
    include: {
      organization: { select: { name: true } },
    },
  });

  if (!job) {
    throw new AppError("Invalid invite code or job not found", 404);
  }

  if (job.status !== "OPEN") {
    throw new AppError("This job is no longer accepting applications", 410);
  }

  res
    .status(200)
    .json(new ApiResponse(200, { job }, "Job fetched successfully"));
});

export const getMyJobs = asyncHandler(async (req, res, next) => {
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id },
  });

  if (!membership) {
    throw new AppError("You must belong to an organization to view jobs", 403);
  }

  const jobs = await prisma.job.findMany({
    where: { orgId: membership.orgId },
    include: {
      organization: { select: { name: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res
    .status(200)
    .json(new ApiResponse(200, { jobs }, "Jobs fetched successfully"));
});

export const updateJobStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["OPEN", "CLOSED", "PAUSED"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new AppError("Job not found", 404);

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: req.user.id, orgId: job.orgId },
  });

  if (!membership) {
    throw new AppError("You do not have permission to update this job", 403);
  }

  const updatedJob = await prisma.job.update({
    where: { id },
    data: { status },
  });

  res
    .status(200)
    .json(new ApiResponse(200, { job: updatedJob }, "Job status updated"));
});

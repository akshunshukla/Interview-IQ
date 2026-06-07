import express from "express";
import { createJob, getAllJobs, getJobByAccessCode, getMyJobs, updateJobStatus } from "./jobs.controller.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllJobs);
router.get("/invite/:code", getJobByAccessCode);

router.use(protect);
router.get("/my", restrictTo("RECRUITER"), getMyJobs);
router.post("/", restrictTo("RECRUITER"), createJob);
router.patch("/:id/status", restrictTo("RECRUITER"), updateJobStatus);

export default router;

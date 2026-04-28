import express from "express";
import multer from "multer";
import {
  applyForJob,
  getJobApplications,
  updateVerdict,
  getApplicationDetails,
} from "./applications.controller.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect);

router.post(
  "/:jobId/apply",
  restrictTo("CANDIDATE"),
  upload.single("resume"),
  applyForJob
);

router.get("/job/:jobId", restrictTo("RECRUITER"), getJobApplications);

router.get(
  "/:applicationId/details",
  restrictTo("RECRUITER"),
  getApplicationDetails
);

router.patch(
  "/:applicationId/verdict",
  restrictTo("RECRUITER"),
  updateVerdict
);

export default router;

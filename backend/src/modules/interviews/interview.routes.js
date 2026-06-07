import express from "express";
import multer from "multer";
import {
  startInterview,
  processInterviewTurn,
  endInterview,
  getInterviewDetails,
  getMyInterviews,
  processSnapshot,
} from "./interview.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.use(protect);

router.get("/my", getMyInterviews);
router.get("/:id", getInterviewDetails);
router.post("/start", upload.single("resume"), startInterview);
router.post("/turn", upload.single("audio"), processInterviewTurn);
router.post("/snapshot", upload.single("image"), processSnapshot);
router.post("/:id/finish", endInterview);

export default router;

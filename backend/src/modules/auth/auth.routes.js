import express from "express";
import { register, login, getMe, logout } from "./auth.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authLimiter } from "../../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;

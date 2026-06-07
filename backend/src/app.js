import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import { AppError } from "./utils/AppError.js";
import { generalLimiter, authLimiter, interviewLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./modules/auth/auth.routes.js";
import jobRoutes from "./modules/jobs/jobs.routes.js";
import applicationRoutes from "./modules/applications/applications.routes.js";
import interviewRoutes from "./modules/interviews/interview.routes.js";
import prisma from "./config/db.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(generalLimiter);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interview", interviewLimiter, interviewRoutes);

app.get("/api/health", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e) {
    dbStatus = "error";
  }

  res.status(200).json({
    status: "success",
    data: {
      api: "running",
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
    },
  });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;

import { Prisma } from "@prisma/client";

const handlePrismaError = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return { statusCode: 409, message: `Duplicate value for: ${err.meta?.target?.join(", ") || "field"}` };
      case "P2025":
        return { statusCode: 404, message: "Record not found" };
      case "P2003":
        return { statusCode: 400, message: "Related record not found" };
      default:
        return null;
    }
  }
  return null;
};

const handleJWTError = (err) => {
  if (err.name === "JsonWebTokenError") return { statusCode: 401, message: "Invalid token. Please log in again." };
  if (err.name === "TokenExpiredError") return { statusCode: 401, message: "Session expired. Please log in again." };
  return null;
};

const handleMulterError = (err) => {
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") return { statusCode: 413, message: "File too large" };
    return { statusCode: 400, message: err.message };
  }
  return null;
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const prismaErr = handlePrismaError(err);
  const jwtErr = handleJWTError(err);
  const multerErr = handleMulterError(err);
  const handled = prismaErr || jwtErr || multerErr;

  if (handled) {
    return res.status(handled.statusCode).json({
      status: "fail",
      message: handled.message,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    if (!err.isOperational) console.error(`[${new Date().toISOString()}] UNHANDLED:`, err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : "Something went wrong!",
    });
  }
};

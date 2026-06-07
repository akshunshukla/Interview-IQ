import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const isProduction = process.env.NODE_ENV === "production";

const sendTokenCookie = (res, token) => {
  let expireDays = 30;
  if (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN.endsWith("d")) {
    expireDays = parseInt(process.env.JWT_EXPIRES_IN.replace("d", ""), 10) || 30;
  }
  const cookieOptions = {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };
  res.cookie("jwt", token, cookieOptions);
};

export const register = asyncHandler(async (req, res, next) => {
  const { password, name, role, orgName } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!email || !password || !name || !role) {
    throw new AppError("Please provide email, password, name, and role", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email is already in use", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let newUser;

  if (role === "RECRUITER") {
    if (!orgName) throw new AppError("Recruiters must provide an orgName", 400);

    const transactionResult = await prisma.$transaction(
      async (prismaClient) => {
        const org = await prismaClient.organization.create({
          data: { name: orgName },
        });

        const user = await prismaClient.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
          },
        });

        await prismaClient.organizationMembership.create({
          data: {
            userId: user.id,
            orgId: org.id,
            role: "ADMIN",
          },
        });

        return user;
      }
    );

    newUser = transactionResult;
  } else {
    newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });
  }

  const token = signToken(newUser.id);
  sendTokenCookie(res, token);

  newUser.password = undefined;

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: newUser },
        "User registered successfully"
      )
    );
});

export const login = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  const token = signToken(user.id);
  sendTokenCookie(res, token);

  user.password = undefined;

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User logged in successfully"));
});

export const getMe = asyncHandler(async (req, res, next) => {
  const user = { ...req.user };
  delete user.password;

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User fetched successfully"));
});

export const logout = asyncHandler(async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

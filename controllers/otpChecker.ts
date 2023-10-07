import { Request, Response } from "express";
import { PrismaClient } from "../prisma/generated/client";
import ResponseHandler from "../handler/ResponseHandler";
import { z } from "zod";
import ZodErrorHandler from "../handler/ZodErrorHandler";

const prisma = new PrismaClient();

export async function POST(req: Request & { userId: string }, res: Response) {
    const { otp } = req.body;

    const schema = z.object({
        otp: z.number().min(10, "OTP must be 10 characters long"),
    });

    ZodErrorHandler({ otp }, schema);

    const user = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
    });

    if (!user) throw new Error("User not found");

    if (user.otp  !== otp) throw new Error("OTP does not match");

    if (!user.otpExpiry) throw new Error("OTP expiry not found");

    if (user.otpExpiry < new Date()) throw new Error("OTP has expired");

    await prisma.user.update({
        where: {
            id: req.userId,
        },
        data: {
            otp: null,
            otpExpiry: null,
            otpAttempts: 0,
            otpVerified: true,
        },
    });

    return ResponseHandler.success({
        req,
        res,
        data: user,
        message: "OTP Verified",
    });
}


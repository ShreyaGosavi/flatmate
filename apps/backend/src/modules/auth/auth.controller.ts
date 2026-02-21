import type { Request, Response } from "express";
import crypto from "crypto";
import { redis } from "@flatmate/infra";
import { sendEmailVerification as sendVerificationEmail } from "@flatmate/email";
import { registerSchema, loginSchema } from "./auth.schema";
import { hashPassword, verifyPassword, signJwt, setAuthCookie } from "@flatmate/auth";
import { prisma } from "@flatmate/db";

export const sendEmailVerification = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    await redis.del(`email:verified:${email}`);

    const token = crypto.randomBytes(32).toString("hex");

    await redis.set(`email:verify:token:${token}`, email, { ex: 900 });

    await sendVerificationEmail(email, token);

    return res.json({ message: "Verification email sent" });
};

export const verifyEmail = async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;

    if (!token) {
        return res.status(400).json({ error: "Missing token" });
    }

    const email = await redis.get<string>(`email:verify:token:${token}`);

    if (!email) {
        return res.status(400).json({ error: "Invalid or expired token" });
    }

    await redis.set(`email:verified:${email}`, "true", { ex: 3600 });
    await redis.del(`email:verify:token:${token}`);

    return res.json({ message: "Email verified successfully" });
};

export const checkEmailVerification = async (req: Request, res: Response) => {
    const email = req.query.email as string | undefined;

    if (!email) {
        return res.json({ verified: false });
    }

    const raw = await redis.get(`email:verified:${email}`);

    const verified =
        raw === true ||
        raw === "true" ||
        raw === 1 ||
        raw === "1";

    return res.json({ verified });
};

export const register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, password, username, phone, gender } = parsed.data;

    const verified = await redis.get(`email:verified:${email}`);

    if (!verified) {
        return res.status(403).json({ error: "Email not verified" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            username,
            phone,
            gender: gender.toUpperCase() as "MALE" | "FEMALE",
            isEmailVerified: true
        },
    });

    const token = signJwt({ userId: user.id });
    setAuthCookie(res, token);

    return res.status(201).json({ message: "User registered successfully" });
};

export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
        return res.status(403).json({ error: "Email not verified" });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signJwt({ userId: user.id });
    setAuthCookie(res, token);

    return res.json({ message: "Login successful" });
};
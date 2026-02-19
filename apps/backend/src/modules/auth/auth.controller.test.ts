import type { Request, Response } from "express";
import { prisma } from "@flatmate/db";
import { redis } from "@flatmate/infra";
import { hashPassword, verifyPassword, signJwt, setAuthCookie } from "@flatmate/auth";
import {
    register,
    login,
    sendEmailVerification,
    verifyEmail,
    checkEmailVerification,
} from "./auth.controller";

// helpers to mock req/res
const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ body: {}, query: {}, cookies: {}, ...data } as Request);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
};

// reset all mocks before each test
beforeEach(() => jest.clearAllMocks());

// ─── sendEmailVerification ───────────────────────────────────────────────────

describe("sendEmailVerification", () => {
    it("returns 400 if email is missing", async () => {
        const req = mockRequest({ body: {} });
        const res = mockResponse();

        await sendEmailVerification(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Email is required" });
    });

    it("sends verification email and returns 200", async () => {
        const req = mockRequest({ body: { email: "test@example.com" } });
        const res = mockResponse();

        (redis.del as jest.Mock).mockResolvedValue(undefined);
        (redis.set as jest.Mock).mockResolvedValue(undefined);

        await sendEmailVerification(req, res);

        expect(redis.del).toHaveBeenCalledWith("email:verified:test@example.com");
        expect(redis.set).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ message: "Verification email sent" });
    });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────

describe("verifyEmail", () => {
    it("returns 400 if token is missing", async () => {
        const req = mockRequest({ query: {} });
        const res = mockResponse();

        await verifyEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
    });

    it("returns 400 if token is invalid or expired", async () => {
        const req = mockRequest({ query: { token: "invalid_token" } });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue(null);

        await verifyEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    });

    it("verifies email successfully", async () => {
        const req = mockRequest({ query: { token: "valid_token" } });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue("test@example.com");
        (redis.set as jest.Mock).mockResolvedValue(undefined);
        (redis.del as jest.Mock).mockResolvedValue(undefined);

        await verifyEmail(req, res);

        expect(redis.set).toHaveBeenCalledWith(
            "email:verified:test@example.com",
            "true",
            { ex: 3600 }
        );
        expect(redis.del).toHaveBeenCalledWith("email:verify:token:valid_token");
        expect(res.json).toHaveBeenCalledWith({ message: "Email verified successfully" });
    });
});

// ─── checkEmailVerification ───────────────────────────────────────────────────

describe("checkEmailVerification", () => {
    it("returns false if email is missing", async () => {
        const req = mockRequest({ query: {} });
        const res = mockResponse();

        await checkEmailVerification(req, res);

        expect(res.json).toHaveBeenCalledWith({ verified: false });
    });

    it("returns true if email is verified", async () => {
        const req = mockRequest({ query: { email: "test@example.com" } });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue("true");

        await checkEmailVerification(req, res);

        expect(res.json).toHaveBeenCalledWith({ verified: true });
    });

    it("returns false if email is not verified", async () => {
        const req = mockRequest({ query: { email: "test@example.com" } });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue(null);

        await checkEmailVerification(req, res);

        expect(res.json).toHaveBeenCalledWith({ verified: false });
    });
});

// ─── register ────────────────────────────────────────────────────────────────

describe("register", () => {
    const validBody = {
        email: "test@example.com",
        password: "Password1!",
        confirmPassword: "Password1!",
        username: "testuser",
        phone: "+911234567890",
        gender: "male",
    };

    it("returns 400 if body is invalid", async () => {
        const req = mockRequest({ body: {} });
        const res = mockResponse();

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 if email is not verified", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue(null);

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Email not verified" });
    });

    it("returns 409 if user already exists", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue("true");
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "1", email: validBody.email });

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
    });

    it("registers user successfully", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (redis.get as jest.Mock).mockResolvedValue("true");
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: "1", email: validBody.email });

        await register(req, res);

        expect(hashPassword).toHaveBeenCalledWith(validBody.password);
        expect(signJwt).toHaveBeenCalledWith({ userId: "1" });
        expect(setAuthCookie).toHaveBeenCalledWith(res, "mock_jwt_token");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "User registered successfully" });
    });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe("login", () => {
    const validBody = {
        email: "test@example.com",
        password: "Password1!",
    };

    const mockUser = {
        id: "1",
        email: "test@example.com",
        passwordHash: "hashed_password",
        isEmailVerified: true,
    };

    it("returns 400 if body is invalid", async () => {
        const req = mockRequest({ body: {} });
        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 401 if user not found", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password" });
    });

    it("returns 403 if email not verified", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            ...mockUser,
            isEmailVerified: false,
        });

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Email not verified" });
    });

    it("returns 401 if password is wrong", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (verifyPassword as jest.Mock).mockResolvedValue(false);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password" });
    });

    it("logs in successfully", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (verifyPassword as jest.Mock).mockResolvedValue(true);

        await login(req, res);

        expect(signJwt).toHaveBeenCalledWith({ userId: "1" });
        expect(setAuthCookie).toHaveBeenCalledWith(res, "mock_jwt_token");
        expect(res.json).toHaveBeenCalledWith({ message: "Login successful" });
    });
});
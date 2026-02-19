import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt";
import { prisma } from "@flatmate/db";

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = req.cookies?.auth_token;

    if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }

    try {
        const decoded = verifyJwt(token);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            res.status(401).json({ error: "User not found" });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt";
import { prisma } from '@flatmate/db';

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        const decoded = verifyJwt(token);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        
        req.user = user;

        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

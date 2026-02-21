import type { Request, Response, NextFunction } from "express";
import { prisma } from "@flatmate/db";

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
        return res.status(403).json({ error: "Forbidden. Admins only." });
    }

    next();
};
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { prisma } from "@flatmate/db";
import { verifyJwt } from "@flatmate/auth";

export const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

export const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    },
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Unauthorized"));
        const payload = verifyJwt(token);
        socket.data.userId = payload.userId;
        next();
    } catch {
        next(new Error("Unauthorized"));
    }
});

io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    console.log(`User connected: ${userId}`);
    socket.join(userId);

    socket.on("get:conversations", async () => {
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
            include: {
                participant1: { select: { id: true, username: true } },
                participant2: { select: { id: true, username: true } },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { updatedAt: "desc" },
        });
        socket.emit("conversations", conversations);
    });

    socket.on("get:messages", async ({ conversationId }: { conversationId: string }) => {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation ||
            (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
            socket.emit("error", { message: "Unauthorized" });
            return;
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, username: true } } },
        });

        socket.emit("messages", { conversationId, messages });
    });

    socket.on("start:conversation", async ({ otherUserId }: { otherUserId: string }) => {
        if (otherUserId === userId) {
            socket.emit("error", { message: "You cannot chat with yourself." });
            return;
        }

        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: userId, participant2Id: otherUserId },
                    { participant1Id: otherUserId, participant2Id: userId },
                ],
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { participant1Id: userId, participant2Id: otherUserId },
            });
        }

        socket.emit("conversation:started", { conversationId: conversation.id });
    });

    socket.on("send:message", async ({ conversationId, text }: { conversationId: string; text: string }) => {
        if (!text?.trim()) return;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation ||
            (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
            socket.emit("error", { message: "Unauthorized" });
            return;
        }

        const message = await prisma.message.create({
            data: { conversationId, senderId: userId, text: text.trim() },
            include: { sender: { select: { id: true, username: true } } },
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        const otherUserId = conversation.participant1Id === userId
            ? conversation.participant2Id
            : conversation.participant1Id;

        io.to(userId).emit("new:message", { conversationId, message });
        io.to(otherUserId).emit("new:message", { conversationId, message });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId}`);
    });
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
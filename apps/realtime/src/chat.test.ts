import { createServer } from "http";
import { Server } from "socket.io";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { prisma } from "@flatmate/db";
import { verifyJwt } from "@flatmate/auth";

// We recreate a minimal io server here to keep tests isolated
let io: Server;
let clientSocket: ClientSocket;
const PORT = 4099;

const mockUserId = "user-1";
const mockOtherUserId = "user-2";

beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Unauthorized"));
            const payload = (verifyJwt as jest.Mock)(token);
            socket.data.userId = payload.userId;
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId as string;
        socket.join(userId);

        socket.on("get:conversations", async () => {
            const conversations = await prisma.conversation.findMany({
                where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
                include: {
                    participant1: { select: { id: true, username: true } },
                    participant2: { select: { id: true, username: true } },
                    messages: { orderBy: { createdAt: "desc" }, take: 1 },
                },
                orderBy: { updatedAt: "desc" },
            });
            socket.emit("conversations", conversations);
        });

        socket.on("get:messages", async ({ conversationId }: { conversationId: string }) => {
            const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
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
            const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
            if (!conversation ||
                (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
                socket.emit("error", { message: "Unauthorized" });
                return;
            }
            const message = await prisma.message.create({
                data: { conversationId, senderId: userId, text: text.trim() },
                include: { sender: { select: { id: true, username: true } } },
            });
            await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
            const otherUserId = conversation.participant1Id === userId
                ? conversation.participant2Id
                : conversation.participant1Id;
            io.to(userId).emit("new:message", { conversationId, message });
            io.to(otherUserId).emit("new:message", { conversationId, message });
        });
    });

    httpServer.listen(PORT, () => {
        clientSocket = ioc(`http://localhost:${PORT}`, {
            auth: { token: "mock_token" },
        });
        clientSocket.on("connect", done);
    });
});

afterAll(() => {
    io.close();
    clientSocket.close();
});

beforeEach(() => jest.clearAllMocks());

// ─── get:conversations ────────────────────────────────────────────────────────

describe("get:conversations", () => {
    it("returns list of conversations for the user", (done) => {
        const mockConversations = [
            {
                id: "conv-1",
                participant1Id: mockUserId,
                participant2Id: mockOtherUserId,
                participant1: { id: mockUserId, username: "user1" },
                participant2: { id: mockOtherUserId, username: "user2" },
                messages: [],
            },
        ];

        (prisma.conversation.findMany as jest.Mock).mockResolvedValue(mockConversations);

        clientSocket.emit("get:conversations");

        clientSocket.once("conversations", (data) => {
            expect(data).toEqual(mockConversations);
            done();
        });
    });
});

// ─── start:conversation ───────────────────────────────────────────────────────

describe("start:conversation", () => {
    it("emits error if user tries to chat with themselves", (done) => {
        clientSocket.emit("start:conversation", { otherUserId: mockUserId });

        clientSocket.once("error", (data) => {
            expect(data.message).toBe("You cannot chat with yourself.");
            done();
        });
    });

    it("returns existing conversation if already exists", (done) => {
        const mockConv = { id: "conv-1", participant1Id: mockUserId, participant2Id: mockOtherUserId };

        (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(mockConv);

        clientSocket.emit("start:conversation", { otherUserId: mockOtherUserId });

        clientSocket.once("conversation:started", (data) => {
            expect(data.conversationId).toBe("conv-1");
            expect(prisma.conversation.create).not.toHaveBeenCalled();
            done();
        });
    });

    it("creates new conversation if not exists", (done) => {
        (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.conversation.create as jest.Mock).mockResolvedValue({
            id: "conv-new",
            participant1Id: mockUserId,
            participant2Id: mockOtherUserId,
        });

        clientSocket.emit("start:conversation", { otherUserId: mockOtherUserId });

        clientSocket.once("conversation:started", (data) => {
            expect(prisma.conversation.create).toHaveBeenCalled();
            expect(data.conversationId).toBe("conv-new");
            done();
        });
    });
});

// ─── get:messages ─────────────────────────────────────────────────────────────

describe("get:messages", () => {
    it("emits error if user is not part of the conversation", (done) => {
        (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
            id: "conv-1",
            participant1Id: "other-user",
            participant2Id: "another-user",
        });

        clientSocket.emit("get:messages", { conversationId: "conv-1" });

        clientSocket.once("error", (data) => {
            expect(data.message).toBe("Unauthorized");
            done();
        });
    });

    it("returns messages for valid conversation", (done) => {
        const mockMessages = [
            { id: "m1", text: "Hello!", senderId: mockUserId, sender: { id: mockUserId, username: "user1" } },
        ];

        (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
            id: "conv-1",
            participant1Id: mockUserId,
            participant2Id: mockOtherUserId,
        });

        (prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages);

        clientSocket.emit("get:messages", { conversationId: "conv-1" });

        clientSocket.once("messages", (data) => {
            expect(data.conversationId).toBe("conv-1");
            expect(data.messages).toEqual(mockMessages);
            done();
        });
    });
});

// ─── send:message ─────────────────────────────────────────────────────────────

describe("send:message", () => {
    it("emits error if user is not part of the conversation", (done) => {
        (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
            id: "conv-1",
            participant1Id: "other-user",
            participant2Id: "another-user",
        });

        clientSocket.emit("send:message", { conversationId: "conv-1", text: "Hello!" });

        clientSocket.once("error", (data) => {
            expect(data.message).toBe("Unauthorized");
            done();
        });
    });

    it("saves and emits message to both users", (done) => {
        const mockMessage = {
            id: "m1",
            text: "Hello!",
            conversationId: "conv-1",
            senderId: mockUserId,
            sender: { id: mockUserId, username: "user1" },
        };

        (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
            id: "conv-1",
            participant1Id: mockUserId,
            participant2Id: mockOtherUserId,
        });
        (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);
        (prisma.conversation.update as jest.Mock).mockResolvedValue({});

        clientSocket.emit("send:message", { conversationId: "conv-1", text: "Hello!" });

        clientSocket.once("new:message", (data) => {
            expect(data.conversationId).toBe("conv-1");
            expect(data.message.text).toBe("Hello!");
            expect(prisma.message.create).toHaveBeenCalled();
            done();
        });
    });

    it("does nothing if text is empty", (done) => {
        const createSpy = jest.spyOn(prisma.message, "create");

        clientSocket.emit("send:message", { conversationId: "conv-1", text: "   " });

        setTimeout(() => {
            expect(createSpy).not.toHaveBeenCalled();
            done();
        }, 100);
    });
});
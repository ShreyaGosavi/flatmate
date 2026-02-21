import type { Request, Response } from "express";
import { prisma } from "@flatmate/db";
import { sendAdminCommunityRequestMail } from "@flatmate/email";
import {
    searchCommunities,
    requestCommunity,
    joinCommunity,
    getCommunityNotices,
    createNotice,
} from "./community.controller";

const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ body: {}, query: {}, params: {}, ...data } as Request);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockUser = { id: "user-1", email: "test@example.com", username: "testuser" };

beforeEach(() => jest.clearAllMocks());

// ─── searchCommunities ───────────────────────────────────────────────────────

describe("searchCommunities", () => {
    it("returns 400 if query is missing", async () => {
        const req = mockRequest({ query: {} });
        const res = mockResponse();

        await searchCommunities(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Query is required" });
    });

    it("returns communities and showRequestButton false if exact name match", async () => {
        const req = mockRequest({ query: { query: "PICT" } });
        const res = mockResponse();

        (prisma.community.findMany as jest.Mock).mockResolvedValue([
            { id: "c1", name: "PICT", city: "Pune", _count: { members: 10, notices: 5 } },
        ]);

        await searchCommunities(req, res);

        expect(res.json).toHaveBeenCalledWith({
            communities: expect.any(Array),
            showRequestButton: false,
        });
    });

    it("returns showRequestButton true if no exact name match", async () => {
        const req = mockRequest({ query: { query: "PICT" } });
        const res = mockResponse();

        (prisma.community.findMany as jest.Mock).mockResolvedValue([
            { id: "c1", name: "Pune Community", city: "Pune", _count: { members: 5, notices: 2 } },
        ]);

        await searchCommunities(req, res);

        expect(res.json).toHaveBeenCalledWith({
            communities: expect.any(Array),
            showRequestButton: true,
        });
    });
});

// ─── requestCommunity ────────────────────────────────────────────────────────

describe("requestCommunity", () => {
    const validBody = {
        communityName: "PICT",
        type: "COLLEGE",
        city: "Pune",
    };

    it("returns 400 if body is invalid", async () => {
        const req = mockRequest({ body: {}, user: mockUser } as any);
        const res = mockResponse();

        await requestCommunity(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 409 if community already exists", async () => {
        const req = mockRequest({ body: validBody, user: mockUser } as any);
        const res = mockResponse();

        (prisma.community.findUnique as jest.Mock).mockResolvedValue({ id: "c1", name: "PICT", city: "Pune" });

        await requestCommunity(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: "This community already exists. You can join it!",
        }));
    });

    it("returns 409 if request already pending", async () => {
        const req = mockRequest({ body: validBody, user: mockUser } as any);
        const res = mockResponse();

        (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue({ id: "r1" });

        await requestCommunity(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            error: "A request for this community is already pending.",
        });
    });

    it("creates request and sends admin email successfully", async () => {
        const req = mockRequest({ body: validBody, user: mockUser } as any);
        const res = mockResponse();

        (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.communityRequest.create as jest.Mock).mockResolvedValue({ id: "r1", ...validBody });
        (sendAdminCommunityRequestMail as jest.Mock).mockResolvedValue(undefined);

        await requestCommunity(req, res);

        expect(prisma.communityRequest.create).toHaveBeenCalled();
        expect(sendAdminCommunityRequestMail).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Request submitted successfully.",
        }));
    });
});

// ─── joinCommunity ───────────────────────────────────────────────────────────

describe("joinCommunity", () => {
    it("returns 404 if community not found", async () => {
        const req = mockRequest({ params: { id: "c1" }, user: mockUser } as any);
        const res = mockResponse();

        (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);

        await joinCommunity(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Community not found." });
    });

    it("returns 409 if already a member", async () => {
        const req = mockRequest({ params: { id: "c1" }, user: mockUser } as any);
        const res = mockResponse();

        (prisma.community.findUnique as jest.Mock).mockResolvedValue({ id: "c1" });
        (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue({ id: "m1" });

        await joinCommunity(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: "You are already a member." });
    });

    it("joins successfully", async () => {
        const req = mockRequest({ params: { id: "c1" }, user: mockUser } as any);
        const res = mockResponse();

        (prisma.community.findUnique as jest.Mock).mockResolvedValue({ id: "c1" });
        (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.communityMember.create as jest.Mock).mockResolvedValue({ id: "m1" });

        await joinCommunity(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Joined successfully.",
        }));
    });
});

// ─── createNotice ────────────────────────────────────────────────────────────

describe("createNotice", () => {
    const validRoommateBody = {
        type: "ROOMMATE_NEEDED",
        title: "Need a roommate",
        description: "Looking for a roommate in Kothrud",
        metadata: {
            address: "123 Main St, Kothrud",
            contact: "9876543210",
            rent: 6000,
            about: "Spacious room with attached bathroom",
            amenities: ["WIFI", "AC"],
        },
    };

    it("returns 400 if body is invalid", async () => {
        const req = mockRequest({ params: { id: "c1" }, body: {}, user: mockUser } as any);
        const res = mockResponse();

        await createNotice(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 if user is not a member", async () => {
        const req = mockRequest({ params: { id: "c1" }, body: validRoommateBody, user: mockUser } as any);
        const res = mockResponse();

        (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);

        await createNotice(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "You must join this community to post a notice." });
    });

    it("creates notice successfully", async () => {
        const req = mockRequest({ params: { id: "c1" }, body: validRoommateBody, user: mockUser } as any);
        const res = mockResponse();

        (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue({ id: "m1" });
        (prisma.notice.create as jest.Mock).mockResolvedValue({ id: "n1", ...validRoommateBody });

        await createNotice(req, res);

        expect(prisma.notice.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ notice: expect.any(Object) }));
    });
});

import type { Request, Response } from "express";
import { prisma } from "@flatmate/db";
import { sendPropertyVerifiedMail, sendPropertyRejectedMail, sendCommunityRequestStatusMail } from "@flatmate/email";
import {
    getPendingProperties,
    verifyProperty,
    rejectProperty,
    getPendingCommunityRequests,
    approveCommunityRequest,
    rejectCommunityRequest,
} from "./admin.controller";

const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ body: {}, params: {}, ...data } as Request);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => jest.clearAllMocks());

// ─── getPendingProperties ────────────────────────────────────────────────────

describe("getPendingProperties", () => {
    it("returns all pending properties", async () => {
        const req = mockRequest();
        const res = mockResponse();

        (prisma.property.findMany as jest.Mock).mockResolvedValue([
            { id: "p1", title: "2BHK Kothrud", verificationStatus: "PENDING" },
        ]);

        await getPendingProperties(req, res);

        expect(prisma.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { verificationStatus: "PENDING" },
        }));
        expect(res.json).toHaveBeenCalledWith({ properties: expect.any(Array) });
    });
});

// ─── verifyProperty ──────────────────────────────────────────────────────────

describe("verifyProperty", () => {
    const mockProperty = {
        id: "p1",
        title: "2BHK Kothrud",
        verificationStatus: "PENDING",
        User: { email: "owner@example.com", username: "owner" },
    };

    it("returns 404 if property not found", async () => {
        const req = mockRequest({ params: { propertyId: "p1" } });
        const res = mockResponse();

        (prisma.property.findUnique as jest.Mock).mockResolvedValue(null);

        await verifyProperty(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Property not found." });
    });

    it("returns 409 if property already processed", async () => {
        const req = mockRequest({ params: { propertyId: "p1" } });
        const res = mockResponse();

        (prisma.property.findUnique as jest.Mock).mockResolvedValue({
            ...mockProperty,
            verificationStatus: "VERIFIED",
        });

        await verifyProperty(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: "Property already processed." });
    });

    it("verifies property and sends email", async () => {
        const req = mockRequest({ params: { propertyId: "p1" } });
        const res = mockResponse();

        (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
        (prisma.property.update as jest.Mock).mockResolvedValue({});
        (sendPropertyVerifiedMail as jest.Mock).mockResolvedValue(undefined);

        await verifyProperty(req, res);

        expect(prisma.property.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ verificationStatus: "VERIFIED" }),
        }));
        expect(sendPropertyVerifiedMail).toHaveBeenCalledWith("owner@example.com", "2BHK Kothrud");
        expect(res.json).toHaveBeenCalledWith({ message: "Property verified." });
    });
});

// ─── rejectProperty ──────────────────────────────────────────────────────────

describe("rejectProperty", () => {
    const mockProperty = {
        id: "p1",
        title: "2BHK Kothrud",
        verificationStatus: "PENDING",
        User: { email: "owner@example.com" },
    };

    it("returns 404 if property not found", async () => {
        const req = mockRequest({ params: { propertyId: "p1" } });
        const res = mockResponse();

        (prisma.property.findUnique as jest.Mock).mockResolvedValue(null);

        await rejectProperty(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("rejects property and sends email", async () => {
        const req = mockRequest({ params: { propertyId: "p1" } });
        const res = mockResponse();

        (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
        (prisma.property.update as jest.Mock).mockResolvedValue({});
        (sendPropertyRejectedMail as jest.Mock).mockResolvedValue(undefined);

        await rejectProperty(req, res);

        expect(prisma.property.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { verificationStatus: "REJECTED" },
        }));
        expect(sendPropertyRejectedMail).toHaveBeenCalledWith("owner@example.com", "2BHK Kothrud");
        expect(res.json).toHaveBeenCalledWith({ message: "Property rejected." });
    });
});

// ─── getPendingCommunityRequests ─────────────────────────────────────────────

describe("getPendingCommunityRequests", () => {
    it("returns all pending community requests", async () => {
        const req = mockRequest();
        const res = mockResponse();

        (prisma.communityRequest.findMany as jest.Mock).mockResolvedValue([
            { id: "r1", communityName: "PICT", status: "PENDING" },
        ]);

        await getPendingCommunityRequests(req, res);

        expect(prisma.communityRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { status: "PENDING" },
        }));
        expect(res.json).toHaveBeenCalledWith({ requests: expect.any(Array) });
    });
});

// ─── approveCommunityRequest ─────────────────────────────────────────────────

describe("approveCommunityRequest", () => {
    const mockRequest_ = {
        id: "r1",
        communityName: "PICT",
        type: "COLLEGE",
        city: "Pune",
        officialWebsite: null,
        email: null,
        ctgId: null,
        status: "PENDING",
        requestedById: "user-1",
        requestedBy: { email: "user@example.com" },
    };

    it("returns 404 if request not found", async () => {
        const req = mockRequest({ params: { id: "r1" } });
        const res = mockResponse();

        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue(null);

        await approveCommunityRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 409 if already processed", async () => {
        const req = mockRequest({ params: { id: "r1" } });
        const res = mockResponse();

        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue({
            ...mockRequest_,
            status: "APPROVED",
        });

        await approveCommunityRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    it("approves request, creates community, auto-joins user, sends email", async () => {
        const req = mockRequest({ params: { id: "r1" } });
        const res = mockResponse();

        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest_);
        (prisma.community.create as jest.Mock).mockResolvedValue({ id: "c1", name: "PICT" });
        (prisma.communityRequest.update as jest.Mock).mockResolvedValue({});
        (prisma.communityMember.create as jest.Mock).mockResolvedValue({});
        (sendCommunityRequestStatusMail as jest.Mock).mockResolvedValue(undefined);

        await approveCommunityRequest(req, res);

        expect(prisma.community.create).toHaveBeenCalled();
        expect(prisma.communityMember.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { userId: "user-1", communityId: "c1" },
        }));
        expect(sendCommunityRequestStatusMail).toHaveBeenCalledWith(expect.objectContaining({
            status: "APPROVED",
        }));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Approved. Community created.",
        }));
    });
});

// ─── rejectCommunityRequest ──────────────────────────────────────────────────

describe("rejectCommunityRequest", () => {
    const mockRequest_ = {
        id: "r1",
        communityName: "PICT",
        city: "Pune",
        status: "PENDING",
        requestedById: "user-1",
        requestedBy: { email: "user@example.com" },
    };

    it("returns 404 if request not found", async () => {
        const req = mockRequest({ params: { id: "r1" } });
        const res = mockResponse();

        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue(null);

        await rejectCommunityRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("rejects request and sends email", async () => {
        const req = mockRequest({ params: { id: "r1" } });
        const res = mockResponse();

        (prisma.communityRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest_);
        (prisma.communityRequest.update as jest.Mock).mockResolvedValue({});
        (sendCommunityRequestStatusMail as jest.Mock).mockResolvedValue(undefined);

        await rejectCommunityRequest(req, res);

        expect(sendCommunityRequestStatusMail).toHaveBeenCalledWith(expect.objectContaining({
            status: "REJECTED",
        }));
        expect(res.json).toHaveBeenCalledWith({ message: "Request rejected." });
    });
});

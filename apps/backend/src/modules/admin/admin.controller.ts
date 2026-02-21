import type { Request, Response } from "express";
import { prisma } from "@flatmate/db";
import { sendCommunityRequestStatusMail, sendPropertyVerifiedMail, sendPropertyRejectedMail } from "@flatmate/email";

// ============================================
// PROPERTY
// ============================================

export const getPendingProperties = async (req: Request, res: Response) => {
    const properties = await prisma.property.findMany({
        where: { verificationStatus: "PENDING" },
        select: {
            id: true,
            title: true,
            propertyType: true,
            city: true,
            rent: true,
            createdAt: true,
            ownershipProof: true,
            User: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return res.json({ properties });
};

export const verifyProperty = async (req: Request, res: Response) => {
    const propertyId = req.params.propertyId as string;

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { User: { select: { email: true, username: true } } },
    });
    if (!property) return res.status(404).json({ error: "Property not found." });
    if (property.verificationStatus !== "PENDING") {
        return res.status(409).json({ error: "Property already processed." });
    }

    await prisma.property.update({
        where: { id: propertyId },
        data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
    });

    await sendPropertyVerifiedMail(property.User.email, property.title);

    return res.json({ message: "Property verified." });
};

export const rejectProperty = async (req: Request, res: Response) => {
    const propertyId = req.params.propertyId as string;

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { User: { select: { email: true } } },
    });
    if (!property) return res.status(404).json({ error: "Property not found." });
    if (property.verificationStatus !== "PENDING") {
        return res.status(409).json({ error: "Property already processed." });
    }

    await prisma.property.update({
        where: { id: propertyId },
        data: { verificationStatus: "REJECTED" },
    });

    await sendPropertyRejectedMail(property.User.email, property.title);

    return res.json({ message: "Property rejected." });
};

// ============================================
// COMMUNITY REQUESTS
// ============================================

export const getPendingCommunityRequests = async (req: Request, res: Response) => {
    const requests = await prisma.communityRequest.findMany({
        where: { status: "PENDING" },
        include: { requestedBy: { select: { id: true, username: true, email: true } } },
        orderBy: { createdAt: "desc" },
    });

    return res.json({ requests });
};

export const approveCommunityRequest = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const request = await prisma.communityRequest.findUnique({
        where: { id },
        include: { requestedBy: { select: { email: true } } },
    });
    if (!request) return res.status(404).json({ error: "Request not found." });
    if (request.status !== "PENDING") return res.status(409).json({ error: "Request already processed." });

    const community = await prisma.community.create({
        data: {
            name: request.communityName,
            type: request.type,
            city: request.city,
            officialWebsite: request.officialWebsite,
            email: request.email,
            ctgId: request.ctgId,
        },
    });

    await prisma.communityRequest.update({
        where: { id },
        data: { status: "APPROVED" },
    });

    // auto-join the person who requested it
    await prisma.communityMember.create({
        data: { userId: request.requestedById, communityId: community.id },
    });

    await sendCommunityRequestStatusMail({
        userEmail: request.requestedBy.email,
        communityName: request.communityName,
        city: request.city,
        status: "APPROVED",
    });

    return res.json({ message: "Approved. Community created.", community });
};

export const rejectCommunityRequest = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const request = await prisma.communityRequest.findUnique({
        where: { id },
        include: { requestedBy: { select: { email: true } } },
    });
    if (!request) return res.status(404).json({ error: "Request not found." });
    if (request.status !== "PENDING") return res.status(409).json({ error: "Request already processed." });

    await prisma.communityRequest.update({
        where: { id },
        data: { status: "REJECTED" },
    });

    await sendCommunityRequestStatusMail({
        userEmail: request.requestedBy.email,
        communityName: request.communityName,
        city: request.city,
        status: "REJECTED",
    });

    return res.json({ message: "Request rejected." });
};
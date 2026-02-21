import type { Request, Response } from "express";
import { prisma } from "@flatmate/db";
import { communityRequestSchema, createNoticeSchema } from "./community.schema";
import { sendAdminCommunityRequestMail } from "@flatmate/email";

export const searchCommunities = async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
    }

    const communities = await prisma.community.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { city: { contains: query, mode: "insensitive" } },
            ],
        },
        include: {
            _count: { select: { members: true, notices: true } },
        },
    });

    const exactNameMatch = communities.some(
        (c) => c.name.toLowerCase() === query.toLowerCase()
    );

    return res.json({
        communities,
        showRequestButton: !exactNameMatch,
    });
};

export const requestCommunity = async (req: Request, res: Response) => {
    const parsed = communityRequestSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { communityName, type, city, officialWebsite, email, ctgId } = parsed.data;
    const userId = req.user!.id;

    const existingCommunity = await prisma.community.findUnique({
        where: { name_city: { name: communityName, city } },
    });
    if (existingCommunity) {
        return res.status(409).json({
            error: "This community already exists. You can join it!",
            communityId: existingCommunity.id,
        });
    }

    const existingRequest = await prisma.communityRequest.findUnique({
        where: { communityName_city: { communityName, city } },
    });
    if (existingRequest) {
        return res.status(409).json({
            error: "A request for this community is already pending.",
        });
    }

    const request = await prisma.communityRequest.create({
        data: { requestedById: userId, communityName, type, city, officialWebsite, email, ctgId },
    });

    await sendAdminCommunityRequestMail({
        communityName,
        type,
        city,
        officialWebsite,
        email,
        ctgId,
        requestedByUsername: req.user!.username,
        requestedByEmail: req.user!.email,
    });

    return res.status(201).json({ message: "Request submitted successfully.", request });
};

export const joinCommunity = async (req: Request, res: Response) => {
    const communityId = req.params.id as string;  // ← cast here
    const userId = req.user!.id;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
        return res.status(404).json({ error: "Community not found." });
    }

    const alreadyMember = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId } },
    });
    if (alreadyMember) {
        return res.status(409).json({ error: "You are already a member." });
    }

    const member = await prisma.communityMember.create({
        data: { userId, communityId },
    });

    return res.status(201).json({ message: "Joined successfully.", member });
};

export const getCommunityNotices = async (req: Request, res: Response) => {
    const communityId = req.params.id as string;
    const type = req.query.type as string | undefined;

    const notices = await prisma.notice.findMany({
        where: {
            communityId,           // ← use this
            isActive: true,
            ...(type ? { type: type as "ROOMMATE_NEEDED" | "SPARE_ITEM_GIVEAWAY" } : {}),
        },
        include: {
            postedBy: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return res.json({ notices });
};

export const createNotice = async (req: Request, res: Response) => {
    const parsed = createNoticeSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const communityId = req.params.id as string;
    const userId = req.user!.id;

    const membership = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId } },
    });
    if (!membership) {
        return res.status(403).json({ error: "You must join this community to post a notice." });
    }

    const notice = await prisma.notice.create({
        data: {
            communityId,          // ← use the casted variable
            postedById: userId,
            ...parsed.data,
        },
    });

    return res.status(201).json({ notice });
};
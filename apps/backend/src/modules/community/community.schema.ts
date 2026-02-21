import { z } from "zod";

export const communityRequestSchema = z.object({
    communityName: z.string().min(2),
    type: z.enum(["COLLEGE", "COMPANY"]),
    city: z.string().min(2),
    officialWebsite: z.string().url().optional(),
    email: z.string().email().optional(),
    ctgId: z.string().optional(),
});

const roommateMetadataSchema = z.object({
    address: z.string().min(5),
    contact: z.string().min(10),
    rent: z.number().positive(),
    about: z.string().min(10),
    amenities: z.array(z.enum([
        "WIFI", "AC", "PARKING", "LAUNDRY", "GYM",
        "POWER_BACKUP", "WATER_SUPPLY", "FURNISHED_BED",
        "ATTACHED_BATHROOM", "SECURITY", "CCTV", "LIFT",
        "PURIFIER", "OTHERS"
    ])).optional(),
});

const giveawayMetadataSchema = z.object({
    address: z.string().min(5),
    contact: z.string().min(10),
});

export const createNoticeSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("ROOMMATE_NEEDED"),
        title: z.string().min(3),
        description: z.string().min(10),
        metadata: roommateMetadataSchema,
    }),
    z.object({
        type: z.literal("SPARE_ITEM_GIVEAWAY"),
        title: z.string().min(3),
        description: z.string().min(10),
        metadata: giveawayMetadataSchema,
    }),
]);

export type CommunityRequestInput = z.infer<typeof communityRequestSchema>;
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;

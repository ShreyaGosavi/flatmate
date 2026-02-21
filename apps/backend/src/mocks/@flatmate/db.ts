import { mockDeep } from "jest-mock-extended";
import type { PrismaClient } from "@flatmate/db";

export const prisma = mockDeep<PrismaClient>();

export enum PropertyType {
    HOSTEL = "HOSTEL",
    PG = "PG",
    APARTMENT = "APARTMENT",
    OTHER = "OTHER"
}

export enum BHK {
    ONE_BHK = "ONE_BHK",
    TWO_BHK = "TWO_BHK",
    THREE_BHK = "THREE_BHK",
    FOUR_BHK = "FOUR_BHK",
    ONE_RK = "ONE_RK"
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE"
}

export enum AmenityType {
    WIFI = "WIFI",
    AC = "AC",
    PARKING = "PARKING",
    LAUNDRY = "LAUNDRY",
    GYM = "GYM",
    POWER_BACKUP = "POWER_BACKUP",
    WATER_SUPPLY = "WATER_SUPPLY",
    FURNISHED_BED = "FURNISHED_BED",
    ATTACHED_BATHROOM = "ATTACHED_BATHROOM",
    SECURITY = "SECURITY",
    CCTV = "CCTV",
    LIFT = "LIFT",
    PURIFIER = "PURIFIER",
    OTHERS = "OTHERS"
}

export enum PropertyVerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}

export enum NoticeType {
    ROOMMATE_NEEDED = "ROOMMATE_NEEDED",
    SPARE_ITEM_GIVEAWAY = "SPARE_ITEM_GIVEAWAY"
}

export enum CommunityType {
    COLLEGE = "COLLEGE",
    COMPANY = "COMPANY"
}

export enum RequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

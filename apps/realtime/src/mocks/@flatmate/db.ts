import { mockDeep } from "jest-mock-extended";
import type { PrismaClient } from "@flatmate/db";

export const prisma = mockDeep<PrismaClient>();

import { prisma } from "@flatmate/db";

export async function savePropertyService(userId: string, propertyId: string) {
    await prisma.$transaction(async (tx) => {
        const existing = await tx.savedProperty.findUnique({
            where: { userId_propertyId: { userId, propertyId } }
        });

        if (existing) return;

        await tx.savedProperty.create({
            data: {
                userId,
                propertyId
            }
        });

        await tx.propertyStats.update({
            where: { propertyId },
            data: { saveCount: { increment: 1 } }
        }).catch(() => {});
    });
}

export async function unsavePropertyService(userId: string, propertyId: string) {
    await prisma.$transaction(async (tx) => {
        const existing = await tx.savedProperty.findUnique({
            where: { userId_propertyId: { userId, propertyId } }
        });

        if (!existing) return;

        await tx.savedProperty.delete({
            where: { userId_propertyId: { userId, propertyId } }
        });

        await tx.propertyStats.update({
            where: { propertyId },
            data: { saveCount: { decrement: 1 } }
        }).catch(() => {});
    });
}

export async function getSavedPropertiesService(userId: string) {
    return prisma.savedProperty.findMany({
        where: { userId },
        orderBy: { savedAt: "desc" },
        select: {
            Property: {
                select: {
                    id: true,
                    title: true,
                    rent: true,
                    bhk: true,
                    formattedAddress: true,
                    images: true,
                    verificationStatus: true
                }
            }
        }
    });
}
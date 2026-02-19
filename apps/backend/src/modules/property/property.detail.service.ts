import { prisma } from "@flatmate/db";

export async function getPropertyByIdService(propertyId: string) {
    return prisma.$transaction(async (tx) => {
        await tx.propertyStats.update({
            where: { propertyId },
            data: { viewCount: { increment: 1 } }
        }).catch(() => {});

        const property = await tx.property.findUnique({
            where: { id: propertyId },
            select: {
                id: true,
                title: true,
                description: true,
                rent: true,
                deposit: true,
                maintenance: true,
                propertyType: true,
                sharing: true,
                bhk: true,
                genderPreference: true,
                verificationStatus: true,
                visitingHrs: true,
                amenities: true,
                rules: true,
                images: true,
                latitude: true,
                longitude: true,
                formattedAddress: true,
                User: {
                    select: {
                        username: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        if (!property) return null;

        return {
            id: property.id,
            title: property.title,
            description: property.description,
            rent: property.rent,
            deposit: property.deposit,
            maintenance: property.maintenance,
            propertyType: property.propertyType,
            sharing: property.sharing,
            bhk: property.bhk,
            genderPreference: property.genderPreference,
            verificationStatus: property.verificationStatus,
            owner: {
                name: property.User.username,
                email: property.User.email,
                phone: property.User.phone
            },
            visitingHrs: property.visitingHrs,
            amenities: property.amenities,
            rules: property.rules,
            images: property.images,
            location: {
                latitude: property.latitude,
                longitude: property.longitude,
                formattedAddress: property.formattedAddress
            }
        };
    });
}
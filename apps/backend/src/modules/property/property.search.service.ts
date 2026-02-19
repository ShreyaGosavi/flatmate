import { prisma } from "@flatmate/db";
import { Prisma } from "@flatmate/db";

interface SearchInput {
    lat: number;
    lng: number;
    radiusKm: number;
    gender: string | undefined;
    sharingLte: number | undefined;
    minRent: number | undefined;
    maxRent: number | undefined;
    page: number;
    limit: number;
}

export async function searchPropertiesService(input: SearchInput) {
    const { lat, lng, radiusKm, gender, sharingLte, minRent, maxRent, page, limit } = input;
    const offset = (page - 1) * limit;

    const results = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
            id,
            title,
            rent,
            sharing,
            "genderPreference",
            bhk,
            "formattedAddress",
            "verificationStatus",
            (
                6371 * acos(
                    cos(radians(${lat})) * cos(radians(latitude))
                    * cos(radians(longitude) - radians(${lng}))
                    + sin(radians(${lat})) * sin(radians(latitude))
                )
            ) AS distance
        FROM "Property"
        WHERE
            "isAvailable" = true
            AND "verificationStatus" = 'VERIFIED'
            AND (
                6371 * acos(
                    cos(radians(${lat})) * cos(radians(latitude))
                    * cos(radians(longitude) - radians(${lng}))
                    + sin(radians(${lat})) * sin(radians(latitude))
                )
            ) <= ${radiusKm}
            AND (${gender ?? null}::text IS NULL OR "genderPreference" = ${gender ?? null})
            AND (${sharingLte ?? null}::int IS NULL OR sharing <= ${sharingLte ?? null})
            AND (${minRent ?? null}::int IS NULL OR rent >= ${minRent ?? null})
            AND (${maxRent ?? null}::int IS NULL OR rent <= ${maxRent ?? null})
        ORDER BY distance ASC, rent ASC
        LIMIT ${limit} OFFSET ${offset}
    `);

    return {
        page,
        limit,
        results: results.map(r => ({
            id: r.id,
            title: r.title,
            rent: r.rent,
            sharing: r.sharing,
            genderPreference: r.genderPreference,
            bhk: r.bhk,
            formattedAddress: r.formattedAddress,
            verificationStatus: r.verificationStatus
        }))
    };
}
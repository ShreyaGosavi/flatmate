import { z } from "zod";
import { Gender, PropertyType, BHK, AmenityType } from "@flatmate/db";

export const createPropertySchema = z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    propertyType: z.nativeEnum(PropertyType),
    rent: z.number().int().min(0),
    deposit: z.number().int().min(0),
    maintenance: z.number().int().min(0),
    isAvailable: z.boolean().optional().default(true),
    sharing: z.number().int().min(1),
    genderPreference: z.nativeEnum(Gender),
    bhk: z.nativeEnum(BHK),
    suitableFitFor: z.string().optional(),
    addressLine1: z.string().min(3),
    addressLine2: z.string().optional(),
    locality: z.string().min(2),
    city: z.string().min(2),
    district: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(4),
    latitude: z.number().refine(v => v >= -90 && v <= 90),
    longitude: z.number().refine(v => v >= -180 && v <= 180),
    formattedAddress: z.string().optional(),
    placeId: z.string().optional(),
    visitingHrs: z.string().optional(),
    amenities: z.array(z.nativeEnum(AmenityType)).min(1),
    rules: z.record(z.string(), z.any()).optional()
});

export const parsePropertyBody = (body: Record<string, any>) => {
    return {
        ...body,
        rent: Number(body.rent),
        deposit: Number(body.deposit),
        maintenance: Number(body.maintenance),
        sharing: Number(body.sharing),
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        isAvailable: body.isAvailable !== undefined
            ? body.isAvailable === "true"
            : undefined,
        amenities: typeof body.amenities === "string"
            ? JSON.parse(body.amenities)
            : body.amenities,
        rules: body.rules ? JSON.parse(body.rules) : undefined
    };
};
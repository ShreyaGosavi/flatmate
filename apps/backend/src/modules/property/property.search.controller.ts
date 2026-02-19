import type { Request, Response } from "express";
import { searchPropertiesService } from "./property.search.service";

export const searchPropertiesController = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            lat,
            lng,
            radius = "5",
            gender,
            sharing_lte,
            minRent,
            maxRent,
            page = "1",
            limit = "10"
        } = req.query;

        // Required geo params
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "lat and lng are required for search"
            });
        }

        const result = await searchPropertiesService({
            lat: Number(lat),
            lng: Number(lng),
            radiusKm: Number(radius),
            gender: gender as string | undefined,
            sharingLte: sharing_lte ? Number(sharing_lte) : undefined,
            minRent: minRent ? Number(minRent) : undefined,
            maxRent: maxRent ? Number(maxRent) : undefined,
            page: Number(page),
            limit: Number(limit)
        });

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error: any) {
        console.error("SEARCH PROPERTIES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search properties"
        });
    }
};

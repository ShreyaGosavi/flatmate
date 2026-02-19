import type { Request, Response } from "express";
import { getPropertyByIdService } from "./property.detail.service";

export const getPropertyByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const rawPropertyId = req.params.propertyId;

        // Normalize param
        const propertyId = Array.isArray(rawPropertyId)
            ? rawPropertyId[0]
            : rawPropertyId;

        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

        const property = await getPropertyByIdService(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        return res.status(200).json({
            success: true,
            property
        });

    } catch (error: any) {
        console.error("GET PROPERTY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch property"
        });
    }
};

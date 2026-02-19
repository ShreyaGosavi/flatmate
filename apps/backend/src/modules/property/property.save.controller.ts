import type { Request, Response } from "express";
import {
    savePropertyService,
    unsavePropertyService,
    getSavedPropertiesService
} from "./property.save.service";

export const savePropertyController = async (req: Request, res: Response) => {
    try {
        const propertyIdParam = req.params.propertyId;

        if (typeof propertyIdParam !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid propertyId"
            });
        }

        await savePropertyService(req.user!.id, propertyIdParam);

        return res.status(200).json({ success: true });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const unsavePropertyController = async (req: Request, res: Response) => {
    try {
        const propertyIdParam = req.params.propertyId;

        if (typeof propertyIdParam !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid propertyId"
            });
        }

        await unsavePropertyService(req.user!.id, propertyIdParam);

        return res.status(200).json({ success: true });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getSavedPropertiesController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (typeof userId !== "string") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const savedProperties = await getSavedPropertiesService(userId);

        return res.status(200).json({
            success: true,
            results: savedProperties
        });

    } catch (error: any) {
        console.error("GET SAVED PROPERTIES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch saved properties"
        });
    }
};
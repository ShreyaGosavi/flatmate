import type { Request, Response } from "express";
import { createPropertySchema, parsePropertyBody } from "./property.schema";
import { createPropertyService } from "./property.service";
import { sendAdminPropertySubmissionMail, sendUserPropertyConfirmationMail } from "@flatmate/email";

export const createPropertyController = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false });
        }

        const parsedBody = parsePropertyBody(req.body);
        const validatedData = createPropertySchema.parse(parsedBody);

        const { propertyId } = await createPropertyService({
            data: validatedData,
            files: req.files as any,
            ownerId: req.user.id
        });

        sendAdminPropertySubmissionMail(propertyId, req.user.id).catch(console.error);
        sendUserPropertyConfirmationMail(req.user.email).catch(console.error);

        return res.status(201).json({ success: true, propertyId });

    } catch (err: any) {
        console.error("PROPERTY ERROR:", err);

        if (err.name === "ZodError") {
            return res.status(400).json({ success: false, errors: err.errors });
        }

        return res.status(500).json({ success: false, message: err.message });
    }
};
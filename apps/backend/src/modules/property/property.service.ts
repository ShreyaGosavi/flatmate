import { prisma } from "@flatmate/db";
import { uploadToCloudinary, deleteFromCloudinary } from "@flatmate/infra";
import type { Express } from "express";

interface CreatePropertyServiceInput {
    data: any;
    files: {
        images?: Express.Multer.File[];
        ownershipProof?: Express.Multer.File[];
    };
    ownerId: string;
}

export async function createPropertyService({
                                                data,
                                                files,
                                                ownerId,
                                            }: CreatePropertyServiceInput): Promise<{ propertyId: string }> {
    const uploadedImageUrls: string[] = [];
    let ownershipProofUrl: string | undefined;

    try {
        if (!files.images || files.images.length === 0) {
            throw new Error("At least one image is required");
        }

        for (const image of files.images) {
            const url = await uploadToCloudinary(
                image.buffer,
                "properties/images",
                "image"
            );
            uploadedImageUrls.push(url);
        }

        if (files.ownershipProof && files.ownershipProof[0]) {
            const file = files.ownershipProof[0];
            ownershipProofUrl = await uploadToCloudinary(
                file.buffer,
                "properties/documents",
                file.mimetype === "application/pdf" ? "raw" : "image"
            );
        }

        const property = await prisma.$transaction(async (tx) => {
            const createdProperty = await tx.property.create({
                data: {
                    ...data,
                    images: uploadedImageUrls,
                    ownershipProof: ownershipProofUrl,
                    ownerId
                },
            });

            await tx.propertyStats.create({
                data: { propertyId: createdProperty.id },
            });

            return createdProperty;
        });

        return { propertyId: property.id };

    } catch (error) {
        for (const url of uploadedImageUrls) {
            await deleteFromCloudinary(url).catch(() => {});
        }

        if (ownershipProofUrl) {
            await deleteFromCloudinary(ownershipProofUrl).catch(() => {});
        }

        throw error;
    }
}
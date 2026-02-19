import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.fieldname === "images") {
        if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
            throw new Error("Only JPG, PNG, and WEBP images are allowed");
        }
    }

    if (file.fieldname === "ownershipProof") {
        if (!DOC_MIME_TYPES.includes(file.mimetype)) {
            throw new Error("Ownership proof must be PDF or image");
        }
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const propertyUpload = upload.fields([
    { name: "images", maxCount: 10 },
    { name: "ownershipProof", maxCount: 1 }
]);
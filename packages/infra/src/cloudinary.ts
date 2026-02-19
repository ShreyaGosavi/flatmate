import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});



export const uploadToCloudinary = (
    fileBuffer: Buffer,
    folder: string,
    resourceType: "image" | "raw" = "image"
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );

        Readable.from(fileBuffer).pipe(uploadStream);
    });
};

export const deleteFromCloudinary = async (publicUrl: string) => {
    if (!publicUrl) return;

    const parts = publicUrl.split("/");

    if (parts.length < 2) {
        throw new Error("Invalid Cloudinary URL");
    }

    const publicIdWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];

    if (!publicIdWithExt || !folder) {
        throw new Error("Invalid Cloudinary URL structure");
    }

    const publicId = `${folder}/${publicIdWithExt.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
};
export default cloudinary;

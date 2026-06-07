import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "./AppError.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (fileBuffer, originalName, mimetype) => {
  try {
    const fileExtension = originalName.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    return fileName;
  } catch (error) {
    throw new AppError("Failed to upload file to S3", 500);
  }
};

export const generatePresignedUrl = async (key) => {
  if (!key) return null;
  // If it's already a full URL (legacy data), just return it
  if (key.startsWith("http")) return key;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });
    // Link expires in 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return null;
  }
};

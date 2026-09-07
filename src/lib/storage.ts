import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

// Configuration for Cloudflare R2 / AWS S3 / S3-compatible storage
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const accountId = process.env.R2_ACCOUNT_ID;
const endpoint = process.env.S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const region = process.env.S3_REGION || (accountId ? "auto" : "us-east-1");

const isS3Configured = Boolean(accessKeyId && secretAccessKey && bucketName);

// Initialize S3 / R2 client if configured
let s3Client: S3Client | null = null;
if (isS3Configured) {
  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

// Local fallback directory for development when live storage is not yet set up
const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".storage", "vault");

async function ensureLocalDir() {
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

// Upload file (Buffer or Uint8Array)
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; key: string }> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return { success: true, key };
  }

  // Local fallback mode
  await ensureLocalDir();
  const filePath = path.join(LOCAL_STORAGE_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { success: true, key };
}

// Generate secure presigned URL for preview (inline display)
export async function getPreviewSignedUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 900 // 15 minutes
): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentType: contentType,
      ResponseContentDisposition: "inline",
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  // Local fallback route
  return `/api/documents/raw/${encodeURIComponent(key)}?disposition=inline`;
}

// Generate secure presigned URL for download (forced attachment)
export async function getDownloadSignedUrl(
  key: string,
  fileName: string,
  expiresInSeconds: number = 900 // 15 minutes
): Promise<string> {
  if (isS3Configured && s3Client) {
    const cleanName = fileName.replace(/["\r\n]/g, "_");
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(cleanName)}"`,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  // Local fallback route
  return `/api/documents/raw/${encodeURIComponent(key)}?disposition=attachment&filename=${encodeURIComponent(fileName)}`;
}

// Delete file from storage
export async function deleteFile(key: string): Promise<{ success: boolean }> {
  if (isS3Configured && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true };
  }

  // Local fallback mode
  try {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    await fs.unlink(filePath);
  } catch {
    // Ignore if file doesn't exist
  }
  return { success: true };
}

// For fallback local mode: retrieve raw file
export async function getLocalFile(key: string): Promise<{ buffer: Buffer; exists: boolean }> {
  try {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    const buffer = await fs.readFile(filePath);
    return { buffer, exists: true };
  } catch {
    return { buffer: Buffer.from(""), exists: false };
  }
}

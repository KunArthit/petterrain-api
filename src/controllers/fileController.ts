// fileController.ts
import { Elysia, t } from "elysia";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

// Define upload directories
const IMAGES_DIR = join(process.cwd(), "images");
const VIDEOS_DIR = join(process.cwd(), "videos");

// Ensure the upload directories exist
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true });
}
if (!existsSync(VIDEOS_DIR)) {
  mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Define video MIME types
const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo", // .avi
  "video/x-ms-wmv", // .wmv
  "video/webm",
  "video/ogg",
  "video/3gpp",
  "video/x-flv",
  "video/x-matroska", // .mkv
];

// Define image MIME types
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

export const fileController = new Elysia({
  prefix: "/uploads",
  tags: ["Upload"],
}).post(
  "/",
  async ({ body, set }) => {
    try {
      // Check if a file was uploaded
      if (!body || !body.file) {
        set.status = 400;
        return { error: "No file provided" };
      }

      const file = body.file;
      const fileType = file.type;

      // Determine if it's a video or image
      let uploadDir: string;
      let pathPrefix: string;

      if (VIDEO_MIME_TYPES.includes(fileType)) {
        uploadDir = VIDEOS_DIR;
        pathPrefix = "/videos";
      } else if (IMAGE_MIME_TYPES.includes(fileType)) {
        uploadDir = IMAGES_DIR;
        pathPrefix = "/images";
      } else {
        set.status = 400;
        return {
          error: "Unsupported file type",
          supportedTypes:
            "Images (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF) and Videos (MP4, MPEG, QuickTime, AVI, WMV, WebM, OGG, 3GP, FLV, MKV)",
        };
      }

      // Generate a unique filename while preserving the original extension
      const originalName = file.name;
      const fileExtension = originalName.split(".").pop() || "";
      const uniqueFilename = `${randomUUID()}.${fileExtension}`;
      const filePath = join(uploadDir, uniqueFilename);

      // Stream file to disk
      const writeStream = createWriteStream(filePath);
      const buffer = await file.arrayBuffer();

      writeStream.write(Buffer.from(buffer));
      writeStream.end();

      // Return the path accessible from the web
      return {
        originalName,
        filename: uniqueFilename,
        path: `${pathPrefix}/${uniqueFilename}`,
        size: file.size,
        type: file.type,
        category: VIDEO_MIME_TYPES.includes(fileType) ? "video" : "image",
      };
    } catch (error) {
      console.error("File upload error:", error);
      set.status = 500;
      return { error: "Failed to upload file" };
    }
  },
  {
    // Define multipart/form-data body type
    body: t.Object({
      file: t.File({
        // Increased file size limit to accommodate videos
        maxSize: 1000 * 1024 * 1024, // 1GB maximum file size
      }),
    }),
  }
);

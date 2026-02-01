import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-rar-compressed",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;

function sanitizeFilename(name: string): string {
  // Remove path traversal, null bytes, and special characters
  return name
    .replace(/[/\\:\0]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^\w\s.\-()а-яА-ЯёЁ]/g, "_")
    .trim()
    .slice(0, 255);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Максимум ${MAX_FILES_PER_REQUEST} файлов за раз` },
        { status: 400 }
      );
    }

    // Validate all files before processing
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл "${file.name}" превышает лимит 10 МБ` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `Недопустимый тип файла: ${file.name} (${file.type || "unknown"})` },
          { status: 400 }
        );
      }
    }

    // Ensure upload directory exists
    const dateDir = new Date().toISOString().slice(0, 7); // YYYY-MM
    const uploadPath = path.join(UPLOAD_DIR, dateDir);
    await mkdir(uploadPath, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename, preserve extension
      const ext = path.extname(file.name).toLowerCase();
      const key = crypto.randomBytes(16).toString("hex") + ext;
      const filePath = path.join(uploadPath, key);

      await writeFile(filePath, buffer);

      uploadedFiles.push({
        name: sanitizeFilename(file.name),
        url: `/uploads/${dateDir}/${key}`,
        key: `${dateDir}/${key}`,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

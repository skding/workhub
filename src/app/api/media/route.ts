import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getOneDriveRoot } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get("path");

    if (!relPath) {
      return new NextResponse("Missing path parameter", { status: 400 });
    }

    const root = getOneDriveRoot();
    const fullPath = path.resolve(root, relPath);

    // Prevent path traversal outside root
    if (!fullPath.startsWith(root)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".txt") contentType = "text/plain";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Media serving error:", error);
    return new NextResponse("Error reading file", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import { getOneDriveRoot } from "@/lib/storage";

export async function GET() {
  try {
    const rootPath = getOneDriveRoot();
    const exists = fs.existsSync(rootPath);

    return NextResponse.json({
      success: true,
      data: {
        method: "RCLONE_SYNC",
        storageRoot: rootPath,
        exists,
        connected: true,
        provider: "Microsoft 365 1TB OneDrive (via Rclone / Synced Directory)",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}

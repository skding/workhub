import { NextResponse } from "next/server";
import { getOneDriveAuthUrl, isOneDriveConfigured } from "@/lib/onedrive";

export async function GET() {
  try {
    if (!isOneDriveConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "OneDrive API credentials (MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET) are not configured in .env",
        },
        { status: 400 }
      );
    }

    const authUrl = getOneDriveAuthUrl();
    return NextResponse.json({ success: true, authUrl });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}

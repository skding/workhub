import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    await db.integration.upsert({
      where: { provider: "onedrive" },
      update: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpires: null,
        accountEmail: null,
        accountName: null,
      },
      create: {
        provider: "onedrive",
        connected: false,
      },
    });

    return NextResponse.json({ success: true, message: "OneDrive disconnected" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}

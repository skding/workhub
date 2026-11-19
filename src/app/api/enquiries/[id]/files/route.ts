import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fileName, fileType, fileSize, fileUrl, category = "INPUT", source = "LOCAL" } = body;

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "File name is required" },
        { status: 400 }
      );
    }

    const file = await db.fileAttachment.create({
      data: {
        enquiryId: id,
        fileName,
        fileType: fileType || "other",
        fileSize: fileSize || null,
        fileUrl: fileUrl || null,
        category,
        source,
      },
    });

    return NextResponse.json({ success: true, data: file });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add file record" },
      { status: 500 }
    );
  }
}

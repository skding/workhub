import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, type = "GENERAL" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Note content is required" },
        { status: 400 }
      );
    }

    const note = await db.note.create({
      data: {
        enquiryId: id,
        content: content.trim(),
        type,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
}

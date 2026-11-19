import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { revCode, summary, totalAmount, type = "COSTING", dataJson } = body;

    if (!revCode || !summary) {
      return NextResponse.json(
        { success: false, error: "Revision code (e.g. Rev A) and summary are required" },
        { status: 400 }
      );
    }

    const revision = await db.revision.create({
      data: {
        enquiryId: id,
        revCode: revCode.trim(),
        summary: summary.trim(),
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        type,
        dataJson: dataJson || null,
      },
    });

    return NextResponse.json({ success: true, data: revision });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create revision" },
      { status: 500 }
    );
  }
}

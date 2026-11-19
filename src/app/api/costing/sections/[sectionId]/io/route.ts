import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { sectionId } = await params;
    const body = await request.json();
    const { ioRequirements } = body; // Array of { ioType: string, quantity: number }

    if (!Array.isArray(ioRequirements)) {
      return NextResponse.json({ success: false, error: "ioRequirements array required" }, { status: 400 });
    }

    // Replace all IO requirements for this section
    await db.costingIO.deleteMany({ where: { sectionId } });

    await db.costingIO.createMany({
      data: ioRequirements.map((io: any) => ({
        sectionId,
        ioType: io.ioType,
        quantity: Number(io.quantity) || 0,
      })),
    });

    const updated = await db.costingIO.findMany({ where: { sectionId } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update IO requirements" },
      { status: 500 }
    );
  }
}

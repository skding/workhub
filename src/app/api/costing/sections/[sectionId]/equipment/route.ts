import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
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
    const { name = "New Equipment", quantity = 1, io = [] } = body;

    const equipment = await db.costingEquipment.create({
      data: {
        name: name.trim(),
        quantity: Number(quantity) || 1,
        sectionId,
        io: {
          create: io.map((point: any) => ({
            ioType: point.ioType,
            quantity: Number(point.quantity) || 0,
          })),
        },
      },
      include: {
        io: true,
      },
    });

    return NextResponse.json({ success: true, data: equipment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add equipment" },
      { status: 500 }
    );
  }
}

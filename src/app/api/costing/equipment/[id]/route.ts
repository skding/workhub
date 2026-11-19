import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, quantity, io } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (quantity !== undefined) updateData.quantity = Number(quantity) || 1;

    if (io && Array.isArray(io)) {
      await db.costingEquipmentIO.deleteMany({ where: { equipmentId: id } });
      updateData.io = {
        create: io.map((point: any) => ({
          ioType: point.ioType,
          quantity: Number(point.quantity) || 0,
        })),
      };
    }

    const updated = await db.costingEquipment.update({
      where: { id },
      data: updateData,
      include: { io: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update equipment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.costingEquipment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Equipment deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete equipment" },
      { status: 500 }
    );
  }
}

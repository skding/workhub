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
    const { quantity, snapshottedPrice, componentName, category, systemId, sectionId } = body;

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (snapshottedPrice !== undefined) updateData.snapshottedPrice = Number(snapshottedPrice);
    if (componentName !== undefined) updateData.componentName = componentName.trim();
    if (category !== undefined) updateData.category = category;
    if (systemId !== undefined) updateData.systemId = systemId;
    if (sectionId !== undefined) updateData.sectionId = sectionId;

    const updated = await db.costingComponent.update({
      where: { id },
      data: updateData,
      include: { catalog: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update BOM component" },
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
    await db.costingComponent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Component removed from BOM" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove component from BOM" },
      { status: 500 }
    );
  }
}

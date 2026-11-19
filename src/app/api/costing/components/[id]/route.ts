import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper to safely parse JSON
function safeParseJson(val: any) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

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
    const { model, description, brand, listPrice, category, ioSpecs } = body;

    const updateData: any = {};
    if (model) updateData.model = model.trim();
    if (description !== undefined) updateData.description = description.trim() || model?.trim() || "";
    if (brand) updateData.brand = brand.trim();
    if (listPrice !== undefined) updateData.listPrice = Number(listPrice);
    if (category) updateData.category = category;
    if (ioSpecs !== undefined) updateData.ioSpecs = ioSpecs ? JSON.stringify(ioSpecs) : null;

    const updated = await db.componentCatalog.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        ioSpecs: safeParseJson(updated.ioSpecs),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update component" },
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
    await db.componentCatalog.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Component deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete component" },
      { status: 500 }
    );
  }
}

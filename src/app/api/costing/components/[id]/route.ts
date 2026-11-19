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
    const { model, description, brand, listPrice, category, ioSpecs } = body;

    const updateData: any = {};
    if (model) updateData.model = model.trim();
    if (description) updateData.description = description.trim();
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
        ioSpecs: updated.ioSpecs ? JSON.parse(updated.ioSpecs) : null,
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

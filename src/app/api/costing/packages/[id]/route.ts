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
    const { name, description, items } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    if (items && Array.isArray(items)) {
      // Re-create items
      await db.hardwarePackageItem.deleteMany({ where: { packageId: id } });
      updateData.items = {
        create: items.map((i: any) => ({
          catalogId: i.catalogId,
          quantity: Number(i.quantity) || 1,
        })),
      };
    }

    const updated = await db.hardwarePackage.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            catalog: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update package" },
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
    await db.hardwarePackage.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Package deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete package" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ systemId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { systemId } = await params;
    const body = await request.json();
    const { name, mandays, mobilization, lodging, documentation, training, siteWorkDetails } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (mandays !== undefined) updateData.mandays = Number(mandays);
    if (mobilization !== undefined) updateData.mobilization = Number(mobilization);
    if (lodging !== undefined) updateData.lodging = Number(lodging);
    if (documentation !== undefined) updateData.documentation = Number(documentation);
    if (training !== undefined) updateData.training = Number(training);
    if (siteWorkDetails !== undefined) {
      updateData.siteWorkDetails = siteWorkDetails ? JSON.stringify(siteWorkDetails) : null;
    }

    const updated = await db.costingSystem.update({
      where: { id: systemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update system" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ systemId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { systemId } = await params;
    await db.costingSystem.delete({ where: { id: systemId } });

    return NextResponse.json({ success: true, message: "System deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete system" },
      { status: 500 }
    );
  }
}

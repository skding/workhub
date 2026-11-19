import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await db.client.findUnique({
      where: { id },
      include: {
        enquiries: {
          include: {
            revisions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.client.update({
      where: { id },
      data: {
        ...(body.companyName !== undefined && { companyName: body.companyName.trim() }),
        ...(body.clientCode !== undefined && { clientCode: body.clientCode.trim() }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson?.trim() || null }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone?.trim() || null }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail?.trim() || null }),
        ...(body.industry !== undefined && { industry: body.industry?.trim() || null }),
        ...(body.address !== undefined && { address: body.address?.trim() || null }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}

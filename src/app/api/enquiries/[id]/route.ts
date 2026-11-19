import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        client: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        files: {
          orderBy: { createdAt: "desc" },
        },
        todos: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch enquiry" },
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

    const updated = await db.enquiry.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.estimatedBudget !== undefined && {
          estimatedBudget: body.estimatedBudget ? parseFloat(body.estimatedBudget) : null,
        }),
        ...(body.targetDate !== undefined && {
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
        }),
        ...(body.summary !== undefined && { summary: body.summary }),
      },
      include: {
        notes: true,
        revisions: true,
        files: true,
        todos: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update enquiry" },
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
    await db.enquiry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Enquiry deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete enquiry" },
      { status: 500 }
    );
  }
}

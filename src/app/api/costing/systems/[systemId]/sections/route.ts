import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
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
    const { name = "New Section" } = body;

    const section = await db.costingSection.create({
      data: {
        name: name.trim(),
        systemId,
        mandays: 0,
        mobilization: 0,
        lodging: 0,
        documentation: 0,
        training: 0,
        ioRequirements: {
          create: [
            { ioType: "DI", quantity: 0 },
            { ioType: "DO", quantity: 0 },
            { ioType: "AI", quantity: 0 },
            { ioType: "AO", quantity: 0 },
            { ioType: "RTD", quantity: 0 },
            { ioType: "HLI", quantity: 0 },
          ],
        },
      },
      include: {
        ioRequirements: true,
        equipment: { include: { io: true } },
      },
    });

    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add section" },
      { status: 500 }
    );
  }
}

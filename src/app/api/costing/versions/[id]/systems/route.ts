import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
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
    const { name = "New System" } = body;

    const system = await db.costingSystem.create({
      data: {
        name: name.trim(),
        versionId: id,
        sections: {
          create: [
            {
              name: "Section 1",
              mandays: 0,
              mobilization: 0,
              lodging: 0,
              documentation: 0,
              training: 0,
            },
          ],
        },
      },
      include: {
        sections: {
          include: {
            ioRequirements: true,
            equipment: { include: { io: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: system });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add system" },
      { status: 500 }
    );
  }
}

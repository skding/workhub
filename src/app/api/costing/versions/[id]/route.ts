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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const version = await db.costingVersion.findUnique({
      where: { id },
      include: {
        enquiry: {
          include: { client: true },
        },
        client: true,
        costSettings: true,
        systems: {
          orderBy: { id: "asc" },
          include: {
            sections: {
              orderBy: { id: "asc" },
              include: {
                ioRequirements: { orderBy: { id: "asc" } },
                equipment: {
                  orderBy: { id: "asc" },
                  include: { io: { orderBy: { id: "asc" } } },
                },
              },
            },
          },
        },
        components: {
          orderBy: { id: "asc" },
          include: {
            catalog: true,
            system: true,
            section: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
    }

    // Format components to parse ioSpecs
    const formatted = {
      ...version,
      components: version.components.map((c) => ({
        ...c,
        catalog: c.catalog
          ? {
              ...c.catalog,
              ioSpecs: safeParseJson(c.catalog.ioSpecs),
            }
          : null,
      })),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch version" },
      { status: 500 }
    );
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
    const { markup, markupSiteWork, status, totalCost, totalSelling, projectName } = body;

    const updateData: any = {};
    if (markup !== undefined) updateData.markup = Number(markup);
    if (markupSiteWork !== undefined) updateData.markupSiteWork = Number(markupSiteWork);
    if (status) updateData.status = status;
    if (totalCost !== undefined) updateData.totalCost = Number(totalCost);
    if (totalSelling !== undefined) updateData.totalSelling = Number(totalSelling);
    if (projectName) updateData.projectName = projectName.trim();

    const updated = await db.costingVersion.update({
      where: { id },
      data: updateData,
    });

    // If linked to an enquiry and totalSelling is updated, also update enquiry estimatedBudget
    if (updated.enquiryId && totalSelling !== undefined && Number(totalSelling) > 0) {
      await db.enquiry.update({
        where: { id: updated.enquiryId },
        data: { estimatedBudget: Number(totalSelling) },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update version" },
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
    await db.costingVersion.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Version deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete version" },
      { status: 500 }
    );
  }
}

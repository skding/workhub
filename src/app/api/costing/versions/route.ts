import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/costing/versions - List versions
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enquiryId = searchParams.get("enquiryId");

    const where: any = {};
    if (enquiryId) {
      where.enquiryId = enquiryId;
    }

    const versions = await db.costingVersion.findMany({
      where,
      include: {
        enquiry: {
          select: {
            id: true,
            code: true,
            title: true,
            clientName: true,
          },
        },
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: versions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list costing versions" },
      { status: 500 }
    );
  }
}

// POST /api/costing/versions - Create a new version
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enquiryId, clientId, projectName, markup = 1.25, markupSiteWork = 1.15 } = body;

    let targetProjectName = projectName || "New Automation Project";
    let targetClientId = clientId || null;
    let nextVersionNumber = 1;

    if (enquiryId) {
      const enq = await db.enquiry.findUnique({
        where: { id: enquiryId },
        include: { costingVersions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (enq) {
        targetProjectName = enq.title;
        targetClientId = enq.clientId;
        if (enq.costingVersions.length > 0) {
          nextVersionNumber = enq.costingVersions[0].versionNumber + 1;
        }
      }
    }

    // Create version with default cost settings and initial System/Section
    const newVersion = await db.costingVersion.create({
      data: {
        versionNumber: nextVersionNumber,
        status: "DRAFT",
        projectName: targetProjectName,
        enquiryId: enquiryId || null,
        clientId: targetClientId,
        markup: Number(markup) || 1.25,
        markupSiteWork: Number(markupSiteWork) || 1.15,
        costSettings: {
          create: {
            engRateDigital: 80,
            engRateAnalog: 150,
            engRateHLI: 300,
            cablingCostPerIO: 50,
          },
        },
        systems: {
          create: [
            {
              name: "System 1: Main Automation System",
              mandays: 0,
              mobilization: 0,
              lodging: 0,
              documentation: 0,
              training: 0,
              sections: {
                create: [
                  {
                    name: "Section 1: Main Control Panel",
                    mandays: 0,
                    mobilization: 0,
                    lodging: 0,
                    documentation: 0,
                    training: 0,
                    ioRequirements: {
                      create: [
                        { ioType: "DI", quantity: 8 },
                        { ioType: "DO", quantity: 6 },
                        { ioType: "AI", quantity: 2 },
                        { ioType: "AO", quantity: 0 },
                        { ioType: "RTD", quantity: 0 },
                        { ioType: "HLI", quantity: 1 },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        enquiry: true,
        client: true,
        costSettings: true,
        systems: {
          include: {
            sections: {
              include: {
                ioRequirements: true,
                equipment: {
                  include: { io: true },
                },
              },
            },
          },
        },
        components: {
          include: { catalog: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: newVersion });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create costing version" },
      { status: 500 }
    );
  }
}

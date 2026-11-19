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

    const source = await db.costingVersion.findUnique({
      where: { id },
      include: {
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
        components: true,
      },
    });

    if (!source) {
      return NextResponse.json({ success: false, error: "Source version not found" }, { status: 404 });
    }

    // Find next version number for this enquiry or project
    const maxVersion = await db.costingVersion.findFirst({
      where: source.enquiryId ? { enquiryId: source.enquiryId } : { projectName: source.projectName },
      orderBy: { versionNumber: "desc" },
    });

    const nextVer = (maxVersion?.versionNumber || 0) + 1;

    // Create cloned version
    const newVersion = await db.costingVersion.create({
      data: {
        versionNumber: nextVer,
        status: "DRAFT",
        totalCost: source.totalCost,
        totalSelling: source.totalSelling,
        markup: source.markup,
        markupSiteWork: source.markupSiteWork,
        enquiryId: source.enquiryId,
        clientId: source.clientId,
        projectName: source.projectName,
        costSettings: source.costSettings
          ? {
              create: {
                engRateDigital: source.costSettings.engRateDigital,
                engRateAnalog: source.costSettings.engRateAnalog,
                engRateHLI: source.costSettings.engRateHLI,
                cablingCostPerIO: source.costSettings.cablingCostPerIO,
                siteWorkRates: source.costSettings.siteWorkRates,
              },
            }
          : undefined,
        systems: {
          create: source.systems.map((sys) => ({
            name: sys.name,
            mandays: sys.mandays,
            mobilization: sys.mobilization,
            lodging: sys.lodging,
            documentation: sys.documentation,
            training: sys.training,
            siteWorkDetails: sys.siteWorkDetails,
            sections: {
              create: sys.sections.map((sec) => ({
                name: sec.name,
                mandays: sec.mandays,
                mobilization: sec.mobilization,
                lodging: sec.lodging,
                documentation: sec.documentation,
                training: sec.training,
                siteWorkDetails: sec.siteWorkDetails,
                ioRequirements: {
                  create: sec.ioRequirements.map((io) => ({
                    ioType: io.ioType,
                    quantity: io.quantity,
                  })),
                },
                equipment: {
                  create: sec.equipment.map((eq) => ({
                    name: eq.name,
                    quantity: eq.quantity,
                    io: {
                      create: eq.io.map((eqIo) => ({
                        ioType: eqIo.ioType,
                        quantity: eqIo.quantity,
                      })),
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        systems: {
          include: {
            sections: true,
          },
        },
      },
    });

    // Remap cloned components
    for (const comp of source.components) {
      let mappedSystemId: string | null = null;
      let mappedSectionId: string | null = null;

      if (comp.systemId) {
        const origSys = source.systems.find((s) => s.id === comp.systemId);
        if (origSys) {
          const matchSys = newVersion.systems.find((s) => s.name === origSys.name);
          if (matchSys) {
            mappedSystemId = matchSys.id;
            if (comp.sectionId) {
              const origSec = origSys.sections.find((sec) => sec.id === comp.sectionId);
              if (origSec) {
                const matchSec = matchSys.sections.find((sec) => sec.name === origSec.name);
                if (matchSec) mappedSectionId = matchSec.id;
              }
            }
          }
        }
      }

      await db.costingComponent.create({
        data: {
          versionId: newVersion.id,
          catalogId: comp.catalogId,
          componentName: comp.componentName,
          category: comp.category,
          quantity: comp.quantity,
          snapshottedPrice: comp.snapshottedPrice,
          systemId: mappedSystemId,
          sectionId: mappedSectionId,
        },
      });
    }

    return NextResponse.json({ success: true, data: newVersion });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clone version" },
      { status: 500 }
    );
  }
}

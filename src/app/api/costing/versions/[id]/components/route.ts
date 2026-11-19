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
    const { catalogId, componentName, category, quantity = 1, snapshottedPrice = 0, systemId, sectionId } = body;

    let targetName = componentName;
    let targetPrice = Number(snapshottedPrice);
    let targetCategory = category;

    if (catalogId) {
      const catalog = await db.componentCatalog.findUnique({ where: { id: catalogId } });
      if (catalog) {
        if (!targetName) targetName = `${catalog.brand} ${catalog.model} - ${catalog.description}`;
        if (!targetPrice) targetPrice = catalog.listPrice;
        if (!targetCategory) targetCategory = catalog.category;
      }
    }

    const comp = await db.costingComponent.create({
      data: {
        versionId: id,
        catalogId: catalogId || null,
        componentName: targetName || "Hardware Item",
        category: targetCategory || "HARDWARE",
        quantity: Number(quantity) || 1,
        snapshottedPrice: targetPrice || 0,
        systemId: systemId || null,
        sectionId: sectionId || null,
      },
      include: {
        catalog: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...comp,
        catalog: comp.catalog
          ? {
              ...comp.catalog,
              ioSpecs: comp.catalog.ioSpecs ? JSON.parse(comp.catalog.ioSpecs) : null,
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add component to BOM" },
      { status: 500 }
    );
  }
}

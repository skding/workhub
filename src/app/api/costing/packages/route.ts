import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/costing/packages - List all hardware packages
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const packages = await db.hardwarePackage.findMany({
      include: {
        items: {
          include: {
            catalog: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = packages.map((pkg) => ({
      ...pkg,
      items: pkg.items.map((item) => ({
        ...item,
        catalog: item.catalog
          ? {
              ...item.catalog,
              ioSpecs: item.catalog.ioSpecs ? JSON.parse(item.catalog.ioSpecs) : null,
            }
          : null,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load packages" },
      { status: 500 }
    );
  }
}

// POST /api/costing/packages - Create hardware package
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, items } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Package name is required" }, { status: 400 });
    }

    const created = await db.hardwarePackage.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        items: {
          create: (items || []).map((i: any) => ({
            catalogId: i.catalogId,
            quantity: Number(i.quantity) || 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            catalog: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create package" },
      { status: 500 }
    );
  }
}

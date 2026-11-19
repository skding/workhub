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

// GET /api/costing/components - List all catalog components
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");

    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }
    if (brand && brand !== "All") {
      where.brand = brand;
    }
    if (search) {
      where.OR = [
        { model: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const components = await db.componentCatalog.findMany({
      where,
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    });

    // Parse ioSpecs JSON string safely
    const formatted = components.map((c) => ({
      ...c,
      ioSpecs: safeParseJson(c.ioSpecs),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load components" },
      { status: 500 }
    );
  }
}

// POST /api/costing/components - Add new catalog component
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { model, description, brand, listPrice, category, ioSpecs } = body;

    if (!model || !brand) {
      return NextResponse.json(
        { success: false, error: "Model code and brand are required" },
        { status: 400 }
      );
    }

    const trimmedModel = model.trim();
    const existing = await db.componentCatalog.findUnique({
      where: { model: trimmedModel },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A component with model code "${trimmedModel}" already exists in the catalog.` },
        { status: 400 }
      );
    }

    const created = await db.componentCatalog.create({
      data: {
        model: trimmedModel,
        description: description?.trim() || trimmedModel,
        brand: brand.trim(),
        listPrice: Number(listPrice) || 0,
        category: category || "PLC",
        ioSpecs: ioSpecs ? JSON.stringify(ioSpecs) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...created,
        ioSpecs: safeParseJson(created.ioSpecs),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add component" },
      { status: 500 }
    );
  }
}

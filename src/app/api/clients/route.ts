import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/clients
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { companyName: { contains: search } },
        { clientCode: { contains: search } },
        { contactPerson: { contains: search } },
        { industry: { contains: search } },
      ];
    }

    const clients = await db.client.findMany({
      where: whereClause,
      include: {
        enquiries: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            estimatedBudget: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { enquiries: true },
        },
      },
      orderBy: { companyName: "asc" },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      clientCode,
      contactPerson,
      contactPhone,
      contactEmail,
      industry,
      address,
      notes,
    } = body;

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 }
      );
    }

    // Auto-generate client code if not provided (e.g. CL-ABC)
    let finalCode = clientCode?.trim();
    if (!finalCode) {
      const initials = companyName
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase())
        .filter(Boolean)
        .join("")
        .slice(0, 4);
      finalCode = `CL-${initials || "GEN"}`;
    }

    const client = await db.client.create({
      data: {
        companyName: companyName.trim(),
        clientCode: finalCode,
        contactPerson: contactPerson?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        industry: industry?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create client" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProjectFolderStructure } from "@/lib/storage";

// Helper to sanitize strings for folder names
function sanitizeForFolder(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

// GET /api/enquiries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { clientName: { contains: search } },
        { contactPerson: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const enquiries = await db.enquiry.findMany({
      where: whereClause,
      include: {
        client: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        files: true,
        todos: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: enquiries });
  } catch (error: any) {
    console.error("Failed to fetch enquiries:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch enquiries" },
      { status: 500 }
    );
  }
}

// POST /api/enquiries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      clientId,
      clientName,
      contactPerson,
      contactPhone,
      contactEmail,
      priority = "MEDIUM",
      status = "NEW",
      estimatedBudget,
      targetDate,
      summary,
      initialNote,
    } = body;

    let resolvedClientName = clientName;
    let resolvedClientId = clientId || null;
    let resolvedClientCode = "";

    if (resolvedClientId) {
      const existingClient = await db.client.findUnique({
        where: { id: resolvedClientId },
      });
      if (existingClient) {
        resolvedClientName = existingClient.companyName;
        resolvedClientCode = existingClient.clientCode || "";
      }
    } else if (clientName && clientName.trim()) {
      // Find or create client if not selected
      const trimmed = clientName.trim();
      let found = await db.client.findUnique({
        where: { companyName: trimmed },
      });
      if (!found) {
        const initials = trimmed
          .split(/\s+/)
          .map((w: string) => w[0]?.toUpperCase())
          .filter(Boolean)
          .join("")
          .slice(0, 4);
        found = await db.client.create({
          data: {
            companyName: trimmed,
            clientCode: `CL-${initials || "GEN"}`,
            contactPerson: contactPerson || null,
            contactPhone: contactPhone || null,
            contactEmail: contactEmail || null,
          },
        });
      }
      resolvedClientId = found.id;
      resolvedClientName = found.companyName;
      resolvedClientCode = found.clientCode || "";
    }

    if (!title || !resolvedClientName) {
      return NextResponse.json(
        { success: false, error: "Title and Client Name are required" },
        { status: 400 }
      );
    }

    // Generate enquiry code: ENQ-YYYYMM-XXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const codePrefix = `ENQ-${yearMonth}-`;

    const countThisMonth = await db.enquiry.count({
      where: {
        code: {
          startsWith: codePrefix,
        },
      },
    });

    const nextIndex = String(countThisMonth + 1).padStart(3, "0");
    const code = `${codePrefix}${nextIndex}`;

    // Standardized OneDrive folder name format: YYYYMM-XXX_ClientCode_ProjectTitle
    const clientTag = sanitizeForFolder(resolvedClientCode || resolvedClientName).substring(0, 20);
    const cleanTitle = sanitizeForFolder(title).substring(0, 30);
    const folderName = `${yearMonth}-${nextIndex}_${clientTag}_${cleanTitle}`;

    // Auto-create folder in OneDrive storage (synced via Rclone/desktop)
    try {
      ensureProjectFolderStructure(folderName);
    } catch (fErr) {
      console.warn("Folder structure creation warning:", fErr);
    }

    const newEnquiry = await db.enquiry.create({
      data: {
        code,
        title,
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        contactPerson: contactPerson || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        status,
        priority,
        folderName,
        oneDriveFolderId: null,
        oneDriveWebUrl: null,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        summary: summary || null,
        notes: initialNote
          ? {
              create: {
                content: initialNote,
                type: "WHATSAPP",
              },
            }
          : undefined,
      },
      include: {
        client: true,
        notes: true,
        revisions: true,
        files: true,
        todos: true,
      },
    });

    return NextResponse.json({ success: true, data: newEnquiry });
  } catch (error: any) {
    console.error("Failed to create enquiry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create enquiry" },
      { status: 500 }
    );
  }
}

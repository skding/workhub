import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ensureProjectFolderStructure,
  scanEnquiryFolder,
  getOneDriveRoot,
} from "@/lib/storage";

// GET /api/enquiries/[id]/onedrive - scan folder and sync files
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    // 1. Scan real files inside OneDrive folder on disk (synced via Rclone/desktop)
    const scannedFiles = scanEnquiryFolder(enquiry.folderName);

    // 2. Sync any newly detected files into SQLite database
    const existingFileNames = new Set(enquiry.files.map((f) => f.fileName));

    for (const file of scannedFiles) {
      if (!existingFileNames.has(file.fileName)) {
        await db.fileAttachment.create({
          data: {
            enquiryId: id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            fileUrl: `/api/media?path=${encodeURIComponent(file.relativePath)}`,
            category: file.category,
            source: "ONEDRIVE",
          },
        });
      }
    }

    // 3. Return updated files
    const updatedFiles = await db.fileAttachment.findMany({
      where: { enquiryId: id },
      orderBy: { createdAt: "desc" },
    });

    const root = getOneDriveRoot();

    return NextResponse.json({
      success: true,
      data: {
        folderName: enquiry.folderName,
        storageRoot: root,
        files: updatedFiles,
        scannedCount: scannedFiles.length,
      },
    });
  } catch (error: any) {
    console.error("OneDrive scan error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to scan OneDrive files" },
      { status: 500 }
    );
  }
}

// POST /api/enquiries/[id]/onedrive - physically create standardized project folder & subfolders
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiry = await db.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    const { projectDir, subfolders } = ensureProjectFolderStructure(enquiry.folderName);

    return NextResponse.json({
      success: true,
      data: {
        folderName: enquiry.folderName,
        projectDir,
        subfolders,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create folder structure" },
      { status: 500 }
    );
  }
}

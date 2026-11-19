import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveFileToEnquiryFolder } from "@/lib/storage";

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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = ((formData.get("category") as string) || "INPUT") as "INPUT" | "DESIGN" | "COSTING";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Save directly to the standardized OneDrive folder on disk (synced by Rclone / OneDrive)
    const { relativePath, size } = saveFileToEnquiryFolder(
      enquiry.folderName,
      category,
      file.name,
      buffer
    );

    // Determine type
    let fileType = "other";
    if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) fileType = "image";
    else if (file.type.includes("pdf") || /\.pdf$/i.test(file.name)) fileType = "pdf";
    else if (/\.(dwg|dxf|step|stp|igs|iges|sldprt)$/i.test(file.name)) fileType = "cad";
    else if (/\.(xlsx|xls|csv)$/i.test(file.name)) fileType = "excel";

    // Record in database
    const attachment = await db.fileAttachment.create({
      data: {
        enquiryId: id,
        fileName: file.name,
        fileType,
        fileSize: size,
        fileUrl: `/api/media?path=${encodeURIComponent(relativePath)}`,
        category,
        source: "ONEDRIVE",
      },
    });

    return NextResponse.json({ success: true, data: attachment });
  } catch (error: any) {
    console.error("OneDrive upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to OneDrive folder" },
      { status: 500 }
    );
  }
}

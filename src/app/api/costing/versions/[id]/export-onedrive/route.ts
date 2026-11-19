import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureProjectFolderStructure, getOneDriveRoot } from "@/lib/storage";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

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

    const version = await db.costingVersion.findUnique({
      where: { id },
      include: {
        enquiry: true,
        client: true,
        costSettings: true,
        systems: {
          include: {
            sections: {
              include: {
                ioRequirements: true,
                equipment: { include: { io: true } },
              },
            },
          },
        },
        components: {
          include: { catalog: true },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
    }

    // 1. Prepare Excel Data
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const rates = version.costSettings || { engRateDigital: 80, engRateAnalog: 150, engRateHLI: 300, cablingCostPerIO: 50 };
    let totalDigital = 0;
    let totalAnalog = 0;
    let totalHLI = 0;

    version.systems.forEach((sys) => {
      sys.sections.forEach((sec) => {
        sec.ioRequirements.forEach((io) => {
          if (io.ioType === "DI" || io.ioType === "DO") totalDigital += io.quantity;
          else if (io.ioType === "AI" || io.ioType === "AO" || io.ioType === "RTD") totalAnalog += io.quantity;
          else if (io.ioType === "HLI") totalHLI += io.quantity;
        });
        sec.equipment.forEach((eq) => {
          eq.io.forEach((eqIo) => {
            const qty = eqIo.quantity * eq.quantity;
            if (eqIo.ioType === "DI" || eqIo.ioType === "DO") totalDigital += qty;
            else if (eqIo.ioType === "AI" || eqIo.ioType === "AO" || eqIo.ioType === "RTD") totalAnalog += qty;
            else if (eqIo.ioType === "HLI") totalHLI += qty;
          });
        });
      });
    });

    const totalIO = totalDigital + totalAnalog + totalHLI;
    const engCost = (totalDigital * rates.engRateDigital) + (totalAnalog * rates.engRateAnalog) + (totalHLI * rates.engRateHLI);
    const cablingCost = totalIO * rates.cablingCostPerIO;

    const hardwareCost = version.components.reduce(
      (acc, c) => acc + c.snapshottedPrice * c.quantity,
      0
    );

    let siteSubtotal = 0;
    version.systems.forEach((sys) => {
      siteSubtotal += (sys.mandays + sys.mobilization + sys.lodging + sys.documentation + sys.training);
      sys.sections.forEach((sec) => {
        siteSubtotal += (sec.mandays + sec.mobilization + sec.lodging + sec.documentation + sec.training);
      });
    });

    const totalNet = hardwareCost + engCost + cablingCost + siteSubtotal;
    const sellingPrice = (hardwareCost + engCost + cablingCost) * version.markup + (siteSubtotal * version.markupSiteWork);

    const summaryRows = [
      ["WORKHUB AUTOMATION & ENGINEERING OPERATIONS", ""],
      ["PROJECT COSTING BREAKDOWN & QUOTATION SHEET", ""],
      ["", ""],
      ["Project Title", version.projectName || version.enquiry?.title || "N/A"],
      ["Enquiry Code", version.enquiry?.code || "N/A"],
      ["Client", version.client?.companyName || version.enquiry?.clientName || "N/A"],
      ["Version / Revision", `Rev ${version.versionNumber}.0`],
      ["Status", version.status],
      ["Date Generated", new Date().toLocaleDateString("en-GB")],
      ["", ""],
      ["COST BREAKDOWN SUMMARY", "AMOUNT (RM)"],
      ["1. Hardware & Components BOM", hardwareCost.toFixed(2)],
      ["2. Engineering & Programming", engCost.toFixed(2)],
      ["3. Panel Cabling & Interconnect", cablingCost.toFixed(2)],
      ["4. Site Work, Mandays & Testing", siteSubtotal.toFixed(2)],
      ["Total Net Cost (RM)", totalNet.toFixed(2)],
      ["", ""],
      ["COMMERCIAL MARKUP & SELLING PRICE", ""],
      ["Hardware & Engineering Markup Factor", version.markup.toFixed(2)],
      ["Site Work Markup Factor", version.markupSiteWork.toFixed(2)],
      ["TOTAL SELLING PRICE (RM)", sellingPrice.toFixed(2)],
      ["", ""],
      ["IO POINT METRICS", "COUNT"],
      ["Digital IO (DI/DO)", totalDigital],
      ["Analog IO (AI/AO/RTD)", totalAnalog],
      ["High Level Interface (HLI)", totalHLI],
      ["Total IO Points", totalIO],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Bill of Materials (BOM)
    const bomRows: any[] = [
      ["No", "Brand", "Model", "Description", "Category", "System / Section", "Unit Price (RM)", "Qty", "Total (RM)"],
    ];

    version.components.forEach((c, idx) => {
      const brand = c.catalog?.brand || "General";
      const model = c.catalog?.model || "-";
      const desc = c.componentName || c.catalog?.description || "";
      const cat = c.category || c.catalog?.category || "HARDWARE";
      const unit = c.snapshottedPrice;
      const total = unit * c.quantity;

      let location = "Project Level";
      if (c.systemId) {
        const sys = version.systems.find((s) => s.id === c.systemId);
        if (sys) location = sys.name;
        if (c.sectionId) {
          const sec = sys?.sections.find((s) => s.id === c.sectionId);
          if (sec) location = `${sys?.name} > ${sec.name}`;
        }
      }

      bomRows.push([idx + 1, brand, model, desc, cat, location, unit.toFixed(2), c.quantity, total.toFixed(2)]);
    });

    const wsBOM = XLSX.utils.aoa_to_sheet(bomRows);
    XLSX.utils.book_append_sheet(wb, wsBOM, "Hardware BOM");

    // Sheet 3: Systems & IO
    const ioRows: any[] = [
      ["System", "Section", "Equipment / Subsystem", "Quantity", "DI", "DO", "AI", "AO", "RTD", "HLI"],
    ];

    version.systems.forEach((sys) => {
      sys.sections.forEach((sec) => {
        // Section direct IO
        const secIO: Record<string, number> = { DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 };
        sec.ioRequirements.forEach((io) => {
          secIO[io.ioType] = (secIO[io.ioType] || 0) + io.quantity;
        });
        ioRows.push([
          sys.name,
          sec.name,
          "Base IO Requirements",
          1,
          secIO.DI,
          secIO.DO,
          secIO.AI,
          secIO.AO,
          secIO.RTD,
          secIO.HLI,
        ]);

        // Equipment IO
        sec.equipment.forEach((eq) => {
          const eqIO: Record<string, number> = { DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 };
          eq.io.forEach((point) => {
            eqIO[point.ioType] = (eqIO[point.ioType] || 0) + point.quantity;
          });
          ioRows.push([
            sys.name,
            sec.name,
            eq.name,
            eq.quantity,
            eqIO.DI * eq.quantity,
            eqIO.DO * eq.quantity,
            eqIO.AI * eq.quantity,
            eqIO.AO * eq.quantity,
            eqIO.RTD * eq.quantity,
            eqIO.HLI * eq.quantity,
          ]);
        });
      });
    });

    const wsIO = XLSX.utils.aoa_to_sheet(ioRows);
    XLSX.utils.book_append_sheet(wb, wsIO, "IO Breakdown");

    // 2. Write file buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // 3. Determine save location (OneDrive or local fallback)
    let savedRelativePath: string | null = null;
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `Costing_Rev${version.versionNumber}_${dateCode}.xlsx`;

    if (version.enquiry) {
      const { subfolders } = ensureProjectFolderStructure(version.enquiry.folderName);
      if (subfolders && fs.existsSync(subfolders.costing)) {
        const fullFilePath = path.join(subfolders.costing, fileName);
        fs.writeFileSync(fullFilePath, buf);
        savedRelativePath = `${version.enquiry.folderName}/03_Costing_Revisions/${fileName}`;
      }

      // Record a Revision in the Enquiry
      await db.revision.create({
        data: {
          enquiryId: version.enquiry.id,
          revCode: `Rev ${version.versionNumber}.0`,
          type: "COSTING",
          summary: `PLC Costing Revision: RM ${sellingPrice.toLocaleString("en-MY", { minimumFractionDigits: 2 })} (Hardware: RM ${hardwareCost.toFixed(2)}, IO Count: ${totalIO})`,
          totalAmount: Math.round(sellingPrice),
          dataJson: JSON.stringify({ filePath: savedRelativePath, totalIO, hardwareCost }),
        },
      });

      // Update Enquiry estimatedBudget
      await db.enquiry.update({
        where: { id: version.enquiry.id },
        data: {
          estimatedBudget: Math.round(sellingPrice),
          status: version.enquiry.status === "NEW" || version.enquiry.status === "CONCEPT_DESIGN" ? "COSTING" : version.enquiry.status,
        },
      });
    }

    // Update Version totalCost and totalSelling
    await db.costingVersion.update({
      where: { id: version.id },
      data: {
        totalCost: Math.round(totalNet),
        totalSelling: Math.round(sellingPrice),
        status: "APPROVED",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        savedToOneDrive: Boolean(savedRelativePath),
        savedRelativePath,
        totalNet: Math.round(totalNet),
        totalSelling: Math.round(sellingPrice),
        totalIO,
      },
    });
  } catch (error: any) {
    console.error("Export to OneDrive error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export costing sheet" },
      { status: 500 }
    );
  }
}

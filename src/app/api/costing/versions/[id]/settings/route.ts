import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
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
    const { engRateDigital, engRateAnalog, engRateHLI, cablingCostPerIO, siteWorkRates } = body;

    const upserted = await db.costSettings.upsert({
      where: { versionId: id },
      update: {
        engRateDigital: Number(engRateDigital) || 0,
        engRateAnalog: Number(engRateAnalog) || 0,
        engRateHLI: Number(engRateHLI) || 0,
        cablingCostPerIO: Number(cablingCostPerIO) || 0,
        siteWorkRates: siteWorkRates ? JSON.stringify(siteWorkRates) : null,
      },
      create: {
        versionId: id,
        engRateDigital: Number(engRateDigital) || 0,
        engRateAnalog: Number(engRateAnalog) || 0,
        engRateHLI: Number(engRateHLI) || 0,
        cablingCostPerIO: Number(cablingCostPerIO) || 0,
        siteWorkRates: siteWorkRates ? JSON.stringify(siteWorkRates) : null,
      },
    });

    return NextResponse.json({ success: true, data: upserted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update cost settings" },
      { status: 500 }
    );
  }
}

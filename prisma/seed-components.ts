import { db as prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding Component Catalog & Hardware Packages...");

  const components = [
    // Schneider Electric
    {
      model: "TM221CE40R",
      description: "Modicon M221 PLC 40 IO Relay (24DI/16DO/2AI)",
      brand: "Schneider Electric",
      listPrice: 1850.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 24, DO: 16, AI: 2, AO: 0, RTD: 0, HLI: 1 }),
    },
    {
      model: "TM3DM24R",
      description: "Modicon TM3 24 IO Digital Mix Module (16DI/8DO)",
      brand: "Schneider Electric",
      listPrice: 650.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 16, DO: 8, AI: 0, AO: 0, RTD: 0, HLI: 0 }),
    },
    {
      model: "TM3AI8",
      description: "Modicon TM3 8 Channel Analog Input Module (0-10V, 4-20mA)",
      brand: "Schneider Electric",
      listPrice: 890.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 8, AO: 0, RTD: 0, HLI: 0 }),
    },
    {
      model: "TM3AQ4",
      description: "Modicon TM3 4 Channel Analog Output Module (0-10V, 4-20mA)",
      brand: "Schneider Electric",
      listPrice: 820.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 0, AO: 4, RTD: 0, HLI: 0 }),
    },
    {
      model: "GXU3512",
      description: "Harmony Easy GXU 7\" Touchscreen HMI TFT 65K Colors",
      brand: "Schneider Electric",
      listPrice: 1450.0,
      category: "HMI",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 1 }),
    },
    {
      model: "ABL8REM24030",
      description: "Phaseo Regulated Power Supply 100..240V AC, 24V DC 3A (72W)",
      brand: "Schneider Electric",
      listPrice: 380.0,
      category: "HARDWARE",
      ioSpecs: JSON.stringify({}),
    },
    {
      model: "MCSESM083F23F0",
      description: "Modicon Managed Industrial Ethernet Switch 8x 10/100 RJ45",
      brand: "Schneider Electric",
      listPrice: 2400.0,
      category: "NETWORK",
      ioSpecs: JSON.stringify({}),
    },

    // Siemens
    {
      model: "6ES7214-1AG40-0XB0",
      description: "SIMATIC S7-1200 CPU 1214C DC/DC/DC (14DI/10DO/2AI, 100KB)",
      brand: "Siemens",
      listPrice: 2150.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 14, DO: 10, AI: 2, AO: 0, RTD: 0, HLI: 1 }),
    },
    {
      model: "6ES7223-1BL32-0XB0",
      description: "SM 1223 Digital I/O Module 16DI/16DO 24V DC Transistor",
      brand: "Siemens",
      listPrice: 1120.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 16, DO: 16, AI: 0, AO: 0, RTD: 0, HLI: 0 }),
    },
    {
      model: "6ES7231-4HF32-0XB0",
      description: "SM 1231 Analog Input Module 8AI 13 Bit Resolution",
      brand: "Siemens",
      listPrice: 1450.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 8, AO: 0, RTD: 0, HLI: 0 }),
    },
    {
      model: "6AV2124-0GC01-0AX0",
      description: "SIMATIC HMI TP700 Comfort 7\" Widescreen TFT Touch Display",
      brand: "Siemens",
      listPrice: 4800.0,
      category: "HMI",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 1 }),
    },
    {
      model: "6EP1333-2BA20",
      description: "SITOP PSU100S Stabilized Power Supply 24V DC / 5A (120W)",
      brand: "Siemens",
      listPrice: 620.0,
      category: "HARDWARE",
      ioSpecs: JSON.stringify({}),
    },

    // Omron
    {
      model: "CP1E-N40DR-A",
      description: "CP1E CPU 40 IO Relay AC Power (24DI/16DO, USB, RS-232)",
      brand: "Omron",
      listPrice: 1650.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 24, DO: 16, AI: 0, AO: 0, RTD: 0, HLI: 1 }),
    },
    {
      model: "CP1W-40EDR",
      description: "CP1W Expansion Unit 40 IO Relay (24DI/16DO)",
      brand: "Omron",
      listPrice: 820.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 24, DO: 16, AI: 0, AO: 0, RTD: 0, HLI: 0 }),
    },
    {
      model: "NB7W-TW01B",
      description: "NB Series 7\" Wide Color TFT HMI Touch Panel with Ethernet",
      brand: "Omron",
      listPrice: 1580.0,
      category: "HMI",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 1 }),
    },
    {
      model: "S8VK-C12024",
      description: "Switch Mode Power Supply 24V DC, 5A, 120W DIN-Rail",
      brand: "Omron",
      listPrice: 290.0,
      category: "HARDWARE",
      ioSpecs: JSON.stringify({}),
    },

    // Mitsubishi
    {
      model: "FX5U-32MR/ES",
      description: "MELSEC iQ-F Series PLC CPU 32 IO (16DI/16DO Relay, Ethernet)",
      brand: "Mitsubishi Electric",
      listPrice: 2450.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 16, DO: 16, AI: 2, AO: 1, RTD: 0, HLI: 1 }),
    },
    {
      model: "FX5-16EYR/ES",
      description: "FX5 Extension Output Module 16 Points Relay",
      brand: "Mitsubishi Electric",
      listPrice: 750.0,
      category: "PLC",
      ioSpecs: JSON.stringify({ DI: 0, DO: 16, AI: 0, AO: 0, RTD: 0, HLI: 0 }),
    },
    {
      model: "GS2107-WTBD",
      description: "GOT Simple Series 7\" Wide WVGA TFT Touchscreen HMI",
      brand: "Mitsubishi Electric",
      listPrice: 1350.0,
      category: "HMI",
      ioSpecs: JSON.stringify({ DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 1 }),
    },
  ];

  for (const comp of components) {
    await prisma.componentCatalog.upsert({
      where: { model: comp.model },
      update: comp,
      create: comp,
    });
  }

  // Pre-seed a Hardware Package: Schneider M221 Conveyor Panel Kit
  const plcComp = await prisma.componentCatalog.findUnique({ where: { model: "TM221CE40R" } });
  const ioComp = await prisma.componentCatalog.findUnique({ where: { model: "TM3DM24R" } });
  const hmiComp = await prisma.componentCatalog.findUnique({ where: { model: "GXU3512" } });
  const psuComp = await prisma.componentCatalog.findUnique({ where: { model: "ABL8REM24030" } });

  if (plcComp && ioComp && hmiComp && psuComp) {
    await prisma.hardwarePackage.upsert({
      where: { name: "Schneider M221 Conveyor Automation Kit" },
      update: {},
      create: {
        name: "Schneider M221 Conveyor Automation Kit",
        description: "Standard industrial control bundle for 40-60 IO conveyor systems with 7\" touch HMI and 24V DC PSU",
        items: {
          create: [
            { catalogId: plcComp.id, quantity: 1 },
            { catalogId: ioComp.id, quantity: 1 },
            { catalogId: hmiComp.id, quantity: 1 },
            { catalogId: psuComp.id, quantity: 1 },
          ],
        },
      },
    });
  }

  console.log(`Seeded ${components.length} components and standard hardware package!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

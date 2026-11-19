import { db as prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database with Users, Clients and Enquiries...");

  // Clean existing
  await prisma.todoItem.deleteMany({});
  await prisma.fileAttachment.deleteMany({});
  await prisma.revision.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.enquiry.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Default Admin User
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      name: "Administrator (SK)",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Created admin user (admin / admin123)");

  // 1. Create Clients
  const clientMegaFoods = await prisma.client.create({
    data: {
      companyName: "Mega Foods Packaging",
      clientCode: "CL-MFP",
      contactPerson: "David Tan",
      contactPhone: "+60 12-345 6789",
      contactEmail: "david.tan@megafoods.com",
      industry: "Food & Beverage Packaging",
      address: "Plot 45, Kawasan Perindustrian Pasir Gudang, Johor",
      notes: "Large multinational FMCG manufacturer. Uses Siemens and Mitsubishi PLCs.",
    },
  });

  const clientTechTron = await prisma.client.create({
    data: {
      companyName: "TechTron Electronics",
      clientCode: "CL-TTE",
      contactPerson: "Jessica Wong",
      contactPhone: "+60 17-889 1234",
      contactEmail: "jessica.w@techtron.com.my",
      industry: "Electronics & Semiconductor",
      address: "Bayan Lepas Free Industrial Zone, Penang",
      notes: "High precision automated assembly lines. Requires Keyence/Cognex vision sensors.",
    },
  });

  const clientApex = await prisma.client.create({
    data: {
      companyName: "Apex Environmental Solutions",
      clientCode: "CL-AES",
      contactPerson: "Ir. Michael Cheah",
      contactPhone: "+60 19-223 9988",
      contactEmail: "michael@apexenv.com",
      industry: "Water & Environmental Treatment",
      address: "Section 15, Shah Alam, Selangor",
      notes: "Industrial wastewater SCADA systems and remote telemetry units.",
    },
  });

  const clientTopGlove = await prisma.client.create({
    data: {
      companyName: "Top Glove Corporation",
      clientCode: "CL-TGC",
      contactPerson: "Eric Lim",
      contactPhone: "+60 16-778 3322",
      contactEmail: "eric.lim@topglove.com.my",
      industry: "Rubber & Medical Devices",
      address: "Setia Alam, Shah Alam, Selangor",
      notes: "High-volume glove stripping and counting automation.",
    },
  });

  // 2. High Speed Palletizing
  await prisma.enquiry.create({
    data: {
      code: "ENQ-202611-001",
      title: "High-Speed Palletizing & Pick-and-Place System",
      clientId: clientMegaFoods.id,
      clientName: clientMegaFoods.companyName,
      contactPerson: clientMegaFoods.contactPerson,
      contactPhone: clientMegaFoods.contactPhone,
      contactEmail: clientMegaFoods.contactEmail,
      status: "COSTING",
      priority: "HIGH",
      folderName: "202611-001_MegaFoods_HighSpeedPalletizing",
      estimatedBudget: 85000,
      targetDate: new Date("2026-12-05"),
      summary: "Client requires automated palletizer handling 25 cartons/min with safety curtain interlocks and integration to existing ERP.",
      notes: {
        create: [
          {
            type: "WHATSAPP",
            content: "David sent message via WhatsApp: 'Hi, please ensure conveyor infeed height is exactly 850mm +- 20mm. Factory floor has slight inclination.'",
            createdAt: new Date("2026-11-15T09:30:00Z"),
          },
          {
            type: "CALL",
            content: "Phone discussion with plant manager: They prefer Siemens PLC over Omron due to company standard. Safety relay module is required.",
            createdAt: new Date("2026-11-16T14:15:00Z"),
          },
        ],
      },
      revisions: {
        create: [
          {
            revCode: "Rev A",
            type: "COSTING",
            summary: "Initial costing based on Mitsubishi FX5U PLC, 3x VFDs, standard pneumatic cylinders.",
            totalAmount: 72000,
            createdAt: new Date("2026-11-17T11:00:00Z"),
          },
          {
            revCode: "Rev B",
            type: "COSTING",
            summary: "Switched to Siemens S7-1500 + Safety Failsafe IO module, added Festo valve terminal with Profinet.",
            totalAmount: 84500,
            createdAt: new Date("2026-11-18T16:20:00Z"),
          },
        ],
      },
      files: {
        create: [
          {
            category: "INPUT",
            fileName: "Factory_Layout_Drawing_v2.pdf",
            fileType: "pdf",
            fileSize: 2450000,
            fileUrl: "/placeholder/factory_layout.pdf",
            source: "LOCAL",
          },
          {
            category: "INPUT",
            fileName: "Infeed_Conveyor_Photo_WhatsApp.jpg",
            fileType: "image",
            fileSize: 950000,
            fileUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
            source: "WHATSAPP",
          },
          {
            category: "DESIGN",
            fileName: "Palletizer_Concept_3D_Isometric.png",
            fileType: "image",
            fileSize: 1420000,
            fileUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
            source: "LOCAL",
          },
        ],
      },
      todos: {
        create: [
          { task: "Verify pneumatic air supply pressure with client (min 6 bar)", completed: true },
          { task: "Check S7-1500 lead time with supplier", completed: false, dueDate: new Date("2026-11-21") },
          { task: "Prepare formal quotation Rev B PDF", completed: false, dueDate: new Date("2026-11-23") },
        ],
      },
    },
  });

  // 3. Vision Inspection Station
  await prisma.enquiry.create({
    data: {
      code: "ENQ-202611-002",
      title: "Auto Screwdriving & Vision Inspection Station",
      clientId: clientTechTron.id,
      clientName: clientTechTron.companyName,
      contactPerson: clientTechTron.contactPerson,
      contactPhone: clientTechTron.contactPhone,
      contactEmail: clientTechTron.contactEmail,
      status: "CONCEPT_DESIGN",
      priority: "URGENT",
      folderName: "202611-002_TechTron_VisionScrewdriving",
      estimatedBudget: 45000,
      targetDate: new Date("2026-11-28"),
      summary: "Semi-automatic workbench: pneumatic screwdriving with torque feedback + Keyence vision camera checking 4 screw presence and PCB orientation.",
      notes: {
        create: [
          {
            type: "WHATSAPP",
            content: "Jessica sent photo of defective screw assembly. The washer sometimes misses, camera must detect washer presence.",
            createdAt: new Date("2026-11-18T10:00:00Z"),
          },
        ],
      },
      files: {
        create: [
          {
            category: "INPUT",
            fileName: "Sample_PCB_Enclosure.jpg",
            fileType: "image",
            fileSize: 850000,
            fileUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
            source: "WHATSAPP",
          },
        ],
      },
      todos: {
        create: [
          { task: "Contact Keyence sales rep for camera lens selection", completed: false, dueDate: new Date("2026-11-20") },
          { task: "Draft preliminary concept layout", completed: false },
        ],
      },
    },
  });

  // 4. Water Treatment Plant SCADA
  await prisma.enquiry.create({
    data: {
      code: "ENQ-202611-003",
      title: "Water Treatment Plant SCADA & Remote IO Upgrade",
      clientId: clientApex.id,
      clientName: clientApex.companyName,
      contactPerson: clientApex.contactPerson,
      contactPhone: clientApex.contactPhone,
      contactEmail: clientApex.contactEmail,
      status: "QUOTED",
      priority: "MEDIUM",
      folderName: "202611-003_ApexEnv_WaterTreatmentSCADA",
      estimatedBudget: 120000,
      targetDate: new Date("2026-12-15"),
      summary: "Retrofitting 4 dosing stations with remote Ethernet IO stations, upgrading central SCADA to Ignition / WinCC.",
      revisions: {
        create: [
          {
            revCode: "Rev 1.0",
            type: "COSTING",
            summary: "Complete IO list breakdown: 128 DI, 64 DO, 32 AI, 8 AO. Panel fabrication included.",
            totalAmount: 118000,
            createdAt: new Date("2026-11-12T10:00:00Z"),
          },
        ],
      },
      todos: {
        create: [
          { task: "Follow up with client after tender evaluation meeting", completed: false, dueDate: new Date("2026-11-25") },
        ],
      },
    },
  });

  console.log("Seeding with Clients finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

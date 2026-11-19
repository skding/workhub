"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Download,
  Copy,
  FolderSync,
  Layers,
  Cpu,
  Zap,
  RotateCcw,
  Calculator,
  ChevronDown,
  ChevronRight,
  Package,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Shield,
  HelpCircle,
  ArrowRight,
  Edit2,
  X
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import * as XLSX from "xlsx";

interface IORequirement {
  id: string;
  ioType: string;
  quantity: number;
}

interface EquipmentIO {
  id: string;
  ioType: string;
  quantity: number;
}

interface Equipment {
  id: string;
  name: string;
  quantity: number;
  io: EquipmentIO[];
}

interface Section {
  id: string;
  name: string;
  mandays: number;
  mobilization: number;
  lodging: number;
  documentation: number;
  training: number;
  ioRequirements: IORequirement[];
  equipment: Equipment[];
}

interface System {
  id: string;
  name: string;
  mandays: number;
  mobilization: number;
  lodging: number;
  documentation: number;
  training: number;
  sections: Section[];
}

interface ComponentItem {
  id: string;
  catalogId?: string | null;
  componentName: string;
  category?: string | null;
  quantity: number;
  snapshottedPrice: number;
  systemId?: string | null;
  sectionId?: string | null;
  catalog?: {
    id: string;
    model: string;
    brand: string;
    description: string;
    category: string;
    ioSpecs?: any;
  } | null;
}

interface CostSettings {
  engRateDigital: number;
  engRateAnalog: number;
  engRateHLI: number;
  cablingCostPerIO: number;
  siteWorkRates?: string | null;
}

interface VersionData {
  id: string;
  versionNumber: number;
  status: string;
  projectName?: string | null;
  markup: number;
  markupSiteWork: number;
  totalCost: number;
  totalSelling: number;
  enquiryId?: string | null;
  costSettings: CostSettings | null;
  systems: System[];
  components: ComponentItem[];
  enquiry?: {
    id: string;
    code: string;
    title: string;
    clientName: string;
    folderName: string;
  } | null;
}

interface ProjectCostingEditorProps {
  enquiryId?: string;
  onRevisionSaved?: () => void;
  onOpenCatalog?: () => void;
}

export default function ProjectCostingEditor({
  enquiryId,
  onRevisionSaved,
  onOpenCatalog,
}: ProjectCostingEditorProps) {
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<VersionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Active Editor View: "hierarchy" | "bom" | "settings"
  const [activeTab, setActiveTab] = useState<"hierarchy" | "bom" | "settings">("hierarchy");

  // Expanded tree states
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Catalog items for BOM dropdown
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // Add Component Modal / inline state
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [selectedTargetSystemId, setSelectedTargetSystemId] = useState("");
  const [selectedTargetSectionId, setSelectedTargetSectionId] = useState("");
  const [componentQty, setComponentQty] = useState(1);

  // Custom Auto-Calc Item Modal state
  const [isAutoCalcModalOpen, setIsAutoCalcModalOpen] = useState(false);
  const [autoCalcName, setAutoCalcName] = useState("");
  const [autoCalcPrice, setAutoCalcPrice] = useState(0);
  const [autoCalcTargetSystemId, setAutoCalcTargetSystemId] = useState("");
  const [autoCalcFactors, setAutoCalcFactors] = useState<{
    DI: number;
    DO: number;
    AI: number;
    AO: number;
    RTD: number;
    HLI: number;
  }>({
    DI: 0,
    DO: 1,
    AI: 0,
    AO: 0,
    RTD: 0,
    HLI: 0,
  });

  // Settings state
  const [markupVal, setMarkupVal] = useState(1.25);
  const [markupSiteVal, setMarkupSiteVal] = useState(1.15);
  const [engDigitalRate, setEngDigitalRate] = useState(80);
  const [engAnalogRate, setEngAnalogRate] = useState(150);
  const [engHLIRate, setEngHLIRate] = useState(300);
  const [cablingRate, setCablingRate] = useState(50);

  // Fetch all versions for this enquiry
  const fetchVersions = async () => {
    try {
      setLoading(true);
      const url = enquiryId ? `/api/costing/versions?enquiryId=${enquiryId}` : `/api/costing/versions`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data) {
        setVersions(data.data);
        if (data.data.length > 0) {
          // Select latest or retain current
          const targetId = selectedVersionId && data.data.find((v: any) => v.id === selectedVersionId)
            ? selectedVersionId
            : data.data[0].id;
          setSelectedVersionId(targetId);
          fetchVersionDetail(targetId);
        } else {
          // Auto create initial Rev 1 if none exist for this enquiry
          handleCreateInitialVersion();
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load costing versions" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInitialVersion = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/costing/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId,
          markup: 1.25,
          markupSiteWork: 1.15,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVersions([data.data]);
        setSelectedVersionId(data.data.id);
        fetchVersionDetail(data.data.id);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Failed to initialize costing sheet" });
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/costing/versions/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentVersion(data.data);
        setMarkupVal(data.data.markup || 1.25);
        setMarkupSiteVal(data.data.markupSiteWork || 1.15);

        if (data.data.costSettings) {
          setEngDigitalRate(data.data.costSettings.engRateDigital || 80);
          setEngAnalogRate(data.data.costSettings.engRateAnalog || 150);
          setEngHLIRate(data.data.costSettings.engRateHLI || 300);
          setCablingRate(data.data.costSettings.cablingCostPerIO || 50);
        }

        // Auto expand all systems and sections initially
        const sysExp: Record<string, boolean> = {};
        const secExp: Record<string, boolean> = {};
        data.data.systems.forEach((sys: System) => {
          sysExp[sys.id] = true;
          sys.sections.forEach((sec: Section) => {
            secExp[sec.id] = true;
          });
        });
        setExpandedSystems(sysExp);
        setExpandedSections(secExp);
      }
    } catch (err: any) {
      console.error("Failed to load version details", err);
    }
  };

  const fetchCatalogAndPackages = async () => {
    try {
      const [compRes, pkgRes] = await Promise.all([
        fetch("/api/costing/components"),
        fetch("/api/costing/packages"),
      ]);
      const compData = await compRes.json();
      const pkgData = await pkgRes.json();

      if (compData.success) setCatalogItems(compData.data || []);
      if (pkgData.success) setPackages(pkgData.data || []);
    } catch (err) {
      console.error("Failed to fetch catalog", err);
    }
  };

  useEffect(() => {
    fetchVersions();
    fetchCatalogAndPackages();
  }, [enquiryId]);

  // LIVE TOTALS CALCULATION
  const calculateTotals = () => {
    if (!currentVersion) {
      return {
        digital: 0,
        analog: 0,
        hli: 0,
        totalIO: 0,
        hardwareCost: 0,
        engCost: 0,
        cablingCost: 0,
        siteSubtotal: 0,
        totalNet: 0,
        totalSelling: 0,
      };
    }

    let digital = 0;
    let analog = 0;
    let hli = 0;
    let siteSubtotal = 0;

    currentVersion.systems.forEach((sys) => {
      siteSubtotal += (Number(sys.mandays) || 0) + (Number(sys.mobilization) || 0) + (Number(sys.lodging) || 0) + (Number(sys.documentation) || 0) + (Number(sys.training) || 0);

      sys.sections.forEach((sec) => {
        siteSubtotal += (Number(sec.mandays) || 0) + (Number(sec.mobilization) || 0) + (Number(sec.lodging) || 0) + (Number(sec.documentation) || 0) + (Number(sec.training) || 0);

        // Section base IO
        sec.ioRequirements.forEach((io) => {
          if (io.ioType === "DI" || io.ioType === "DO") digital += io.quantity;
          else if (io.ioType === "AI" || io.ioType === "AO" || io.ioType === "RTD") analog += io.quantity;
          else if (io.ioType === "HLI") hli += io.quantity;
        });

        // Equipment IO
        sec.equipment.forEach((eq) => {
          const qty = eq.quantity || 1;
          eq.io.forEach((point) => {
            const count = point.quantity * qty;
            if (point.ioType === "DI" || point.ioType === "DO") digital += count;
            else if (point.ioType === "AI" || point.ioType === "AO" || point.ioType === "RTD") analog += count;
            else if (point.ioType === "HLI") hli += count;
          });
        });
      });
    });

    const hardwareCost = currentVersion.components.reduce(
      (acc, c) => acc + (Number(c.snapshottedPrice) || 0) * (c.quantity || 1),
      0
    );

    const totalIO = digital + analog + hli;
    const engCost = (digital * engDigitalRate) + (analog * engAnalogRate) + (hli * engHLIRate);
    const cablingCost = totalIO * cablingRate;

    const totalNet = hardwareCost + engCost + cablingCost + siteSubtotal;
    const totalSelling = (hardwareCost + engCost + cablingCost) * markupVal + (siteSubtotal * markupSiteVal);

    return {
      digital,
      analog,
      hli,
      totalIO,
      hardwareCost,
      engCost,
      cablingCost,
      siteSubtotal,
      totalNet,
      totalSelling,
    };
  };

  const totals = calculateTotals();

  // Helper to calculate total IO in a target scope (whole project, specific system, or specific section)
  const getTargetIO = (targetSystemId?: string | null, targetSectionId?: string | null) => {
    const ioTotals: Record<string, number> = { DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 };
    if (!currentVersion) return ioTotals;

    currentVersion.systems.forEach((sys) => {
      if (targetSystemId && sys.id !== targetSystemId) return;

      sys.sections.forEach((sec) => {
        if (targetSectionId && sec.id !== targetSectionId) return;

        (sec.ioRequirements || []).forEach((req) => {
          if (req.ioType in ioTotals) {
            ioTotals[req.ioType] += Number(req.quantity) || 0;
          }
        });

        (sec.equipment || []).forEach((eq) => {
          const eqQty = Number(eq.quantity) || 1;
          (eq.io || []).forEach((point) => {
            if (point.ioType in ioTotals) {
              ioTotals[point.ioType] += (Number(point.quantity) || 0) * eqQty;
            }
          });
        });
      });
    });

    return ioTotals;
  };

  const calculateAutoQuantity = (
    factors: { DI?: number; DO?: number; AI?: number; AO?: number; RTD?: number; HLI?: number },
    targetSystemId?: string | null,
    targetSectionId?: string | null
  ) => {
    const io = getTargetIO(targetSystemId, targetSectionId);
    const sum =
      (Number(factors.DI) || 0) * (io.DI || 0) +
      (Number(factors.DO) || 0) * (io.DO || 0) +
      (Number(factors.AI) || 0) * (io.AI || 0) +
      (Number(factors.AO) || 0) * (io.AO || 0) +
      (Number(factors.RTD) || 0) * (io.RTD || 0) +
      (Number(factors.HLI) || 0) * (io.HLI || 0);
    return sum > 0 ? Math.ceil(sum) : 1;
  };

  // CLONE VERSION (Rev 1 -> Rev 2)
  const handleCloneVersion = async () => {
    if (!selectedVersionId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/costing/versions/${selectedVersionId}/clone`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to clone version");

      setFeedback({ type: "success", message: `Cloned as Rev ${data.data.versionNumber}.0 successfully!` });
      fetchVersions();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Clone failed" });
      setLoading(false);
    }
  };

  // SAVE & SYNC TO ONEDRIVE
  const handleSaveToOneDrive = async () => {
    if (!selectedVersionId) return;
    try {
      setExporting(true);
      setFeedback(null);

      // 1. Update version totals and settings first
      await fetch(`/api/costing/versions/${selectedVersionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markup: markupVal,
          markupSiteWork: markupSiteVal,
          totalCost: totals.totalNet,
          totalSelling: totals.totalSelling,
        }),
      });

      // 2. Export Excel directly to enquiry's 03_Costing_Revisions folder in OneDrive
      const res = await fetch(`/api/costing/versions/${selectedVersionId}/export-onedrive`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Export failed");
      }

      setFeedback({
        type: "success",
        message: data.data.savedToOneDrive
          ? `Excel sheet synced to OneDrive: ${data.data.fileName} & WorkHub revision updated!`
          : `Costing revision updated to RM ${formatNumber(totals.totalSelling)}!`,
      });

      if (onRevisionSaved) onRevisionSaved();
      fetchVersions();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to export to OneDrive" });
    } finally {
      setExporting(false);
    }
  };

  // DOWNLOAD EXCEL TO BROWSER DIRECTLY
  const handleDownloadExcel = () => {
    if (!currentVersion) return;
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      ["WORKHUB AUTOMATION & ENGINEERING OPERATIONS", ""],
      ["PROJECT COSTING BREAKDOWN & QUOTATION SHEET", ""],
      ["", ""],
      ["Project Title", currentVersion.projectName || currentVersion.enquiry?.title || "N/A"],
      ["Enquiry Code", currentVersion.enquiry?.code || "N/A"],
      ["Client", currentVersion.enquiry?.clientName || "N/A"],
      ["Version / Revision", `Rev ${currentVersion.versionNumber}.0`],
      ["Status", currentVersion.status],
      ["Date Generated", new Date().toLocaleDateString("en-GB")],
      ["", ""],
      ["COST BREAKDOWN SUMMARY", "AMOUNT (RM)"],
      ["Hardware & Components BOM", totals.hardwareCost.toFixed(2)],
      ["Engineering & Programming", totals.engCost.toFixed(2)],
      ["Panel Cabling & Interconnect", totals.cablingCost.toFixed(2)],
      ["Site Work, Mandays & Testing", totals.siteSubtotal.toFixed(2)],
      ["Total Net Cost (RM)", totals.totalNet.toFixed(2)],
      ["", ""],
      ["COMMERCIAL MARKUP & SELLING PRICE", ""],
      ["Hardware & Eng Markup Factor", markupVal.toFixed(2)],
      ["Site Work Markup Factor", markupSiteVal.toFixed(2)],
      ["TOTAL SELLING PRICE (RM)", totals.totalSelling.toFixed(2)],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

    // BOM Sheet
    const bomRows: any[] = [
      ["No", "Brand", "Model", "Description", "Category", "Qty", "Unit Price (RM)", "Total (RM)"],
    ];
    currentVersion.components.forEach((c, idx) => {
      bomRows.push([
        idx + 1,
        c.catalog?.brand || "General",
        c.catalog?.model || "-",
        c.componentName || c.catalog?.description || "",
        c.category || c.catalog?.category || "HARDWARE",
        c.quantity,
        c.snapshottedPrice.toFixed(2),
        (c.snapshottedPrice * c.quantity).toFixed(2),
      ]);
    });
    const wsBOM = XLSX.utils.aoa_to_sheet(bomRows);
    XLSX.utils.book_append_sheet(wb, wsBOM, "Hardware BOM");

    XLSX.writeFile(wb, `WorkHub_Costing_Rev${currentVersion.versionNumber}_${currentVersion.enquiry?.code || "Project"}.xlsx`);
  };

  // SYSTEM / SECTION / IO ACTIONS
  const handleAddSystem = async () => {
    if (!selectedVersionId) return;
    try {
      const res = await fetch(`/api/costing/versions/${selectedVersionId}/systems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `System ${currentVersion ? currentVersion.systems.length + 1 : 1}` }),
      });
      const data = await res.json();
      if (data.success) fetchVersionDetail(selectedVersionId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSystemField = async (systemId: string, field: string, val: any) => {
    try {
      await fetch(`/api/costing/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: val }),
      });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSystem = async (systemId: string) => {
    if (!confirm("Are you sure you want to delete this system and all its sections?")) return;
    try {
      await fetch(`/api/costing/systems/${systemId}`, { method: "DELETE" });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSection = async (systemId: string) => {
    try {
      const res = await fetch(`/api/costing/systems/${systemId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Section" }),
      });
      const data = await res.json();
      if (data.success) fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSectionField = async (sectionId: string, field: string, val: any) => {
    try {
      await fetch(`/api/costing/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: val }),
      });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and its IO configuration?")) return;
    try {
      await fetch(`/api/costing/sections/${sectionId}`, { method: "DELETE" });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSectionIO = async (section: Section, ioType: string, qty: number) => {
    const existing = section.ioRequirements.map((io) => ({
      ioType: io.ioType,
      quantity: io.ioType === ioType ? Math.max(0, qty) : io.quantity,
    }));

    if (!existing.find((i) => i.ioType === ioType)) {
      existing.push({ ioType, quantity: Math.max(0, qty) });
    }

    try {
      await fetch(`/api/costing/sections/${section.id}/io`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ioRequirements: existing }),
      });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  // EQUIPMENT ACTIONS
  const handleAddEquipment = async (sectionId: string) => {
    const eqName = prompt("Enter Equipment / Subsystem Name (e.g. Infeed Motor Sorter):");
    if (!eqName) return;

    try {
      await fetch(`/api/costing/sections/${sectionId}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eqName,
          quantity: 1,
          io: [
            { ioType: "DI", quantity: 2 },
            { ioType: "DO", quantity: 2 },
          ],
        }),
      });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      await fetch(`/api/costing/equipment/${equipmentId}`, { method: "DELETE" });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  // BOM HARDWARE ACTIONS
  const handleAddComponentToBOM = async () => {
    if (!selectedVersionId) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/costing/versions/${selectedVersionId}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: selectedCatalogId || null,
          quantity: Number(componentQty) || 1,
          systemId: selectedTargetSystemId || null,
          sectionId: selectedTargetSectionId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add component to BOM");
      }

      setSelectedCatalogId("");
      setComponentQty(1);
      fetchVersionDetail(selectedVersionId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to add component to BOM" });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateBOMComponent = async (c: ComponentItem) => {
    if (!c.catalog?.ioSpecs?.ioFactors || !selectedVersionId) return;

    const newQty = calculateAutoQuantity(
      c.catalog.ioSpecs.ioFactors,
      c.systemId || null,
      c.sectionId || null
    );

    try {
      setSaving(true);
      await fetch(`/api/costing/components-bom/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      setFeedback({
        type: "success",
        message: `Updated ${c.catalog.model || c.componentName} quantity to ${newQty} pcs based on current I/O!`,
      });
      fetchVersionDetail(selectedVersionId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to recalculate quantity" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomAutoCalcItem = async () => {
    if (!selectedVersionId || !autoCalcName.trim()) return;

    try {
      setSaving(true);
      const qty = calculateAutoQuantity(autoCalcFactors, autoCalcTargetSystemId || null);
      const res = await fetch(`/api/costing/versions/${selectedVersionId}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentName: autoCalcName.trim(),
          snapshottedPrice: Number(autoCalcPrice) || 0,
          quantity: qty,
          category: "HARDWARE",
          systemId: autoCalcTargetSystemId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add auto-calculated item");
      }

      setIsAutoCalcModalOpen(false);
      setAutoCalcName("");
      setAutoCalcPrice(0);
      setFeedback({
        type: "success",
        message: `Added "${autoCalcName.trim()}" with auto-calculated quantity of ${qty} pcs!`,
      });
      fetchVersionDetail(selectedVersionId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to add auto-calc item" });
    } finally {
      setSaving(false);
    }
  };

  const handleInsertPackage = async (pkg: any) => {
    if (!selectedVersionId) return;
    try {
      setSaving(true);
      for (const item of pkg.items) {
        await fetch(`/api/costing/versions/${selectedVersionId}/components`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            catalogId: item.catalogId,
            quantity: item.quantity,
            systemId: selectedTargetSystemId || null,
            sectionId: selectedTargetSectionId || null,
          }),
        });
      }
      setFeedback({ type: "success", message: `Inserted package "${pkg.name}" into BOM!` });
      fetchVersionDetail(selectedVersionId);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBOMComponent = async (id: string) => {
    try {
      await fetch(`/api/costing/components-bom/${id}`, { method: "DELETE" });
      fetchVersionDetail(selectedVersionId!);
    } catch (err) {
      console.error(err);
    }
  };

  // SAVE RATES / SETTINGS
  const handleSaveSettings = async () => {
    if (!selectedVersionId) return;
    try {
      setSaving(true);
      await Promise.all([
        fetch(`/api/costing/versions/${selectedVersionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markup: markupVal,
            markupSiteWork: markupSiteVal,
            totalCost: totals.totalNet,
            totalSelling: totals.totalSelling,
          }),
        }),
        fetch(`/api/costing/versions/${selectedVersionId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            engRateDigital: engDigitalRate,
            engRateAnalog: engAnalogRate,
            engRateHLI: engHLIRate,
            cablingCostPerIO: cablingRate,
          }),
        }),
      ]);

      setFeedback({ type: "success", message: "Rates & markups saved successfully!" });
      fetchVersionDetail(selectedVersionId);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !currentVersion) {
    return (
      <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading Costing Engine & Component Catalog...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-100">
      {/* 1. TOP CONTROLS & REVISION SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
            <Calculator className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revision Sheet:</span>
              <select
                value={selectedVersionId || ""}
                onChange={(e) => {
                  setSelectedVersionId(e.target.value);
                  fetchVersionDetail(e.target.value);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Rev {v.versionNumber}.0 • {v.status} (RM {formatNumber(v.totalSelling || 0)})
                  </option>
                ))}
              </select>

              <button
                onClick={handleCloneVersion}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1 transition cursor-pointer"
                title="Create a new revision based on this one (Save As Next Rev)"
              >
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>+ Clone as Next Rev</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentVersion?.enquiry?.code ? `${currentVersion.enquiry.code} • ${currentVersion.enquiry.title}` : currentVersion?.projectName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hardware Catalog</span>
            </button>
          )}

          <button
            onClick={handleDownloadExcel}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Download Excel breakdown file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleSaveToOneDrive}
            disabled={exporting}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-cyan-950 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Sync Excel quote sheet directly into OneDrive 03_Costing_Revisions and update WorkHub enquiry"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Syncing OneDrive...</span>
              </>
            ) : (
              <>
                <FolderSync className="w-3.5 h-3.5" />
                <span>Save & Sync to OneDrive</span>
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
              : "bg-rose-950/60 border-rose-800/80 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. LIVE METRICS RIBBON (FULL HD COMPATIBLE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Selling Price */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-slate-900 border border-cyan-800/60 shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">
            <span>Selling Price</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-200 font-mono">
              {markupVal}x Markup
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            RM {formatNumber(Math.round(totals.totalSelling))}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5 font-mono">
            Quoted to Client
          </div>
        </div>

        {/* Total Net Cost */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Net Cost
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
            RM {formatNumber(Math.round(totals.totalNet))}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Internal Cost Baseline
          </div>
        </div>

        {/* Hardware BOM */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Hardware BOM
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
            RM {formatNumber(Math.round(totals.hardwareCost))}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {currentVersion?.components.length || 0} Parts Selected
          </div>
        </div>

        {/* Engineering & Programming */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Engineering & Cabling
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
            RM {formatNumber(Math.round(totals.engCost + totals.cablingCost))}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            PLC Logic & Cabling
          </div>
        </div>

        {/* Site Work & Testing */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Site Work & Testing
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
            RM {formatNumber(Math.round(totals.siteSubtotal))}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            Mandays, Lodging, Docs
          </div>
        </div>

        {/* Total IO Metrics */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>IO Count</span>
            <span className="text-cyan-400 font-bold">{totals.totalIO} Total</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] font-mono text-slate-300">
            <span className="bg-slate-950 px-1 py-0.5 rounded text-center">DI/DO: {totals.digital}</span>
            <span className="bg-slate-950 px-1 py-0.5 rounded text-center">AI/AO: {totals.analog}</span>
            <span className="bg-slate-950 px-1 py-0.5 rounded text-center">HLI: {totals.hli}</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="flex items-center border-b border-slate-800 space-x-2 text-xs">
        <button
          onClick={() => setActiveTab("hierarchy")}
          className={`pb-2.5 px-3 font-semibold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "hierarchy"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Systems & IO Breakdown</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {currentVersion?.systems.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("bom")}
          className={`pb-2.5 px-3 font-semibold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "bom"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>2. Hardware Bill of Materials (BOM)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {currentVersion?.components.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-2.5 px-3 font-semibold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "settings"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>3. Rates & Markups</span>
        </button>
      </div>

      {/* TAB 1: HIERARCHY & IO BREAKDOWN */}
      {activeTab === "hierarchy" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Configure Systems, Automation Sections, Equipment & I/O signals
            </span>
            <button
              onClick={handleAddSystem}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add System</span>
            </button>
          </div>

          {currentVersion?.systems.map((system, sysIdx) => {
            const isSysExpanded = expandedSystems[system.id] !== false;

            return (
              <div
                key={system.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow"
              >
                {/* System Header */}
                <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setExpandedSystems((prev) => ({ ...prev, [system.id]: !isSysExpanded }))
                      }
                      className="p-1 rounded hover:bg-slate-800 text-slate-400"
                    >
                      {isSysExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                        SYS-{sysIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={system.name}
                        onChange={(e) => handleUpdateSystemField(system.id, "name", e.target.value)}
                        className="bg-transparent font-bold text-sm text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1.5 py-0.5"
                      />
                    </div>
                  </div>

                  {/* System Level Site Work Quick Inputs */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Mandays (RM):</span>
                      <input
                        type="number"
                        value={system.mandays}
                        onChange={(e) => handleUpdateSystemField(system.id, "mandays", Number(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right text-white"
                      />
                      <span>Mob/Lodging:</span>
                      <input
                        type="number"
                        value={system.mobilization + system.lodging}
                        onChange={(e) => handleUpdateSystemField(system.id, "mobilization", Number(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right text-white"
                      />
                    </div>

                    <button
                      onClick={() => handleAddSection(system.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>Section</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSystem(system.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Delete System"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* System Content (Sections List) */}
                {isSysExpanded && (
                  <div className="p-4 space-y-4">
                    {system.sections.map((section, secIdx) => {
                      const isSecExpanded = expandedSections[section.id] !== false;

                      // Map IO types
                      const ioMap: Record<string, number> = { DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 };
                      section.ioRequirements.forEach((io) => {
                        ioMap[io.ioType] = io.quantity;
                      });

                      return (
                        <div
                          key={section.id}
                          className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                SEC-{secIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={section.name}
                                onChange={(e) => handleUpdateSectionField(section.id, "name", e.target.value)}
                                className="bg-transparent font-semibold text-xs text-white focus:bg-slate-900 rounded px-1.5 py-0.5"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAddEquipment(section.id)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>+ Equipment</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSection(section.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Base IO Grid for Section */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                            {(["DI", "DO", "AI", "AO", "RTD", "HLI"] as const).map((type) => (
                              <div key={type} className="text-center">
                                <span className="block text-[10px] font-mono font-bold text-slate-400 mb-0.5">
                                  {type}
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={ioMap[type] || 0}
                                  onChange={(e) =>
                                    handleUpdateSectionIO(section, type, Number(e.target.value))
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Equipment Sub-items in Section */}
                          {section.equipment.length > 0 && (
                            <div className="space-y-1.5 pl-2 border-l-2 border-cyan-800/40">
                              <span className="text-[10px] font-mono uppercase text-slate-400">
                                Connected Equipment ({section.equipment.length})
                              </span>
                              {section.equipment.map((eq) => (
                                <div
                                  key={eq.id}
                                  className="flex items-center justify-between text-xs bg-slate-900/40 p-2 rounded border border-slate-800/40"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-200">{eq.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      (Qty: {eq.quantity})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400">
                                    {eq.io.map((p) => (
                                      <span key={p.id}>
                                        {p.ioType}:{p.quantity * eq.quantity}
                                      </span>
                                    ))}
                                    <button
                                      onClick={() => handleDeleteEquipment(eq.id)}
                                      className="p-1 text-slate-500 hover:text-rose-400 ml-2"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: HARDWARE BILL OF MATERIALS (BOM) */}
      {activeTab === "bom" && (
        <div className="space-y-4">
          {/* Add Component Drawer */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-800/50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Component from Master Catalog
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAutoCalcTargetSystemId(selectedTargetSystemId);
                    setIsAutoCalcModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-[10px] font-semibold text-amber-300 transition cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>+ Auto-Calc Item</span>
                </button>
                {packages.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">1-Click Kits:</span>
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => handleInsertPackage(pkg)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-[10px] font-semibold text-indigo-300 transition cursor-pointer"
                      >
                        + {pkg.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Select Hardware Component *
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => {
                    const catId = e.target.value;
                    setSelectedCatalogId(catId);
                    const found = catalogItems.find((c) => c.id === catId);
                    if (found?.ioSpecs?.isAutoCalc && found?.ioSpecs?.ioFactors) {
                      const autoQty = calculateAutoQuantity(
                        found.ioSpecs.ioFactors,
                        selectedTargetSystemId,
                        selectedTargetSectionId
                      );
                      setComponentQty(autoQty);
                    } else {
                      setComponentQty(1);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="">-- Choose Model from Catalog --</option>
                  {catalogItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.brand}] {c.model} - {c.description} (RM {formatNumber(c.listPrice)})
                      {c.ioSpecs?.isAutoCalc ? " ⚡ [Auto-Calc]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Assign to System (Optional)
                </label>
                <select
                  value={selectedTargetSystemId}
                  onChange={(e) => {
                    const sysId = e.target.value;
                    setSelectedTargetSystemId(sysId);
                    setSelectedTargetSectionId("");
                    const found = catalogItems.find((c) => c.id === selectedCatalogId);
                    if (found?.ioSpecs?.isAutoCalc && found?.ioSpecs?.ioFactors) {
                      const autoQty = calculateAutoQuantity(found.ioSpecs.ioFactors, sysId, null);
                      setComponentQty(autoQty);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">Whole Project (Global)</option>
                  {currentVersion?.systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <div className="w-24">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-slate-400">Qty</label>
                    {selectedCatalogId && catalogItems.find((c) => c.id === selectedCatalogId)?.ioSpecs?.isAutoCalc && (
                      <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> Auto
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={componentQty}
                    onChange={(e) => setComponentQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-center text-white"
                  />
                </div>
                <button
                  onClick={handleAddComponentToBOM}
                  disabled={!selectedCatalogId || saving}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to BOM</span>
                </button>
              </div>
            </div>
          </div>

          {/* BOM Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item & Model</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit (RM)</th>
                  <th className="py-3 px-4 text-right">Total (RM)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {currentVersion?.components.map((c) => {
                  const lineTotal = (c.snapshottedPrice || 0) * (c.quantity || 1);
                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {c.catalog?.model || c.componentName}
                          </span>
                          {c.catalog?.ioSpecs?.isAutoCalc && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] flex items-center gap-0.5 font-semibold"
                              title="Auto-calculated from I/O factors"
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-400" /> Auto
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[320px]">
                          {c.componentName || c.catalog?.description}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {c.catalog?.brand || "General"}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono">
                          {c.category || c.catalog?.category || "HARDWARE"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{c.quantity}</span>
                          {c.catalog?.ioSpecs?.isAutoCalc && c.catalog?.ioSpecs?.ioFactors && (
                            <button
                              onClick={() => handleRecalculateBOMComponent(c)}
                              className="p-1 rounded hover:bg-amber-950 text-slate-500 hover:text-amber-300 transition cursor-pointer"
                              title="Recalculate quantity based on current I/O"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        RM {formatNumber(c.snapshottedPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                        RM {formatNumber(lineTotal)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteBOMComponent(c.id)}
                          className="p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {currentVersion?.components.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No components added to BOM yet. Select a model above or click a 1-click kit!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RATES & MARKUPS */}
      {activeTab === "settings" && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">Engineering Rates & Margin Multipliers</h3>
            <p className="text-xs text-slate-400">
              Customize the engineering man-hour rate per IO point and commercial markup factors for this revision.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Digital IO Rate (RM / pt)
              </label>
              <input
                type="number"
                value={engDigitalRate}
                onChange={(e) => setEngDigitalRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500">Applies to DI and DO signals</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Analog IO Rate (RM / pt)
              </label>
              <input
                type="number"
                value={engAnalogRate}
                onChange={(e) => setEngAnalogRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500">Applies to 4-20mA, 0-10V & RTD</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                HLI / Comms Interface (RM / link)
              </label>
              <input
                type="number"
                value={engHLIRate}
                onChange={(e) => setEngHLIRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500">Modbus, Profinet, Ethernet/IP</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cabling Cost per IO (RM / pt)
              </label>
              <input
                type="number"
                value={cablingRate}
                onChange={(e) => setCablingRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500">Panel wiring & terminal blocks</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-300 mb-1">
                Hardware & Eng Markup (Factor)
              </label>
              <input
                type="number"
                step="0.05"
                value={markupVal}
                onChange={(e) => setMarkupVal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-cyan-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-cyan-300"
              />
              <span className="text-[10px] text-slate-500">e.g. 1.25 = 25% profit margin</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-300 mb-1">
                Site Work Markup (Factor)
              </label>
              <input
                type="number"
                step="0.05"
                value={markupSiteVal}
                onChange={(e) => setMarkupSiteVal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-cyan-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-cyan-300"
              />
              <span className="text-[10px] text-slate-500">e.g. 1.15 = 15% travel/site markup</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Rates..." : "Apply & Save Rates"}
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM AUTO-CALC ITEM MODAL */}
      {isAutoCalcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-amber-800/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Auto-Calculated BOM Item</h3>
                  <p className="text-[11px] text-slate-400">
                    Quantity automatically derives from project I/O counts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoCalcModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Component Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interposing Relay 24VDC 1CO"
                  value={autoCalcName}
                  onChange={(e) => setAutoCalcName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Unit List Price (RM) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="35.00"
                    value={autoCalcPrice || ""}
                    onChange={(e) => setAutoCalcPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Scope / Target System
                  </label>
                  <select
                    value={autoCalcTargetSystemId}
                    onChange={(e) => setAutoCalcTargetSystemId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Whole Project (Global)</option>
                    {currentVersion?.systems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Presets */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!autoCalcName) setAutoCalcName("Interposing Relay 24VDC (1×DO)");
                      setAutoCalcFactors({ DI: 0, DO: 1, AI: 0, AO: 0, RTD: 0, HLI: 0 });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 cursor-pointer"
                  >
                    Relays (1×DO)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!autoCalcName) setAutoCalcName("Signal Isolator 4-20mA (1×AI)");
                      setAutoCalcFactors({ DI: 0, DO: 0, AI: 1, AO: 0, RTD: 0, HLI: 0 });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 cursor-pointer"
                  >
                    Isolators (1×AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!autoCalcName) setAutoCalcName("Terminal Block Set (2xDI/DO + 3xAnalog)");
                      setAutoCalcFactors({ DI: 2, DO: 2, AI: 3, AO: 3, RTD: 3, HLI: 0 });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 cursor-pointer"
                  >
                    Terminals (2xDI/DO, 3xAnalog)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoCalcFactors({ DI: 1, DO: 1, AI: 1, AO: 1, RTD: 1, HLI: 1 })}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 cursor-pointer"
                  >
                    1× Each I/O
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2 pt-1">
                  {(["DI", "DO", "AI", "AO", "RTD", "HLI"] as const).map((io) => (
                    <div key={io}>
                      <label className="block text-[10px] text-center text-slate-400 font-mono">
                        {io} Factor
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={autoCalcFactors[io]}
                        onChange={(e) =>
                          setAutoCalcFactors({
                            ...autoCalcFactors,
                            [io]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded text-center text-xs text-amber-300 font-mono py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Preview */}
              {(() => {
                const calcQty = calculateAutoQuantity(autoCalcFactors, autoCalcTargetSystemId || null);
                const calcTotal = calcQty * (Number(autoCalcPrice) || 0);
                return (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Computed Quantity
                      </span>
                      <span className="text-base font-bold text-amber-300 font-mono">
                        {calcQty} pcs
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Line Total
                      </span>
                      <span className="text-base font-bold text-white font-mono">
                        RM {formatNumber(calcTotal)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAutoCalcModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomAutoCalcItem}
                disabled={!autoCalcName.trim() || saving}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to BOM</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

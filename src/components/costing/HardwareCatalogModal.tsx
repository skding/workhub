"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Trash2,
  Edit2,
  Package,
  Cpu,
  Layers,
  Check,
  AlertCircle,
  Tag,
  Boxes,
  DollarSign,
  Zap,
  RotateCcw
} from "lucide-react";
import { formatNumber } from "@/lib/format";

interface CatalogComponent {
  id: string;
  model: string;
  brand: string;
  description: string;
  listPrice: number;
  category: string;
  ioSpecs: any;
}

interface HardwarePackageItem {
  id?: string;
  catalogId: string;
  quantity: number;
  catalog?: CatalogComponent;
}

interface HardwarePackage {
  id: string;
  name: string;
  description: string | null;
  items: HardwarePackageItem[];
}

interface HardwareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComponentSelected?: (component: CatalogComponent) => void;
}

export default function HardwareCatalogModal({
  isOpen,
  onClose,
  onComponentSelected,
}: HardwareCatalogModalProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "packages">("catalog");
  const [components, setComponents] = useState<CatalogComponent[]>([]);
  const [packages, setPackages] = useState<HardwarePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [listPrice, setListPrice] = useState(0);
  const [category, setCategory] = useState("PLC");
  const [ioDI, setIoDI] = useState(0);
  const [ioDO, setIoDO] = useState(0);
  const [ioAI, setIoAI] = useState(0);
  const [ioAO, setIoAO] = useState(0);
  const [ioRTD, setIoRTD] = useState(0);
  const [ioHLI, setIoHLI] = useState(0);

  // Auto-calculation factors
  const [isAutoCalc, setIsAutoCalc] = useState(false);
  const [ioFactors, setIoFactors] = useState<{ DI: number; DO: number; AI: number; AO: number; RTD: number; HLI: number }>({
    DI: 0,
    DO: 0,
    AI: 0,
    AO: 0,
    RTD: 0,
    HLI: 0,
  });

  // Package Form states
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgItems, setPkgItems] = useState<{ catalogId: string; quantity: number; catalog?: CatalogComponent }[]>([]);
  const [pkgSearchTerm, setPkgSearchTerm] = useState("");

  const categories = ["All", "PLC", "HMI", "NETWORK", "SCADA", "HARDWARE", "SITE", "ENGINEERING"];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, pkgRes] = await Promise.all([
        fetch("/api/costing/components"),
        fetch("/api/costing/packages"),
      ]);
      const compData = await compRes.json();
      const pkgData = await pkgRes.json();

      if (compData.success) setComponents(compData.data || []);
      if (pkgData.success) setPackages(pkgData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !brand) return;

    try {
      const ioSpecs = {
        DI: ioDI,
        DO: ioDO,
        AI: ioAI,
        AO: ioAO,
        RTD: ioRTD,
        HLI: ioHLI,
        isAutoCalc,
        ioFactors: isAutoCalc ? ioFactors : undefined,
      };
      const payload = {
        model: model.trim(),
        brand: brand.trim(),
        description: description.trim(),
        listPrice: Number(listPrice) || 0,
        category,
        ioSpecs,
      };

      if (editingId) {
        await fetch(`/api/costing/components/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/costing/components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowAddForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (comp: CatalogComponent) => {
    setEditingId(comp.id);
    setModel(comp.model);
    setBrand(comp.brand);
    setDescription(comp.description);
    setListPrice(comp.listPrice);
    setCategory(comp.category);
    setIoDI(comp.ioSpecs?.DI || 0);
    setIoDO(comp.ioSpecs?.DO || 0);
    setIoAI(comp.ioSpecs?.AI || 0);
    setIoAO(comp.ioSpecs?.AO || 0);
    setIoRTD(comp.ioSpecs?.RTD || 0);
    setIoHLI(comp.ioSpecs?.HLI || 0);
    setIsAutoCalc(Boolean(comp.ioSpecs?.isAutoCalc));
    setIoFactors(comp.ioSpecs?.ioFactors || { DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;
    try {
      await fetch(`/api/costing/components/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setModel("");
    setBrand("");
    setDescription("");
    setListPrice(0);
    setCategory("PLC");
    setIoDI(0);
    setIoDO(0);
    setIoAI(0);
    setIoAO(0);
    setIoRTD(0);
    setIoHLI(0);
    setIsAutoCalc(false);
    setIoFactors({ DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 });
  };

  const filteredComponents = components.filter((c) => {
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory;
    const matchesSearch =
      c.model.toLowerCase().includes(search.toLowerCase()) ||
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Package Handlers
  const handleStartEditPkg = (pkg: HardwarePackage) => {
    setEditingPkgId(pkg.id);
    setPkgName(pkg.name);
    setPkgDesc(pkg.description || "");
    setPkgItems(
      pkg.items.map((i) => ({
        catalogId: i.catalogId,
        quantity: i.quantity,
        catalog: i.catalog,
      }))
    );
    setShowAddPkg(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    if (pkgItems.length === 0) {
      alert("Please add at least one component to the package.");
      return;
    }

    try {
      const payload = {
        name: pkgName.trim(),
        description: pkgDesc.trim() || null,
        items: pkgItems.map((i) => ({
          catalogId: i.catalogId,
          quantity: i.quantity,
        })),
      };

      if (editingPkgId) {
        await fetch(`/api/costing/packages/${editingPkgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/costing/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowAddPkg(false);
      setEditingPkgId(null);
      setPkgName("");
      setPkgDesc("");
      setPkgItems([]);
      fetchData();
    } catch (err) {
      console.error("Save Package Error:", err);
    }
  };

  const handleDeletePkg = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the package "${name}"?`)) return;
    try {
      await fetch(`/api/costing/packages/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Delete Package Error:", err);
    }
  };

  const addComponentToPkg = (comp: CatalogComponent) => {
    const existing = pkgItems.find((i) => i.catalogId === comp.id);
    if (existing) {
      setPkgItems(
        pkgItems.map((i) =>
          i.catalogId === comp.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setPkgItems([...pkgItems, { catalogId: comp.id, quantity: 1, catalog: comp }]);
    }
  };

  const updatePkgItemQty = (catalogId: string, quantity: number) => {
    if (quantity <= 0) {
      setPkgItems(pkgItems.filter((i) => i.catalogId !== catalogId));
    } else {
      setPkgItems(
        pkgItems.map((i) =>
          i.catalogId === catalogId ? { ...i, quantity } : i
        )
      );
    }
  };

  const removePkgItem = (catalogId: string) => {
    setPkgItems(pkgItems.filter((i) => i.catalogId !== catalogId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">PLC & Automation Hardware Catalog</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Master Pricing (RM)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage standard automation parts, PLCs, HMIs, network switches, and 1-click starter bundles
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 pt-3 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "catalog" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Components ({components.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "packages" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>1-Click Packages ({packages.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "catalog" ? (
            <>
              {/* Filter and Add Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search model, brand, or description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    setEditingId(null);
                    setShowAddForm(!showAddForm);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Component</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Add / Edit Form Drawer */}
              {showAddForm && (
                <form
                  onSubmit={handleSaveComponent}
                  className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <span>{editingId ? "Edit Component" : "Register New Component"}</span>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Model Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 6ES7214-1AG40-0XB0"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Brand *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Siemens, Schneider, Omron"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        {categories.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">List Price (RM) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="1850.00"
                        value={listPrice}
                        onChange={(e) => setListPrice(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="e.g. SIMATIC S7-1200 CPU 1214C DC/DC/DC with 14DI/10DO"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    {/* IO Capabilities (for PLCs & IO Cards) */}
                    <div className="sm:col-span-2 lg:col-span-4 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        Integrated I/O Specs (if PLC or Remote IO Card)
                      </span>
                      <div className="grid grid-cols-6 gap-2">
                        <div>
                          <label className="block text-[10px] text-center text-slate-500 font-mono">DI</label>
                          <input
                            type="number"
                            min={0}
                            value={ioDI}
                            onChange={(e) => setIoDI(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-xs text-cyan-300 font-mono py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-center text-slate-500 font-mono">DO</label>
                          <input
                            type="number"
                            min={0}
                            value={ioDO}
                            onChange={(e) => setIoDO(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-xs text-cyan-300 font-mono py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-center text-slate-500 font-mono">AI</label>
                          <input
                            type="number"
                            min={0}
                            value={ioAI}
                            onChange={(e) => setIoAI(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-xs text-cyan-300 font-mono py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-center text-slate-500 font-mono">AO</label>
                          <input
                            type="number"
                            min={0}
                            value={ioAO}
                            onChange={(e) => setIoAO(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-xs text-cyan-300 font-mono py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-center text-slate-500 font-mono">RTD</label>
                          <input
                            type="number"
                            min={0}
                            value={ioRTD}
                            onChange={(e) => setIoRTD(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-xs text-cyan-300 font-mono py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-center text-slate-500 font-mono">HLI</label>
                          <input
                            type="number"
                            min={0}
                            value={ioHLI}
                            onChange={(e) => setIoHLI(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded text-center text-xs text-cyan-300 font-mono py-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Automatic Quantity Calculation (I/O Factor Formula) */}
                    <div className="sm:col-span-2 lg:col-span-4 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAutoCalc}
                            onChange={(e) => setIsAutoCalc(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                          />
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Automatic Quantity Calculation (I/O Factor Formula)</span>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        When added to a project BOM, initial quantity will automatically compute: 
                        <span className="font-mono font-bold text-amber-300 ml-1">Total Qty = Σ (Factor × Respective I/O)</span>.
                      </p>

                      {isAutoCalc && (
                        <div className="space-y-3 pt-1">
                          {/* Presets */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono uppercase text-slate-400">Presets:</span>
                            <button
                              type="button"
                              onClick={() => setIoFactors({ DI: 0, DO: 1, AI: 0, AO: 0, RTD: 0, HLI: 0 })}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 transition cursor-pointer"
                            >
                              Relays (1×DO)
                            </button>
                            <button
                              type="button"
                              onClick={() => setIoFactors({ DI: 0, DO: 0, AI: 1, AO: 0, RTD: 0, HLI: 0 })}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 transition cursor-pointer"
                            >
                              Isolators (1×AI)
                            </button>
                            <button
                              type="button"
                              onClick={() => setIoFactors({ DI: 2, DO: 2, AI: 3, AO: 3, RTD: 3, HLI: 0 })}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 transition cursor-pointer"
                            >
                              Terminals (2×Digital, 3×Analog)
                            </button>
                            <button
                              type="button"
                              onClick={() => setIoFactors({ DI: 1, DO: 1, AI: 1, AO: 1, RTD: 1, HLI: 1 })}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-[10px] font-semibold text-slate-200 transition cursor-pointer"
                            >
                              1× Each I/O
                            </button>
                            <button
                              type="button"
                              onClick={() => setIoFactors({ DI: 0, DO: 0, AI: 0, AO: 0, RTD: 0, HLI: 0 })}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-rose-500 text-[10px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>

                          {/* 6 Factor Inputs */}
                          <div className="grid grid-cols-6 gap-2">
                            {(["DI", "DO", "AI", "AO", "RTD", "HLI"] as const).map((io) => (
                              <div key={io}>
                                <label className="block text-[10px] text-center text-amber-400/80 font-mono">
                                  {io} Factor
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={ioFactors[io] ?? 0}
                                  onChange={(e) =>
                                    setIoFactors({
                                      ...ioFactors,
                                      [io]: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full bg-slate-950 border border-amber-800/50 rounded text-center text-xs text-amber-300 font-mono py-1 focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                    >
                      {editingId ? "Save Changes" : "Create Component"}
                    </button>
                  </div>
                </form>
              )}

              {/* Components Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Model & Description</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">IO Specs</th>
                      <th className="py-3 px-4 text-right">List Price (RM)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredComponents.map((comp) => {
                      const hasIO = comp.ioSpecs && (
                        comp.ioSpecs.DI ||
                        comp.ioSpecs.DO ||
                        comp.ioSpecs.AI ||
                        comp.ioSpecs.AO ||
                        comp.ioSpecs.RTD ||
                        comp.ioSpecs.HLI
                      );

                      return (
                        <tr key={comp.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white font-mono">{comp.model}</div>
                            <div className="text-[11px] text-slate-400">{comp.description}</div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {comp.brand}
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono">
                              {comp.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            {hasIO ? (
                              <div className="flex flex-wrap gap-1">
                                {Boolean(comp.ioSpecs.DI) && (
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/50 text-cyan-300 text-[10px]">
                                    DI:{comp.ioSpecs.DI}
                                  </span>
                                )}
                                {Boolean(comp.ioSpecs.DO) && (
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/50 text-cyan-300 text-[10px]">
                                    DO:{comp.ioSpecs.DO}
                                  </span>
                                )}
                                {Boolean(comp.ioSpecs.AI) && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800/50 text-blue-300 text-[10px]">
                                    AI:{comp.ioSpecs.AI}
                                  </span>
                                )}
                                {Boolean(comp.ioSpecs.AO) && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800/50 text-blue-300 text-[10px]">
                                    AO:{comp.ioSpecs.AO}
                                  </span>
                                )}
                                {Boolean(comp.ioSpecs.RTD) && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800/50 text-amber-300 text-[10px]">
                                    RTD:{comp.ioSpecs.RTD}
                                  </span>
                                )}
                                {Boolean(comp.ioSpecs.HLI) && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800/50 text-purple-300 text-[10px]">
                                    HLI:{comp.ioSpecs.HLI}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            {comp.ioSpecs?.isAutoCalc && comp.ioSpecs?.ioFactors ? (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[10px] flex items-center gap-0.5 font-semibold">
                                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                                  Auto-Calc
                                </span>
                                <span className="text-[10px] text-amber-200/70 font-mono">
                                  {Object.entries(comp.ioSpecs.ioFactors as Record<string, number>)
                                    .filter(([_, factor]) => Number(factor) > 0)
                                    .map(([type, factor]) => `${factor}×${type}`)
                                    .join(" + ") || "Formula"}
                                </span>
                              </div>
                            ) : null}

                            {!hasIO && !comp.ioSpecs?.isAutoCalc && (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            RM {formatNumber(comp.listPrice)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(comp)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(comp.id, comp.model)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredComponents.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500">
                          No matching components found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* PACKAGES TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Standard automation kits for 1-click insertion into project BOMs
                </span>
                <button
                  onClick={() => {
                    setEditingPkgId(null);
                    setPkgName("");
                    setPkgDesc("");
                    setPkgItems([]);
                    setShowAddPkg(!showAddPkg);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddPkg ? "Close Package Editor" : "Create Package"}</span>
                </button>
              </div>

              {/* Package Add / Edit Form */}
              {showAddPkg && (
                <form
                  onSubmit={handleSavePackage}
                  className="p-5 rounded-2xl bg-slate-900 border border-indigo-700/60 shadow-xl space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {editingPkgId ? "Edit 1-Click Package" : "Create 1-Click Package"}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Bundle multiple components together for fast 1-click addition to project BOMs
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPkg(false);
                        setEditingPkgId(null);
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left Side: Package details and selected contents */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Package Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. S7-1200 Compact Automation Starter Kit"
                          value={pkgName}
                          onChange={(e) => setPkgName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Description
                        </label>
                        <textarea
                          placeholder="e.g. Standard control kit includes PLC, 7-inch touch panel, power supply, and Ethernet switch"
                          value={pkgDesc}
                          onChange={(e) => setPkgDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white h-20 resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Package Contents ({pkgItems.length} items)
                          </label>
                          {pkgItems.length > 0 && (
                            <span className="text-xs font-mono font-bold text-cyan-300">
                              Total: RM{" "}
                              {formatNumber(
                                pkgItems.reduce(
                                  (acc, i) => acc + (i.catalog?.listPrice || 0) * i.quantity,
                                  0
                                )
                              )}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {pkgItems.map((item) => (
                            <div
                              key={item.catalogId}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-white font-mono truncate">
                                  {item.catalog?.model}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  [{item.catalog?.brand}] {item.catalog?.description}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => updatePkgItemQty(item.catalogId, item.quantity - 1)}
                                    className="px-2 py-0.5 text-slate-400 hover:text-white font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-7 text-center font-mono font-bold text-white text-xs">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updatePkgItemQty(item.catalogId, item.quantity + 1)}
                                    className="px-2 py-0.5 text-slate-400 hover:text-white font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePkgItem(item.catalogId)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {pkgItems.length === 0 && (
                            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                              No components in this package yet. Pick items from the right panel!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Component Selector */}
                    <div className="space-y-3 flex flex-col">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Select Components to Add
                        </label>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search by model, brand, or description..."
                            value={pkgSearchTerm}
                            onChange={(e) => setPkgSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex-1 max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                        {components
                          .filter(
                            (c) =>
                              c.model.toLowerCase().includes(pkgSearchTerm.toLowerCase()) ||
                              c.brand.toLowerCase().includes(pkgSearchTerm.toLowerCase()) ||
                              c.description.toLowerCase().includes(pkgSearchTerm.toLowerCase())
                          )
                          .map((comp) => (
                            <div
                              key={comp.id}
                              onClick={() => addComponentToPkg(comp)}
                              className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-600/50 flex items-center justify-between gap-2 cursor-pointer transition text-xs"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white font-mono truncate">
                                  {comp.model}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  [{comp.brand}] {comp.description}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-cyan-400">
                                  RM {formatNumber(comp.listPrice)}
                                </span>
                                <Plus className="w-4 h-4 text-indigo-400" />
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPkg(false);
                            setEditingPkgId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={pkgItems.length === 0}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          {editingPkgId ? "Update Package" : "Save Package"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Package Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => {
                  const pkgTotal = pkg.items.reduce(
                    (acc, item) => acc + (item.catalog?.listPrice || 0) * item.quantity,
                    0
                  );

                  return (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow group hover:border-indigo-800/60 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                            <Boxes className="w-4 h-4" />
                          </div>
                          <div className="font-bold text-sm text-cyan-300">{pkg.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">
                            RM {formatNumber(pkgTotal)}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleStartEditPkg(pkg)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title="Edit package"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePkg(pkg.id, pkg.name)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition cursor-pointer"
                              title="Delete package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {pkg.description && (
                        <p className="text-xs text-slate-400">{pkg.description}</p>
                      )}

                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs font-mono">
                        {pkg.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300">
                            <span>
                              {item.quantity}x [{item.catalog?.brand}] {item.catalog?.model}
                            </span>
                            <span className="text-slate-500">
                              RM {formatNumber((item.catalog?.listPrice || 0) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {packages.length === 0 && !loading && (
                  <div className="col-span-2 py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No 1-click packages created yet. Click &quot;Create Package&quot; to build a hardware bundle!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span>All hardware prices quoted in Malaysian Ringgit (RM)</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

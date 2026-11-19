"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Table as TableIcon,
  Plus,
  Search,
  Filter,
  FolderSync,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Cpu,
  RefreshCw,
  Building2,
  Briefcase,
  Cloud,
  ShieldCheck,
  Users,
  LogOut,
  Package,
} from "lucide-react";
import { Enquiry, Client, EnquiryStatus } from "@/types";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TableView } from "@/components/TableView";
import { NewEnquiryModal } from "@/components/NewEnquiryModal";
import { EnquiryDetailModal } from "@/components/EnquiryDetailModal";
import { ClientsDirectory } from "@/components/ClientsDirectory";
import { OneDriveSetupModal } from "@/components/OneDriveSetupModal";
import UserManagementModal from "@/components/UserManagementModal";
import HardwareCatalogModal from "@/components/costing/HardwareCatalogModal";
import { formatNumber } from "@/lib/format";

export default function WorkHubDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"enquiries" | "clients">("enquiries");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    name: string;
    role: string;
  } | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isOneDriveModalOpen, setIsOneDriveModalOpen] = useState(false);
  const [oneDriveStatus, setOneDriveStatus] = useState<{
    connected: boolean;
    accountEmail: string | null;
    accountName: string | null;
  }>({
    connected: false,
    accountEmail: null,
    accountName: null,
  });

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.data);
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/enquiries?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
        if (selectedEnquiry) {
          const updated = data.data.find((e: Enquiry) => e.id === selectedEnquiry.id);
          if (updated) setSelectedEnquiry(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

  const fetchOneDriveStatus = async () => {
    try {
      const res = await fetch("/api/onedrive/status");
      const data = await res.json();
      if (data.success) {
        setOneDriveStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to check OneDrive status:", err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchClients();
    fetchOneDriveStatus();
  }, [statusFilter]);

  const handleRefreshAll = () => {
    fetchEnquiries();
    fetchClients();
    fetchOneDriveStatus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnquiries();
  };

  // Stats calculation
  const totalEnquiries = enquiries.length;
  const inCostingCount = enquiries.filter(
    (e) => e.status === "CONCEPT_DESIGN" || e.status === "COSTING"
  ).length;
  const quotedValue = enquiries
    .filter((e) => e.status === "QUOTED" || e.status === "WON")
    .reduce((acc, curr) => acc + (curr.estimatedBudget || 0), 0);
  const totalTodos = enquiries.reduce(
    (acc, curr) => acc + curr.todos.filter((t) => !t.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="w-full max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Section Tabs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight">WorkHub</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    Daily Ops
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Engineering Projects • Revisions • OneDrive
                </p>
              </div>
            </div>

            {/* Navigation Switcher: Enquiries vs Clients */}
            <nav className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
              <button
                onClick={() => setActiveSection("enquiries")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSection === "enquiries"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Enquiries</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {enquiries.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSection("clients")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSection === "clients"
                    ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Clients Directory</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  {clients.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5">
            {activeSection === "enquiries" && (
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pipeline</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === "table"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            )}

            {/* OneDrive Status & Connect Button */}
            <button
              onClick={() => setIsOneDriveModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-xs ${
                oneDriveStatus.connected
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  : "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-zinc-700"
              }`}
              title={oneDriveStatus.connected ? `OneDrive Connected: ${oneDriveStatus.accountEmail}` : "Configure OneDrive Integration"}
            >
              {oneDriveStatus.connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline truncate max-w-[130px]">
                    {oneDriveStatus.accountName || "OneDrive Connected"}
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Connect OneDrive</span>
                </>
              )}
            </button>

            <button
              onClick={handleRefreshAll}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Hardware Catalog button */}
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition shadow-xs cursor-pointer"
              title="Browse PLC models, HMIs, and Hardware Packages"
            >
              <Package className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden lg:inline">Catalog</span>
            </button>

            {/* New Enquiry button */}
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Enquiry</span>
            </button>

            {/* User Session & P&C Security Control */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                {currentUser.role === "ADMIN" && (
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition cursor-pointer"
                    title="Manage Users & Access Roles"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden md:inline">Users</span>
                  </button>
                )}

                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60"
                  title={`Logged in as ${currentUser.name} (@${currentUser.username})`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono leading-none">
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                  title="Sign Out / Lock Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeSection === "enquiries" ? (
          <>
            {/* Metric Cards Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Total Enquiries
                  </span>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {totalEnquiries}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    In Design / Costing
                  </span>
                  <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                    {inCostingCount}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Quoted Pipeline
                  </span>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    RM {formatNumber(quotedValue)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Pending Tasks
                  </span>
                  <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                    {totalTodos}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search enquiries by code, client, or requirement keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">New Enquiry</option>
                  <option value="CONCEPT_DESIGN">Concept Design</option>
                  <option value="COSTING">Costing & BOM</option>
                  <option value="QUOTED">Quoted</option>
                  <option value="WON">Won / Confirmed</option>
                  <option value="LOST">Lost / Closed</option>
                </select>
              </div>
            </div>

            {/* Dashboard View (Kanban or Table) */}
            {loading && enquiries.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading enquiries and OneDrive mappings...</span>
              </div>
            ) : viewMode === "kanban" ? (
              <KanbanBoard
                enquiries={enquiries}
                onSelectEnquiry={(enq) => setSelectedEnquiry(enq)}
                onUpdateStatus={async (enquiryId, newStatus) => {
                  await fetch(`/api/enquiries/${enquiryId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                  });
                  fetchEnquiries();
                }}
              />
            ) : (
              <TableView
                enquiries={enquiries}
                onSelectEnquiry={(enq) => setSelectedEnquiry(enq)}
              />
            )}
          </>
        ) : (
          /* Clients Module Section */
          <ClientsDirectory
            clients={clients}
            onRefresh={handleRefreshAll}
            onSelectEnquiry={(enq) => {
              // Switch to enquiries section and open the enquiry
              setActiveSection("enquiries");
              setSelectedEnquiry(enq);
            }}
          />
        )}
      </main>

      {/* New Enquiry Modal */}
      <NewEnquiryModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => {
          fetchEnquiries();
          fetchClients();
        }}
        existingCount={enquiries.length}
      />

      {/* Detailed Enquiry Hub Modal */}
      <EnquiryDetailModal
        enquiry={selectedEnquiry}
        isOpen={Boolean(selectedEnquiry)}
        onClose={() => setSelectedEnquiry(null)}
        onRefresh={() => {
          fetchEnquiries();
          fetchClients();
        }}
      />

      {/* OneDrive Setup & Settings Modal */}
      <OneDriveSetupModal
        isOpen={isOneDriveModalOpen}
        onClose={() => setIsOneDriveModalOpen(false)}
        onStatusChanged={fetchOneDriveStatus}
      />

      {/* User Management & Access Control Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Hardware & Components Master Catalog Modal */}
      <HardwareCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}

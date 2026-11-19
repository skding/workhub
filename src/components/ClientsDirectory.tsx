"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Layers,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  User,
  Pencil,
} from "lucide-react";
import { Client } from "@/types";
import { NewClientModal } from "./NewClientModal";
import { ClientDetailModal } from "./ClientDetailModal";
import { formatNumber } from "@/lib/format";

interface ClientsDirectoryProps {
  clients: Client[];
  onRefresh: () => void;
  onSelectEnquiry?: (enquiry: any) => void;
}

export function ClientsDirectory({
  clients,
  onRefresh,
  onSelectEnquiry,
}: ClientsDirectoryProps) {
  const [search, setSearch] = useState("");
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      (c.clientCode && c.clientCode.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  });

  // Calculate high-level statistics across all clients
  const totalClients = clients.length;
  const totalClientEnquiries = clients.reduce(
    (acc, c) => acc + (c._count?.enquiries || c.enquiries?.length || 0),
    0
  );
  const totalWonProjects = clients.reduce((acc, c) => {
    const wonCount = c.enquiries?.filter((e) => e.status === "WON").length || 0;
    return acc + wonCount;
  }, 0);
  const totalPipelineValue = clients.reduce((acc, c) => {
    const val =
      c.enquiries
        ?.filter((e) => e.status === "QUOTED" || e.status === "WON")
        .reduce((sum, e) => sum + (e.estimatedBudget || 0), 0) || 0;
    return acc + val;
  }, 0);

  const handleOpenClient = (client: Client, edit = false) => {
    setSelectedClient(client);
    setOpenInEditMode(edit);
  };

  return (
    <div className="space-y-6">
      {/* Client Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Clients
            </span>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {totalClients}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Enquiries
            </span>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {totalClientEnquiries}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Won Projects
            </span>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalWonProjects}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Pipeline Value
            </span>
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              RM {formatNumber(totalPipelineValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search clients by company name, contact person, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={() => setIsNewClientModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Client</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          No clients found. Click &quot;New Client&quot; to register your first client.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const enqCount = client._count?.enquiries || client.enquiries?.length || 0;
            const wonCount =
              client.enquiries?.filter((e) => e.status === "WON").length || 0;

            return (
              <div
                key={client.id}
                onClick={() => handleOpenClient(client, false)}
                className="group p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-500 dark:hover:border-purple-500 transition shadow-xs cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="truncate min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {client.companyName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client.clientCode && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {client.clientCode}
                            </span>
                          )}
                          {client.industry && (
                            <span className="text-[11px] text-zinc-400 truncate">
                              {client.industry}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Edit Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenClient(client, true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition shrink-0"
                      title="Edit Client Details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-zinc-500">
                    {client.contactPerson && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{client.contactPerson}</span>
                      </div>
                    )}
                    {client.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          {client.contactPhone}
                        </span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Stats Footer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500">
                      <strong>{enqCount}</strong> enquiries
                    </span>
                    {wonCount > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        • {wonCount} won
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold group-hover:underline">
                    <span>View Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onCreated={() => onRefresh()}
      />

      {/* Client Detail Modal (with Edit Mode support) */}
      <ClientDetailModal
        client={selectedClient}
        isOpen={Boolean(selectedClient)}
        initialEditMode={openInEditMode}
        onClose={() => {
          setSelectedClient(null);
          setOpenInEditMode(false);
        }}
        onRefresh={() => onRefresh()}
        onSelectEnquiry={onSelectEnquiry}
      />
    </div>
  );
}

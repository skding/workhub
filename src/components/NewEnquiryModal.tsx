"use client";

import React, { useState, useEffect } from "react";
import { X, FolderPlus, Sparkles, MessageSquare, AlertCircle, Building2, Plus } from "lucide-react";
import { Client } from "@/types";
import { NewClientModal } from "./NewClientModal";

interface NewEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  existingCount: number;
}

export function NewEnquiryModal({
  isOpen,
  onClose,
  onCreated,
  existingCount,
}: NewEnquiryModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    clientName: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    priority: "MEDIUM",
    status: "NEW",
    estimatedBudget: "",
    targetDate: "",
    summary: "",
    initialNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setClients(data.data);
        })
        .catch((err) => console.error("Failed to load clients:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time standardized folder preview
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const nextSeq = String(existingCount + 1).padStart(3, "0");
  const cleanClient = formData.clientName.replace(/[^a-zA-Z0-9]/g, "") || "Client";
  const cleanTitle = formData.title.replace(/[^a-zA-Z0-9]/g, "") || "Project";
  const previewFolder = `${yearMonth}-${nextSeq}_${cleanClient}_${cleanTitle}`;

  // When user selects a client from dropdown, autofill contact info
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setFormData((prev) => ({
        ...prev,
        clientId: "",
        clientName: "",
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
      }));
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientId: client.id,
        clientName: client.companyName,
        contactPerson: client.contactPerson || "",
        contactPhone: client.contactPhone || "",
        contactEmail: client.contactEmail || "",
      }));
    }
  };

  const handleQuickClientCreated = (newClient?: Client) => {
    if (newClient) {
      setClients((prev) => [newClient, ...prev]);
      handleClientSelect(newClient.id);
    }
    setIsQuickClientOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.clientName.trim()) {
      setError("Please provide both Project Title and Client Name");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create enquiry");
      }

      onCreated();
      onClose();
      // Reset form
      setFormData({
        title: "",
        clientId: "",
        clientName: "",
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
        priority: "MEDIUM",
        status: "NEW",
        estimatedBudget: "",
        targetDate: "",
        summary: "",
        initialNote: "",
      });
      setSelectedClientId("");
    } catch (err: any) {
      setError(err.message || "Failed to create enquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  New Project Enquiry
                </h2>
                <p className="text-xs text-zinc-500">
                  Auto-generates standardized ID & OneDrive folder
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Standardized Folder Pill */}
          <div className="mx-6 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Target OneDrive Folder:
              </span>{" "}
              <code className="text-blue-600 dark:text-blue-400 font-mono">
                /WorkHub/{yearMonth}/{previewFolder}
              </code>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Project Title / Brief <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Carton Stacking & Conveyor"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Client Selection (Dropdown + Quick Add) */}
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase text-zinc-500">
                    Select Registered Client <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(true)}
                    className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + New Client
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.clientCode ? `(${c.clientCode})` : ""}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Or type Client Name directly..."
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value, clientId: "" });
                      setSelectedClientId("");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. David Tan"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +60 12-345 6789"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. david@acme.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Estimated Budget (RM)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60000"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Target Quotation Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Initial Pipeline Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NEW">New Enquiry</option>
                  <option value="CONCEPT_DESIGN">Concept Design</option>
                  <option value="COSTING">Costing & BOM</option>
                  <option value="QUOTED">Quoted</option>
                </select>
              </div>
            </div>

            {/* Quick WhatsApp / Client Message Field */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                Quick WhatsApp Message / Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Paste WhatsApp message, initial phone call details, or client requirement specs here..."
                value={formData.initialNote}
                onChange={(e) => setFormData({ ...formData, initialNote: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
              >
                {loading ? "Creating..." : "Create Enquiry & Setup Folder"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modal: Quick Add Client */}
      <NewClientModal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        onCreated={handleQuickClientCreated}
      />
    </>
  );
}

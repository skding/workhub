"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  History,
  Pencil,
  Save,
  Trash2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Client, Enquiry } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatNumber, formatDate } from "@/lib/format";

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onSelectEnquiry?: (enquiry: any) => void;
  initialEditMode?: boolean;
}

export function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onRefresh,
  onSelectEnquiry,
  initialEditMode = false,
}: ClientDetailModalProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    clientCode: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    industry: "",
    address: "",
    notes: "",
  });

  // Keep form data synced with selected client
  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName || "",
        clientCode: client.clientCode || "",
        contactPerson: client.contactPerson || "",
        contactPhone: client.contactPhone || "",
        contactEmail: client.contactEmail || "",
        industry: client.industry || "",
        address: client.address || "",
        notes: client.notes || "",
      });
      setIsEditing(initialEditMode);
      setError("");
      setSuccessMsg("");
    }
  }, [client, initialEditMode]);

  if (!isOpen || !client) return null;

  const enquiries = client.enquiries || [];
  const wonEnquiries = enquiries.filter((e) => e.status === "WON");
  const quotedOrWonEnquiries = enquiries.filter(
    (e) => e.status === "QUOTED" || e.status === "WON"
  );
  const totalQuotedValue = quotedOrWonEnquiries.reduce(
    (sum, e) => sum + (e.estimatedBudget || 0),
    0
  );
  const totalWonValue = wonEnquiries.reduce(
    (sum, e) => sum + (e.estimatedBudget || 0),
    0
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.companyName.trim()) {
      setError("Company Name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update client");
      }

      setSuccessMsg("Client details updated successfully!");
      setIsEditing(false);
      onRefresh?.();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (enquiries.length > 0) {
      alert(`Cannot delete this client because they have ${enquiries.length} linked enquiries. Please reassign or delete the enquiries first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${client.companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete client");
      }

      onRefresh?.();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to delete client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {client.companyName}
                  </h2>
                  {client.clientCode && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                      {client.clientCode}
                    </span>
                  )}
                </div>
                {client.industry && (
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Sector: {client.industry}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Edit Details</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel Edit
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Contact Chips in View Mode */}
          {!isEditing && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
              {client.contactPerson && (
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  Contact: <strong className="text-zinc-800 dark:text-zinc-200">{client.contactPerson}</strong>
                </span>
              )}
              {client.contactPhone && (
                <a
                  href={`https://wa.me/${client.contactPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp: {client.contactPhone}</span>
                </a>
              )}
              {client.contactEmail && (
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{client.contactEmail}</span>
                </span>
              )}
              {client.address && (
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-xs">{client.address}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* EDIT FORM (Visible when isEditing === true) */}
        {isEditing ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Client Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CL-MFP"
                  value={formData.clientCode}
                  onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food & Beverage, Semiconductor"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Office / Factory Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Client Background & Technical Standards
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Edit Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Client</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* VIEW MODE */
          <>
            {/* Client Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Total Enquiries
                </span>
                <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  {enquiries.length}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Won Projects
                </span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {wonEnquiries.length}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Total Quoted Value
                </span>
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  RM {formatNumber(totalQuotedValue)}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Total Won Revenue
                </span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  RM {formatNumber(totalWonValue)}
                </span>
              </div>
            </div>

            {/* Client History & Notes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {client.notes && (
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                  <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-300">
                    Client Notes & Standards
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}

              {/* Enquiries History Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Project Enquiries History ({enquiries.length})
                  </h3>
                </div>

                {enquiries.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-400">
                    No project enquiries logged for this client yet.
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Project Title</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Budget</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {enquiries.map((enq) => (
                          <tr
                            key={enq.id}
                            className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {enq.code}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                              {enq.title}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={enq.status} />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                              {enq.estimatedBudget ? `RM ${formatNumber(enq.estimatedBudget)}` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400">
                              {formatDate(enq.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  onClose();
                                  onSelectEnquiry?.(enq);
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                View
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

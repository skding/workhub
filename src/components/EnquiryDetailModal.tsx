"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Folder,
  Copy,
  Check,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  User,
  MessageSquare,
  FileText,
  History,
  CheckSquare,
  Cpu,
  Plus,
  ExternalLink,
  Image as ImageIcon,
  FileCode,
  Tag,
  Clock,
  Send,
  UploadCloud,
  ChevronRight,
  Layers,
  Cloud,
  RefreshCw,
} from "lucide-react";
import { Enquiry, EnquiryStatus, NoteType, FileCategory } from "@/types";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge, STATUS_CONFIG } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { ImageViewerModal } from "./ImageViewerModal";
import ProjectCostingEditor from "./costing/ProjectCostingEditor";
import HardwareCatalogModal from "./costing/HardwareCatalogModal";

interface EnquiryDetailModalProps {
  enquiry: Enquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function EnquiryDetailModal({
  enquiry,
  isOpen,
  onClose,
  onRefresh,
}: EnquiryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "notes" | "files" | "revisions" | "todos" | "costing_plc"
  >("notes");

  // Local inputs
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<NoteType>("WHATSAPP");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // New Revision input
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [revCode, setRevCode] = useState("");
  const [revSummary, setRevSummary] = useState("");
  const [revAmount, setRevAmount] = useState("");
  const [isSubmittingRev, setIsSubmittingRev] = useState(false);

  // New Todo input
  const [newTodoTask, setNewTodoTask] = useState("");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");

  // Quick file adder
  const [newFileName, setNewFileName] = useState("");
  const [newFileCategory, setNewFileCategory] = useState<FileCategory>("INPUT");
  const [newFileType, setNewFileType] = useState<"image" | "pdf" | "cad" | "excel">("image");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [showAddFile, setShowAddFile] = useState(false);

  // In-app Lightbox Preview
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Status updating
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedFolder, setCopiedFolder] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // OneDrive Live Sync state
  const [isSyncingOneDrive, setIsSyncingOneDrive] = useState(false);
  const [isUploadingOneDrive, setIsUploadingOneDrive] = useState(false);
  const [uploadTargetCategory, setUploadTargetCategory] = useState<FileCategory>("INPUT");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !enquiry) return null;

  const handleSyncOneDrive = async () => {
    try {
      setIsSyncingOneDrive(true);
      const res = await fetch(`/api/enquiries/${enquiry.id}/onedrive`);
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error("OneDrive sync error:", err);
    } finally {
      setIsSyncingOneDrive(false);
    }
  };

  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingOneDrive(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", uploadTargetCategory);

      const res = await fetch(`/api/enquiries/${enquiry.id}/onedrive/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setIsUploadingOneDrive(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyFolderPath = () => {
    navigator.clipboard.writeText(enquiry.folderName);
    setCopiedFolder(true);
    setTimeout(() => setCopiedFolder(false), 2000);
  };

  const handleStatusChange = async (newStatus: EnquiryStatus) => {
    try {
      setIsUpdatingStatus(true);
      await fetch(`/api/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await fetch(`/api/enquiries/${enquiry.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteContent,
          type: newNoteType,
        }),
      });
      if (res.ok) {
        setNewNoteContent("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAddRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revCode.trim() || !revSummary.trim()) return;

    try {
      setIsSubmittingRev(true);
      const res = await fetch(`/api/enquiries/${enquiry.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revCode,
          summary: revSummary,
          totalAmount: revAmount ? parseFloat(revAmount) : null,
          type: "COSTING",
        }),
      });
      if (res.ok) {
        setRevCode("");
        setRevSummary("");
        setRevAmount("");
        setShowAddRevision(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRev(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTask.trim()) return;

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: newTodoTask,
          dueDate: newTodoDueDate || null,
        }),
      });
      if (res.ok) {
        setNewTodoTask("");
        setNewTodoDueDate("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTodo = async (todoId: string, currentCompleted: boolean) => {
    try {
      await fetch(`/api/enquiries/${enquiry.id}/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFileRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: newFileName.trim(),
          fileCategory: newFileCategory,
          fileType: newFileType,
          fileUrl: newFileUrl || (newFileType === "image" ? "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800" : null),
        }),
      });
      if (res.ok) {
        setNewFileName("");
        setNewFileUrl("");
        setShowAddFile(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group files by folder category
  const clientInputFiles = enquiry.files.filter((f) => f.category === "INPUT");
  const designFiles = enquiry.files.filter((f) => f.category === "DESIGN");
  const costingFiles = enquiry.files.filter((f) => f.category === "COSTING");

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {enquiry.code}
                  </span>
                  <StatusBadge status={enquiry.status} />
                  <PriorityBadge priority={enquiry.priority} />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {enquiry.title}
                </h1>
                <p className="text-xs text-zinc-500 font-medium">
                  Client: <strong className="text-zinc-700 dark:text-zinc-300">{enquiry.clientName}</strong>
                  {enquiry.contactPerson && ` • Contact: ${enquiry.contactPerson}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Pipeline Status Selector */}
                <select
                  disabled={isUpdatingStatus}
                  value={enquiry.status}
                  onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Standardized OneDrive Folder Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 text-xs">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 truncate">
                <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-200 shrink-0">
                  OneDrive Folder:
                </span>
                <code className="text-blue-600 dark:text-blue-400 font-mono truncate">
                  {enquiry.folderName}
                </code>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {enquiry.oneDriveWebUrl && (
                  <a
                    href={enquiry.oneDriveWebUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold transition flex items-center gap-1.5"
                    title="Open Folder in OneDrive"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in OneDrive</span>
                  </a>
                )}
                <button
                  onClick={copyFolderPath}
                  className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-medium transition flex items-center gap-1.5"
                  title="Copy standardized folder name"
                >
                  {copiedFolder ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Name</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                  Ready for OneDrive Sync
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Est. Budget
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {enquiry.estimatedBudget ? `RM ${formatNumber(enquiry.estimatedBudget)}` : "Not Set"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Target Quote Date
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {enquiry.targetDate ? formatDate(enquiry.targetDate) : "No deadline"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500" />
              <div className="truncate">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  WhatsApp / Phone
                </span>
                {enquiry.contactPhone ? (
                  <a
                    href={`https://wa.me/${enquiry.contactPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline truncate block"
                  >
                    {enquiry.contactPhone}
                  </a>
                ) : (
                  <span className="text-zinc-400">None</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Latest Revision
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {enquiry.revisions.length > 0
                    ? enquiry.revisions[0].revCode
                    : "Initial Draft"}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 gap-2 overflow-x-auto bg-white dark:bg-zinc-900 shrink-0">
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === "notes"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Notes & WhatsApp Log ({enquiry.notes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === "files"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Files & In-App Previews ({enquiry.files.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("revisions")}
              className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === "revisions"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Costing & Design Revisions ({enquiry.revisions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("todos")}
              className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === "todos"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Action Items / To-Do ({enquiry.todos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("costing_plc")}
              className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === "costing_plc"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-500" />
              <span>PLC Costing Engine</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* TAB 1: NOTES & WHATSAPP LOG */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                {/* Note composer */}
                <form
                  onSubmit={handleAddNote}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      Quick Capture (WhatsApp / Meeting / Call Note)
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(["WHATSAPP", "CALL", "REQUIREMENT", "GENERAL"] as NoteType[]).map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewNoteType(type)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                              newNoteType === type
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                            }`}
                          >
                            {type}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Paste WhatsApp text messages, phone conversation takeaways, or client ideas here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNoteContent.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmittingNote ? "Saving..." : "Save Note"}
                    </button>
                  </div>
                </form>

                {/* Notes Stream */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
                    Timeline History ({enquiry.notes.length})
                  </h3>

                  {enquiry.notes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs">
                      No notes recorded yet. Paste your first WhatsApp message or meeting note above!
                    </div>
                  ) : (
                    enquiry.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                              note.type === "WHATSAPP"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : note.type === "CALL"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {note.type}
                          </span>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FILES & PREVIEWS (ONEDRIVE) */}
            {activeTab === "files" && (
              <div className="space-y-6">
                {/* Hidden file input for OneDrive upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50">
                  <div className="text-xs text-blue-900 dark:text-blue-300">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      OneDrive Cloud Folders &amp; Live Sync
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 text-[11px] mt-0.5">
                      Drop files into this folder on your PC/phone or upload directly below.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSyncOneDrive}
                      disabled={isSyncingOneDrive}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1.5 shadow-xs"
                      title="Check OneDrive for newly added files"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingOneDrive ? "animate-spin" : ""}`} />
                      <span>{isSyncingOneDrive ? "Syncing..." : "Sync with OneDrive"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setUploadTargetCategory("INPUT");
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploadingOneDrive}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
                      title="Upload file directly into this OneDrive project folder"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadingOneDrive ? "Uploading..." : "Upload to OneDrive"}</span>
                    </button>

                    <button
                      onClick={() => setShowAddFile(!showAddFile)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add File Record</span>
                    </button>
                  </div>
                </div>

                {/* Add File Form */}
                {showAddFile && (
                  <form
                    onSubmit={handleAddFileRecord}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 space-y-3"
                  >
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Record File into Enquiry Folder
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                          File Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Conveyor_Photo_WhatsApp.jpg"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                          Sub-Folder Category
                        </label>
                        <select
                          value={newFileCategory}
                          onChange={(e) => setNewFileCategory(e.target.value as FileCategory)}
                          className="w-full px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs"
                        >
                          <option value="INPUT">01_Client_Inputs</option>
                          <option value="DESIGN">02_Design_Concepts</option>
                          <option value="COSTING">03_Costing_Revisions</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                          Type
                        </label>
                        <select
                          value={newFileType}
                          onChange={(e) => setNewFileType(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs"
                        >
                          <option value="image">Image (JPG/PNG)</option>
                          <option value="pdf">PDF Document</option>
                          <option value="cad">CAD / STEP / DWG</option>
                          <option value="excel">Excel / BOM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                        Optional Image URL / File Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://... (or leave blank to use sample photo)"
                        value={newFileUrl}
                        onChange={(e) => setNewFileUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFile(false)}
                        className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                      >
                        Add to Folder
                      </button>
                    </div>
                  </form>
                )}

                {/* Folder Sections */}
                {[
                  {
                    title: "01_Client_Inputs (WhatsApp photos, RFQ, Layouts)",
                    files: clientInputFiles,
                    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                  },
                  {
                    title: "02_Design_Concepts (Sketches, Preliminary 2D/3D)",
                    files: designFiles,
                    badge: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
                  },
                  {
                    title: "03_Costing_Revisions (BOMs, Quotations, Spreadsheets)",
                    files: costingFiles,
                    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                  },
                ].map((folder, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {folder.title}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${folder.badge}`}>
                        {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {folder.files.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 text-xs">
                        Folder is currently empty
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {folder.files.map((file) => (
                          <div
                            key={file.id}
                            className="group p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-xs flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-2.5">
                              {file.fileType === "image" ? (
                                <div
                                  onClick={() =>
                                    file.fileUrl &&
                                    setPreviewImage({
                                      url: file.fileUrl,
                                      title: file.fileName,
                                    })
                                  }
                                  className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 overflow-hidden shrink-0 cursor-pointer relative group-hover:ring-2 group-hover:ring-blue-500"
                                >
                                  {file.fileUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={file.fileUrl}
                                      alt={file.fileName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                      <ImageIcon className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                                  {file.fileType === "pdf" ? (
                                    <FileText className="w-5 h-5 text-rose-500" />
                                  ) : file.fileType === "cad" ? (
                                    <Layers className="w-5 h-5 text-indigo-500" />
                                  ) : (
                                    <FileCode className="w-5 h-5 text-emerald-500" />
                                  )}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {file.fileName}
                                </p>
                                <span className="text-[10px] text-zinc-400 uppercase">
                                  {file.source} • {file.fileType}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                              {file.fileType === "image" && file.fileUrl ? (
                                <button
                                  onClick={() =>
                                    setPreviewImage({
                                      url: file.fileUrl!,
                                      title: file.fileName,
                                    })
                                  }
                                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  Preview in App
                                </button>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">
                                  {file.fileSize
                                    ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB`
                                    : "Document"}
                                </span>
                              )}

                              {file.fileUrl && (
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                  title="Open in new window"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: REVISIONS */}
            {activeTab === "revisions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Design & Costing Revision History
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Track design changes, added sensors, PLC upgrades, and price variations over time.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddRevision(!showAddRevision)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Revision (Rev)
                  </button>
                </div>

                {/* Add Revision Form */}
                {showAddRevision && (
                  <form
                    onSubmit={handleAddRevision}
                    className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3"
                  >
                    <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                      Record New Revision
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                          Revision Code (e.g. Rev A, Rev B, Rev 1.1)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Rev C"
                          value={revCode}
                          onChange={(e) => setRevCode(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                          New Quotation / Cost Total (RM)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 78500"
                          value={revAmount}
                          onChange={(e) => setRevAmount(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                        Revision Summary / What Changed? <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. Switched to Siemens S7-1500 for safety interlock compliance, added 2 proximity sensors and upgraded motor to 1.5kW."
                        value={revSummary}
                        onChange={(e) => setRevSummary(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRevision(false)}
                        className="px-3 py-1 text-xs text-zinc-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingRev}
                        className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white"
                      >
                        {isSubmittingRev ? "Saving..." : "Save Revision"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Revision Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                  {enquiry.revisions.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs">
                      No revisions saved yet. Add your initial Rev A above.
                    </div>
                  ) : (
                    enquiry.revisions.map((rev, index) => (
                      <div key={rev.id} className="relative group">
                        {/* Dot */}
                        <div
                          className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                            index === 0 ? "bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-900" : "bg-zinc-400"
                          }`}
                        />

                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 shadow-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                {rev.revCode}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Latest
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              {rev.totalAmount !== null && (
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                  RM {formatNumber(rev.totalAmount)}
                                </span>
                              )}
                              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(rev.createdAt)}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {rev.summary}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ACTION ITEMS / TODO */}
            {activeTab === "todos" && (
              <div className="space-y-4">
                {/* Add task */}
                <form
                  onSubmit={handleAddTodo}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <input
                    type="text"
                    required
                    placeholder="New action item (e.g. Request sensor quotation from Omron rep)..."
                    value={newTodoTask}
                    onChange={(e) => setNewTodoTask(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={newTodoDueDate}
                    onChange={(e) => setNewTodoDueDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Add Task
                  </button>
                </form>

                <div className="space-y-2">
                  {enquiry.todos.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs">
                      No pending action items for this enquiry.
                    </div>
                  ) : (
                    enquiry.todos.map((todo) => (
                      <div
                        key={todo.id}
                        onClick={() => handleToggleTodo(todo.id, todo.completed)}
                        className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          todo.completed
                            ? "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              todo.completed
                                ? "line-through text-zinc-400"
                                : "text-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {todo.task}
                          </span>
                        </div>

                        {todo.dueDate && (
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            {formatDate(todo.dueDate)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: PLC COSTING & BOM ENGINE */}
            {activeTab === "costing_plc" && (
              <div className="space-y-4">
                <ProjectCostingEditor
                  enquiryId={enquiry.id}
                  onRevisionSaved={onRefresh}
                  onOpenCatalog={() => setIsCatalogOpen(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-app Image Lightbox Viewer */}
      <ImageViewerModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ""}
        imageTitle={previewImage?.title || ""}
      />

      {/* Hardware & Components Master Catalog Modal */}
      <HardwareCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </>
  );
}

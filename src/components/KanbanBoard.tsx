"use client";

import React from "react";
import { Enquiry, EnquiryStatus } from "@/types";
import { STATUS_CONFIG } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { formatDate, formatNumber } from "@/lib/format";
import {
  MessageSquare,
  FileText,
  History,
  CheckSquare,
  Folder,
  Calendar,
  DollarSign,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

interface KanbanBoardProps {
  enquiries: Enquiry[];
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onUpdateStatus: (enquiryId: string, status: EnquiryStatus) => void;
}

const COLUMNS: { id: EnquiryStatus; label: string; headerBg: string }[] = [
  { id: "NEW", label: "New Enquiry", headerBg: "border-blue-500" },
  { id: "CONCEPT_DESIGN", label: "Concept Design", headerBg: "border-purple-500" },
  { id: "COSTING", label: "Costing & BOM", headerBg: "border-amber-500" },
  { id: "QUOTED", label: "Quoted", headerBg: "border-indigo-500" },
  { id: "WON", label: "Won / Confirmed", headerBg: "border-emerald-500" },
];

export function KanbanBoard({
  enquiries,
  onSelectEnquiry,
  onUpdateStatus,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 w-full items-start">
      {COLUMNS.map((col) => {
        const columnEnquiries = enquiries.filter((e) => e.status === col.id);

        return (
          <div
            key={col.id}
            className="flex-1 min-w-[320px] flex flex-col bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 mb-2 border-t-2 ${col.headerBg} pt-2`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {columnEnquiries.length}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
              {columnEnquiries.length === 0 ? (
                <div className="h-28 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-xl text-[11px] text-zinc-400">
                  No enquiries
                </div>
              ) : (
                columnEnquiries.map((enq) => {
                  const hasImage = enq.files.some((f) => f.fileType === "image");
                  const latestRev = enq.revisions[0];

                  return (
                    <div
                      key={enq.id}
                      onClick={() => onSelectEnquiry(enq)}
                      className="group p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/90 hover:border-blue-500 dark:hover:border-blue-500 transition shadow-xs cursor-pointer space-y-2.5"
                    >
                      {/* Top Code & Priority */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          {enq.code}
                        </span>
                        <PriorityBadge priority={enq.priority} />
                      </div>

                      {/* Title & Client */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {enq.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {enq.clientName}
                        </p>
                      </div>

                      {/* Folder pill */}
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-1 rounded truncate">
                        <Folder className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{enq.folderName}</span>
                      </div>

                      {/* Revisions & Budget */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-700/60 text-zinc-500">
                        {latestRev ? (
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <History className="w-3 h-3" />
                            {latestRev.revCode}
                          </span>
                        ) : (
                          <span className="text-zinc-400">No Rev</span>
                        )}

                        {enq.estimatedBudget && (
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            RM {formatNumber(enq.estimatedBudget)}
                          </span>
                        )}
                      </div>

                      {/* Indicators */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                        <div className="flex items-center gap-2.5">
                          {enq.notes.length > 0 && (
                            <span className="flex items-center gap-1" title="Notes count">
                              <MessageSquare className="w-3 h-3" />
                              {enq.notes.length}
                            </span>
                          )}
                          {enq.files.length > 0 && (
                            <span className="flex items-center gap-1" title="Files count">
                              <FileText className="w-3 h-3" />
                              {enq.files.length}
                            </span>
                          )}
                          {hasImage && (
                            <span className="flex items-center gap-1 text-blue-500" title="Includes photo/drawings">
                              <ImageIcon className="w-3 h-3" />
                            </span>
                          )}
                          {enq.todos.length > 0 && (
                            <span className="flex items-center gap-1" title="Todos count">
                              <CheckSquare className="w-3 h-3" />
                              {enq.todos.filter((t) => t.completed).length}/{enq.todos.length}
                            </span>
                          )}
                        </div>

                        {enq.targetDate && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(enq.targetDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import { Enquiry } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { formatNumber } from "@/lib/format";
import {
  Folder,
  MessageSquare,
  FileText,
  History,
  CheckSquare,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface TableViewProps {
  enquiries: Enquiry[];
  onSelectEnquiry: (enquiry: Enquiry) => void;
}

export function TableView({ enquiries, onSelectEnquiry }: TableViewProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Project & Client</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Latest Rev</th>
              <th className="py-3 px-4">Budget (RM)</th>
              <th className="py-3 px-4">OneDrive Folder</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-400">
                  No matching enquiries found.
                </td>
              </tr>
            ) : (
              enquiries.map((enq) => {
                const latestRev = enq.revisions[0];

                return (
                  <tr
                    key={enq.id}
                    onClick={() => onSelectEnquiry(enq)}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {enq.code}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {enq.title}
                      </div>
                      <div className="text-zinc-500 text-[11px] truncate">
                        {enq.clientName}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={enq.status} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={enq.priority} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {latestRev ? latestRev.revCode : "—"}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-zinc-800 dark:text-zinc-200">
                      {enq.estimatedBudget
                        ? `RM ${enquiryBudgetFormatted(enq.estimatedBudget)}`
                        : "—"}
                    </td>

                    <td className="py-3 px-4 max-w-[200px] truncate text-zinc-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1 truncate">
                        <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{enq.folderName}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1" title="Notes">
                          <MessageSquare className="w-3 h-3" />
                          {enq.notes.length}
                        </span>
                        <span className="flex items-center gap-1" title="Files">
                          <FileText className="w-3 h-3" />
                          {enq.files.length}
                        </span>
                        <span className="flex items-center gap-1" title="Action Items">
                          <CheckSquare className="w-3 h-3" />
                          {enq.todos.filter((t) => t.completed).length}/{enq.todos.length}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEnquiry(enq);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Open Hub
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function enquiryBudgetFormatted(budget: number): string {
  return formatNumber(budget);
}

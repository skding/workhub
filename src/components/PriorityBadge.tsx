import { EnquiryPriority } from "@/types";

export const PRIORITY_CONFIG: Record<
  EnquiryPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: {
    label: "Low",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  URGENT: {
    label: "Urgent",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
};

export function PriorityBadge({ priority }: { priority: EnquiryPriority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  CheckCircle2,
  Folder,
  Copy,
  Check,
  Server,
  HelpCircle,
  ExternalLink,
  Terminal,
  Layers,
} from "lucide-react";

interface OneDriveSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export function OneDriveSetupModal({
  isOpen,
  onClose,
  onStatusChanged,
}: OneDriveSetupModalProps) {
  const [status, setStatus] = useState<{
    storageRoot: string;
    exists: boolean;
    provider: string;
  }>({
    storageRoot: "",
    exists: false,
    provider: "",
  });

  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/onedrive/status");
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                1TB Microsoft 365 OneDrive Integration (Rclone Engine)
              </h2>
              <p className="text-xs text-zinc-500">
                Direct synchronization with your personal 1TB Office 365 storage
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

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Active Status Card */}
          <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/50 shrink-0" />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Storage Engine: Ready &amp; Active</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    1TB M365 Ready
                  </span>
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                  Active Sync Root: <code className="font-mono text-emerald-700 dark:text-emerald-300">{status.storageRoot}</code>
                </p>
              </div>
            </div>
          </div>

          {/* How Rclone on Cloud VM Works */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-500" />
              How Your Cloud VM &amp; Phone Stay in Sync
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When WorkHub is deployed on your Cloud VM, <strong>Rclone</strong> connects directly to your 1TB Microsoft 365 account using its pre-approved Microsoft client (zero Azure configuration needed). It mounts your OneDrive as a real directory, so any enquiry you create on your phone or PC instantly syncs files across all your devices.
            </p>
          </div>

          {/* Quick 3-Step Setup for Cloud VM */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-500" />
              Quick Setup Instructions for Your Cloud VM
            </h3>

            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                <span>1. Install Rclone on your VM</span>
                <button
                  onClick={() => copyText("curl https://rclone.org/install.sh | sudo bash", "step1")}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {copiedCmd === "step1" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd === "step1" ? "Copied" : "Copy command"}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto">
curl https://rclone.org/install.sh | sudo bash
              </pre>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                <span>2. Connect to your 1TB Microsoft 365 Account</span>
                <button
                  onClick={() => copyText("rclone config", "step2")}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {copiedCmd === "step2" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd === "step2" ? "Copied" : "Copy command"}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Type <code>rclone config</code> $\rightarrow$ New remote named <code>onedrive</code> $\rightarrow$ Choose <strong>Microsoft OneDrive</strong> $\rightarrow$ Sign in with your personal Microsoft 365 account in the browser pop-up.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                <span>3. Mount OneDrive folder on your VM</span>
                <button
                  onClick={() => copyText("mkdir -p /var/data/onedrive && rclone mount onedrive: /var/data/onedrive --vfs-cache-mode writes --daemon", "step3")}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {copiedCmd === "step3" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd === "step3" ? "Copied" : "Copy command"}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto">
mkdir -p /var/data/onedrive && rclone mount onedrive: /var/data/onedrive --vfs-cache-mode writes --daemon
              </pre>
              <p className="text-[11px] text-zinc-500">
                Then in WorkHub&apos;s <code>.env</code> file, set <code>ONEDRIVE_ROOT_PATH=&quot;/var/data/onedrive&quot;</code>!
              </p>
            </div>
          </div>

          {/* Standardized Structure */}
          <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-300 font-mono text-[11px] space-y-1">
            <span className="text-zinc-400 font-semibold block mb-1">Standardized Project Layout on your 1TB Drive:</span>
            <div className="text-blue-400">📁 [OneDrive Root]/WorkHub/2026/</div>
            <div className="pl-4 text-amber-300">└── 📁 202611-001_ClientName_ProjectTitle/</div>
            <div className="pl-8 text-emerald-400">├── 📁 01_Client_Inputs</div>
            <div className="pl-8 text-purple-400">├── 📁 02_Design_Concepts</div>
            <div className="pl-8 text-sky-400">└── 📁 03_Costing_Revisions</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

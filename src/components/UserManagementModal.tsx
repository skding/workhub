"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Trash2, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Lock,
  Edit2
} from "lucide-react";
import { formatDate } from "@/lib/format";

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    userId: string;
    username: string;
    name: string;
    role: string;
  } | null;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  currentUser,
}: UserManagementModalProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("ENGINEER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Reset Password State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("ENGINEER");
  const [editPassword, setEditPassword] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load users");
      }
      setUsers(data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setShowAddForm(false);
      setEditingUserId(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUsername.trim() || !newName.trim() || !newPassword) {
      setError("Please fill in all required fields (username, name, password).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess(`User @${data.data.username} created successfully!`);
      setNewUsername("");
      setNewName("");
      setNewPassword("");
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (user: UserItem) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword("");
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = async (id: string) => {
    setError(null);
    setSuccess(null);

    try {
      setIsSubmitting(true);
      const payload: any = {
        name: editName.trim(),
        role: editRole,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update user");
      }

      setSuccess(`User updated successfully!`);
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete user");
      }

      setSuccess(`User @${username} deleted.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">User & Security Management</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                  P&C Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage operator logins, access tiers, and security credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              title="Refresh users list"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">
              Total Accounts: <span className="text-white font-bold">{users.length}</span>
            </div>

            {currentUser?.role === "ADMIN" && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add User Account</span>
              </button>
            )}
          </div>

          {/* Add User Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <UserPlus className="w-4 h-4" /> Create New User Account
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. jason"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Jason Lim (PLC Eng)"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Role Tier
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="ENGINEER">ENGINEER (Standard Operations)</option>
                    <option value="ADMIN">ADMIN (Full Access & User Control)</option>
                    <option value="VIEWER">VIEWER (Read Only)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save User"}
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => {
                  const isCurrent = currentUser?.userId === u.id;
                  const isEditing = editingUserId === u.id;

                  if (isEditing) {
                    return (
                      <tr key={u.id} className="bg-slate-900/90">
                        <td className="py-3 px-4" colSpan={5}>
                          <div className="space-y-3 p-2 bg-slate-950/60 rounded-lg border border-cyan-800/60">
                            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                              <span>Editing User: @{u.username}</span>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                                />
                              </div>

                              {currentUser?.role === "ADMIN" && (
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">Role Tier</label>
                                  <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                                  >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="ENGINEER">ENGINEER</option>
                                    <option value="VIEWER">VIEWER</option>
                                  </select>
                                </div>
                              )}

                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                  New Password (leave blank to keep current)
                                </label>
                                <input
                                  type="password"
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  placeholder="Leave blank to keep"
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(u.id)}
                                disabled={isSubmitting}
                                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white cursor-pointer"
                              >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {isCurrent && (
                            <span className="text-[10px] text-cyan-400 font-mono">(You)</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        @{u.username}
                      </td>

                      <td className="py-3 px-4">
                        <span 
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            u.role === "ADMIN" 
                              ? "bg-rose-500/10 text-rose-300 border border-rose-500/30" 
                              : u.role === "ENGINEER"
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                              : "bg-slate-500/10 text-slate-300 border border-slate-500/30"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(u)}
                            title="Edit user details or reset password"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {currentUser?.role === "ADMIN" && !isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Delete account"
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-900/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Passkeys are encrypted with Bcrypt & JWT tokens expire in 30 days</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

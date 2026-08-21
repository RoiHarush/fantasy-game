"use client";

import { useState } from "react";

import { useAdminUsers } from "../../../features/super-admin/useSuperAdmin";
import { Button } from "../../../shared/ui/Button";
import AdminUserEditModal from "./AdminUserEditModal";

export default function AdminUsersPage() {
    const [editingUserId, setEditingUserId] = useState(null);
    const usersQuery = useAdminUsers();

    if (usersQuery.isPending) return <p role="status">Loading users…</p>;
    if (usersQuery.error) return <p className="text-red-700" role="alert">{usersQuery.error.message}</p>;

    return (
        <section className="space-y-5">
            <header>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-500">Account directory</p>
                <h1 className="mt-1 text-2xl font-black text-app-foreground sm:text-3xl">Users Management</h1>
                <p className="mt-2 text-sm text-app-muted">Review managers and use <strong className="text-app-foreground">Manage</strong> to correct account details, chips or saved gameweek points.</p>
            </header>

            <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[48rem] border-collapse text-left text-sm text-app-foreground">
                        <caption className="sr-only">Registered fantasy game users</caption>
                        <thead className="border-b border-app-border bg-app-surface-muted text-[0.68rem] font-black uppercase tracking-[0.12em] text-app-muted">
                            <tr>
                                <th scope="col" className="px-4 py-3">User ID</th>
                                <th scope="col" className="px-4 py-3">Username</th>
                                <th scope="col" className="px-4 py-3">Role</th>
                                <th scope="col" className="px-4 py-3">Fantasy Team</th>
                                <th scope="col" className="px-4 py-3 text-right">Total Points</th>
                                <th scope="col" className="px-4 py-3 text-right">Account / scoring</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-border">
                            {(usersQuery.data ?? []).map(user => (
                                <tr key={user.userId} className="transition-colors hover:bg-app-surface-muted/70">
                                    <td className="px-4 py-3 font-mono text-xs text-app-muted">#{user.userId}</td>
                                    <td className="px-4 py-3 font-extrabold text-app-foreground">{user.username}</td>
                                    <td className="px-4 py-3"><span className="inline-flex rounded-full border border-app-border bg-app-surface-muted px-2.5 py-1 text-[0.68rem] font-black text-app-muted">{user.role?.replace("ROLE_", "")}</span></td>
                                    <td className="px-4 py-3 font-semibold text-app-foreground">{user.fantasyTeamName || <span className="text-app-muted">No team</span>}</td>
                                    <td className="px-4 py-3 text-right font-black tabular-nums text-app-foreground">{user.totalPoints ?? 0}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" onClick={() => setEditingUserId(user.userId)}>Manage</Button>
                                    </td>
                                </tr>
                            ))}
                            {(usersQuery.data ?? []).length === 0 && (
                                <tr><td colSpan="6" className="px-4 py-10 text-center font-semibold text-app-muted">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUserId && (
                <AdminUserEditModal
                    userId={editingUserId}
                    onClose={() => setEditingUserId(null)}
                    onSave={() => setEditingUserId(null)}
                />
            )}
        </section>
    );
}

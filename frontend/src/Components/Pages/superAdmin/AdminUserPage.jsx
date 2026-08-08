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
        <section>
            <h1 className="mb-5 text-3xl font-bold">Users Management</h1>
            <div className="overflow-x-auto rounded-xl bg-white shadow-md">
                <table className="w-full border-collapse text-left">
                    <caption className="sr-only">Registered fantasy game users</caption>
                    <thead className="bg-slate-100">
                        <tr>
                            <th scope="col" className="border-b-2 border-slate-200 px-4 py-3">User ID</th>
                            <th scope="col" className="border-b-2 border-slate-200 px-4 py-3">Username</th>
                            <th scope="col" className="border-b-2 border-slate-200 px-4 py-3">Role</th>
                            <th scope="col" className="border-b-2 border-slate-200 px-4 py-3">Fantasy Team</th>
                            <th scope="col" className="border-b-2 border-slate-200 px-4 py-3">Total Points</th>
                            <th scope="col" className="border-b-2 border-slate-200 px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(usersQuery.data ?? []).map(user => (
                            <tr key={user.userId} className="border-b border-slate-200 last:border-0">
                                <td className="px-4 py-3">{user.userId}</td>
                                <td className="px-4 py-3">{user.username}</td>
                                <td className="px-4 py-3">{user.role}</td>
                                <td className="px-4 py-3">{user.fantasyTeamName}</td>
                                <td className="px-4 py-3">{user.totalPoints}</td>
                                <td className="px-4 py-3">
                                    <Button size="sm" onClick={() => setEditingUserId(user.userId)}>Edit</Button>
                                </td>
                            </tr>
                        ))}
                        {(usersQuery.data ?? []).length === 0 && (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
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

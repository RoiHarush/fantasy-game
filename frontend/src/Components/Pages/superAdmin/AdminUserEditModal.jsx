"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";

import { adminUserDetailsSchema } from "../../../features/super-admin/schemas";
import {
    useAdminUserDetails,
    useUpdateAdminUser,
} from "../../../features/super-admin/useSuperAdmin";
import { Button } from "../../../shared/ui/Button";

const inputClassName = "mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-cyan focus:ring-3 focus:ring-brand-cyan/20";

function AdminUserEditForm({ details, userId, onSave }) {
    const defaultValues = {
        userId: details.userId,
        username: details.username || "",
        name: details.name || "",
        role: details.role,
        fantasyTeamName: details.fantasyTeamName || "",
        password: "",
        chips: details.chips || {},
        activeChips: details.activeChips || {},
        gameweekPoints: [...(details.gameweekPoints || [])].sort((left, right) => left.gameweek - right.gameweek),
    };
    const form = useForm({ resolver: zodResolver(adminUserDetailsSchema), defaultValues });
    const saveUser = useUpdateAdminUser(userId, onSave);

    return (
        <form onSubmit={form.handleSubmit(values => saveUser.mutate(values))} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-semibold">Username<input className={inputClassName} {...form.register("username")} /></label>
                    <label className="text-sm font-semibold">Name<input className={inputClassName} {...form.register("name")} /></label>
                    <label className="text-sm font-semibold">Role
                        <select className={inputClassName} {...form.register("role")}>
                            <option value="ROLE_USER">USER</option>
                            <option value="ROLE_SUPER_ADMIN">SUPER ADMIN</option>
                        </select>
                    </label>
                    <label className="text-sm font-semibold">Fantasy Team Name<input className={inputClassName} {...form.register("fantasyTeamName")} /></label>
                    <label className="text-sm font-semibold text-amber-700">Reset Password
                        <input type="password" autoComplete="new-password" placeholder="Leave empty to keep current" className={`${inputClassName} border-amber-600`} {...form.register("password")} />
                    </label>
                </div>

                <hr className="my-6 border-slate-200" />
                <h3 className="mb-3 text-lg font-bold">Chips</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.keys(details.chips || {}).map(chipName => (
                        <label className="text-sm font-semibold" key={chipName}>{chipName} (Count)
                            <input type="number" min="0" className={inputClassName} {...form.register(`chips.${chipName}`, { valueAsNumber: true })} />
                        </label>
                    ))}
                    {Object.keys(details.activeChips || {}).map(chipName => (
                        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold" key={chipName}>
                            <input type="checkbox" {...form.register(`activeChips.${chipName}`)} />{chipName} (Active)
                        </label>
                    ))}
                </div>

                <hr className="my-6 border-slate-200" />
                <h3 className="mb-3 text-lg font-bold">Gameweek Points</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {defaultValues.gameweekPoints.map((gameweekPoint, index) => (
                        <label className="text-sm font-semibold" key={gameweekPoint.pointsEntityId}>
                            Gameweek {gameweekPoint.gameweek}
                            <input type="hidden" {...form.register(`gameweekPoints.${index}.gameweek`, { valueAsNumber: true })} />
                            <input type="hidden" {...form.register(`gameweekPoints.${index}.pointsEntityId`, { valueAsNumber: true })} />
                            <input type="number" className={inputClassName} {...form.register(`gameweekPoints.${index}.points`, { valueAsNumber: true })} />
                        </label>
                    ))}
                </div>

                {Object.keys(form.formState.errors).length > 0 && <p className="mt-5 text-sm text-red-700" role="alert">Check the highlighted user values before saving.</p>}
                {saveUser.error && <p className="mt-5 text-sm text-red-700" role="alert">{saveUser.error.message}</p>}
            </div>

            <footer className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Dialog.Close asChild><Button variant="ghost" disabled={saveUser.isPending}>Cancel</Button></Dialog.Close>
                <Button type="submit" disabled={saveUser.isPending}>{saveUser.isPending ? "Saving…" : "Save Changes"}</Button>
            </footer>
        </form>
    );
}

export default function AdminUserEditModal({ userId, onClose, onSave }) {
    const detailsQuery = useAdminUserDetails(userId);

    return (
        <Dialog.Root open onOpenChange={open => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] w-[min(94vw,50rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-7 shadow-2xl focus:outline-none">
                    <Dialog.Title className="mb-5 border-b border-slate-200 pb-4 text-2xl font-bold">
                        {detailsQuery.data ? `Edit User: ${detailsQuery.data.username} (ID: ${detailsQuery.data.userId})` : "Edit User"}
                    </Dialog.Title>
                    <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-4 top-4" aria-label="Close"><X /></Button></Dialog.Close>
                    {detailsQuery.isPending ? <p role="status">Loading details…</p>
                        : detailsQuery.error ? <p className="text-red-700" role="alert">{detailsQuery.error.message}</p>
                            : <AdminUserEditForm key={userId} details={detailsQuery.data} userId={userId} onSave={onSave} />}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

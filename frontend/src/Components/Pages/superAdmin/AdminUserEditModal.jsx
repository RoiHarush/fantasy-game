"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";

import { adminUserDetailsSchema } from "../../../features/super-admin/schemas";
import {
    useAdminUserDetails,
    useUpdateAdminUser,
} from "../../../features/super-admin/useSuperAdmin";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import SelectField from "../../../shared/ui/SelectField";

const inputClassName = "mt-1 h-10 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface";

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
            <input type="hidden" {...form.register("userId", { valueAsNumber: true })} />
            <div className="flex-1 overflow-y-auto pr-2 text-app-foreground">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-bold text-app-foreground">Username<input className={inputClassName} {...form.register("username")} /></label>
                    <label className="text-sm font-bold text-app-foreground">Name<input className={inputClassName} {...form.register("name")} /></label>
                    <label className="text-sm font-bold text-app-foreground">Role
                        <Controller
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <SelectField
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    ariaLabel="Role"
                                    className={inputClassName}
                                    options={[
                                        { value: "ROLE_USER", label: "USER" },
                                        { value: "ROLE_SUPER_ADMIN", label: "SUPER ADMIN" },
                                    ]}
                                />
                            )}
                        />
                    </label>
                    <label className="text-sm font-bold text-app-foreground">Fantasy Team Name<input className={inputClassName} {...form.register("fantasyTeamName")} /></label>
                    <label className="text-sm font-bold text-amber-300">Reset Password
                        <input type="password" autoComplete="new-password" placeholder="Leave empty to keep current" className={`${inputClassName} border-amber-500/55`} {...form.register("password")} />
                    </label>
                </div>

                <hr className="my-6 border-app-border" />
                <div className="mb-4">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-cyan-500">Game controls</p>
                    <h3 className="mt-1 text-lg font-black text-app-foreground">Chips</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.keys(details.chips || {}).map(chipName => (
                        <label className="text-sm font-bold text-app-foreground" key={chipName}>{chipName} (Count)
                            <input type="number" min="0" className={inputClassName} {...form.register(`chips.${chipName}`, { valueAsNumber: true })} />
                        </label>
                    ))}
                    {Object.keys(details.activeChips || {}).map(chipName => (
                        <label className="flex items-center gap-3 rounded-xl border border-app-border bg-app-surface-muted p-3 text-sm font-bold text-app-foreground" key={chipName}>
                            <input type="checkbox" {...form.register(`activeChips.${chipName}`)} />{chipName} (Active)
                        </label>
                    ))}
                </div>

                <hr className="my-6 border-app-border" />
                <div className="mb-4">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-cyan-500">Manual scoring</p>
                    <h3 className="mt-1 text-lg font-black text-app-foreground">Gameweek Points</h3>
                    <p className="mt-1 text-xs leading-5 text-app-muted">Change a saved gameweek score only when an administrative correction is required.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {defaultValues.gameweekPoints.map((gameweekPoint, index) => (
                        <label className="rounded-xl border border-app-border bg-app-surface-muted p-3 text-sm font-bold text-app-foreground" key={gameweekPoint.pointsEntityId}>
                            Gameweek {gameweekPoint.gameweek}
                            <input type="hidden" {...form.register(`gameweekPoints.${index}.gameweek`, { valueAsNumber: true })} />
                            <input type="hidden" {...form.register(`gameweekPoints.${index}.pointsEntityId`, { valueAsNumber: true })} />
                            <input type="number" className={inputClassName} {...form.register(`gameweekPoints.${index}.points`, { valueAsNumber: true })} />
                        </label>
                    ))}
                    {defaultValues.gameweekPoints.length === 0 && (
                        <p className="col-span-full rounded-xl border border-dashed border-app-border px-4 py-6 text-center text-sm font-semibold text-app-muted">
                            This user does not have a saved gameweek score yet.
                        </p>
                    )}
                </div>

                {Object.keys(form.formState.errors).length > 0 && <p className="mt-5 text-sm font-semibold text-app-danger-foreground" role="alert">Check the highlighted user values before saving.</p>}
                {saveUser.error && <p className="mt-5 text-sm font-semibold text-app-danger-foreground" role="alert">{saveUser.error.message}</p>}
            </div>

            <footer className="mt-6 flex justify-end gap-3 border-t border-app-border pt-4">
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
                <Dialog.Overlay className="fixed inset-0 z-[5000] bg-slate-950/75 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-[5001] flex h-[90vh] w-[min(94vw,50rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-app-border bg-app-surface p-5 text-app-foreground shadow-2xl focus:outline-none sm:p-7">
                    <Dialog.Title className="mb-5 border-b border-app-border pb-4 pr-10 text-xl font-black text-app-foreground sm:text-2xl">
                        {detailsQuery.data ? `Edit User: ${detailsQuery.data.username} (ID: ${detailsQuery.data.userId})` : "Edit User"}
                    </Dialog.Title>
                    <Dialog.Close asChild><CloseButton className="absolute right-4 top-4" aria-label="Close" /></Dialog.Close>
                    {detailsQuery.isPending ? <p role="status">Loading details…</p>
                        : detailsQuery.error ? <p className="text-app-danger-foreground" role="alert">{detailsQuery.error.message}</p>
                            : <AdminUserEditForm key={userId} details={detailsQuery.data} userId={userId} onSave={onSave} />}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

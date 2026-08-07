"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../../Context/AuthContext";
import { buildSettingsPayload } from "../../../features/settings/model";
import { settingsSchema } from "../../../features/settings/schemas";
import { useUpdateSettings } from "../../../features/settings/useSettings";
import { Button } from "../../../shared/ui/Button";

const inputClassName = "mt-2 h-11 w-full rounded-control border border-slate-300 bg-white px-3 text-brand-ink outline-none transition focus:border-brand-cyan focus:ring-3 focus:ring-brand-cyan/20 aria-invalid:border-red-500";

function FieldError({ error }) {
    if (!error) return null;
    return <p className="mt-1 text-sm text-red-700" role="alert">{error.message}</p>;
}

function SettingsForm({ user, updateUser }) {
    const [message, setMessage] = useState(null);
    const form = useForm({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            teamName: user.fantasyTeamName || "",
            name: user.name || "",
            username: user.username || "",
            currentPassword: "",
            newPassword: "",
        },
    });
    const mutation = useUpdateSettings({
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            form.reset({
                teamName: updatedUser.fantasyTeamName || "",
                name: updatedUser.name || "",
                username: updatedUser.username || "",
                currentPassword: "",
                newPassword: "",
            });
            setMessage({ type: "success", text: "Profile updated successfully." });
        },
        onError: (error) => setMessage({ type: "error", text: error.message }),
    });

    const submit = form.handleSubmit((values) => {
        setMessage(null);
        const payload = buildSettingsPayload(values, user);

        if (Object.keys(payload).length === 0) {
            setMessage({ type: "info", text: "No changes detected." });
            return;
        }
        mutation.mutate(payload);
    });

    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 text-brand-ink sm:px-8">
            <header className="mb-8 border-b border-slate-200 pb-5">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-purple">Account</p>
                <h1 className="mt-2 text-3xl font-bold">Edit your profile</h1>
            </header>

            {message && (
                <div
                    className={`mb-6 rounded-control border p-4 text-sm font-medium ${
                        message.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : message.type === "error"
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-sky-200 bg-sky-50 text-sky-800"
                    }`}
                    role={message.type === "error" ? "alert" : "status"}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={submit} className="space-y-9" noValidate>
                <section>
                    <h2 className="mb-4 text-lg font-bold">Team details</h2>
                    <label className="block text-sm font-semibold" htmlFor="teamName">Team name</label>
                    <input id="teamName" className={inputClassName} aria-invalid={Boolean(form.formState.errors.teamName)} {...form.register("teamName")} />
                    <FieldError error={form.formState.errors.teamName} />
                </section>

                <section className="grid gap-5 sm:grid-cols-2">
                    <h2 className="sm:col-span-2 text-lg font-bold">Personal information</h2>
                    <div>
                        <label className="block text-sm font-semibold" htmlFor="name">Display name</label>
                        <input id="name" className={inputClassName} aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
                        <FieldError error={form.formState.errors.name} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold" htmlFor="username">Username</label>
                        <input id="username" autoComplete="username" className={inputClassName} aria-invalid={Boolean(form.formState.errors.username)} {...form.register("username")} />
                        <FieldError error={form.formState.errors.username} />
                    </div>
                </section>

                <section className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <h2 className="text-lg font-bold">Change password</h2>
                        <p className="mt-1 text-sm text-slate-600">Leave both fields empty to keep your current password.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold" htmlFor="newPassword">New password</label>
                        <input id="newPassword" type="password" autoComplete="new-password" className={inputClassName} aria-invalid={Boolean(form.formState.errors.newPassword)} {...form.register("newPassword")} />
                        <FieldError error={form.formState.errors.newPassword} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold" htmlFor="currentPassword">Current password</label>
                        <input id="currentPassword" type="password" autoComplete="current-password" className={inputClassName} aria-invalid={Boolean(form.formState.errors.currentPassword)} {...form.register("currentPassword")} />
                        <FieldError error={form.formState.errors.currentPassword} />
                    </div>
                </section>

                <Button type="submit" size="lg" disabled={mutation.isPending}>
                    {mutation.isPending ? "Updating…" : "Save changes"}
                </Button>
            </form>
        </main>
    );
}

function SettingsPage() {
    const { user, updateUser } = useAuth();
    return <SettingsForm key={user.id} user={user} updateUser={updateUser} />;
}

export default SettingsPage;

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    BadgeCheck,
    Eye,
    EyeOff,
    Info,
    LockKeyhole,
    Save,
    Settings2,
    ShieldCheck,
    Shirt,
    TriangleAlert,
    UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../../Context/AuthContext";
import { buildSettingsPayload } from "../../../features/settings/model";
import { settingsSchema } from "../../../features/settings/schemas";
import { useUpdateSettings } from "../../../features/settings/useSettings";
import { Button } from "../../../shared/ui/Button";

const inputClassName = "h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-sm font-semibold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface aria-invalid:border-app-danger-border aria-invalid:ring-app-danger-surface";

function FieldError({ error }) {
    if (!error) return null;
    return <p className="mt-1.5 text-xs font-semibold text-app-danger-foreground" role="alert">{error.message}</p>;
}

function SectionHeader({ icon: Icon, title, description }) {
    return (
        <header className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-black text-app-foreground sm:text-base">
                <Icon className="size-4 text-app-accent" aria-hidden="true" />
                {title}
            </h2>
            <p className="mt-1 max-w-xs text-xs leading-5 text-app-muted">{description}</p>
        </header>
    );
}

function PasswordField({ id, label, register, error, autoComplete, visible, onToggle }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor={id}>{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    className={`${inputClassName} pr-11`}
                    aria-invalid={Boolean(error)}
                    {...register(id)}
                />
                <button
                    type="button"
                    className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-app-muted transition hover:bg-app-accent-hover hover:text-app-foreground focus-visible:outline-2 focus-visible:outline-app-accent"
                    aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={onToggle}
                >
                    {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
            </div>
            <FieldError error={error} />
        </div>
    );
}

function Feedback({ message }) {
    if (!message) return null;

    const styles = {
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        error: "border-app-danger-border bg-app-danger-surface text-app-danger-foreground",
        info: "border-app-accent-border bg-app-accent-surface text-app-accent-foreground",
    };
    const Icon = message.type === "success" ? BadgeCheck : message.type === "error" ? TriangleAlert : Info;

    return (
        <div className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-sm font-semibold ${styles[message.type]}`} role={message.type === "error" ? "alert" : "status"}>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{message.text}</span>
        </div>
    );
}

function SettingsForm({ user, updateUser }) {
    const [message, setMessage] = useState(null);
    const [passwordVisibility, setPasswordVisibility] = useState({ currentPassword: false, newPassword: false });
    const form = useForm({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            teamName: user.fantasyTeamName || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
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
                firstName: updatedUser.firstName || "",
                lastName: updatedUser.lastName || "",
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

    function togglePassword(field) {
        setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-3 py-5 text-app-foreground sm:px-6 sm:py-9 lg:py-12">
            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm sm:rounded-3xl">
                <header className="border-b border-app-border px-4 py-5 sm:px-7 sm:py-7">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-app-accent-surface text-app-accent-foreground ring-1 ring-app-accent-border">
                            <Settings2 className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-xl font-black tracking-tight text-app-foreground sm:text-2xl">Account settings</h1>
                            <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Manage your fantasy identity and sign-in details.</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={submit} noValidate>
                    {message && <div className="px-4 pt-4 sm:px-7 sm:pt-6"><Feedback message={message} /></div>}

                    <section className="grid gap-4 px-4 py-6 sm:px-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
                        <SectionHeader icon={Shirt} title="Fantasy team" description="This is the team name other managers see around the league." />
                        <div className="max-w-lg">
                            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor="teamName">Team name</label>
                            <input id="teamName" className={inputClassName} aria-invalid={Boolean(form.formState.errors.teamName)} {...form.register("teamName")} />
                            <FieldError error={form.formState.errors.teamName} />
                        </div>
                    </section>

                    <section className="grid gap-4 border-t border-app-border px-4 py-6 sm:px-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
                        <SectionHeader icon={UserRound} title="Personal information" description="Update your name and the username used to sign in." />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor="firstName">First name</label>
                                <input id="firstName" autoComplete="given-name" className={inputClassName} aria-invalid={Boolean(form.formState.errors.firstName)} {...form.register("firstName")} />
                                <FieldError error={form.formState.errors.firstName} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor="lastName">Last name</label>
                                <input id="lastName" autoComplete="family-name" className={inputClassName} aria-invalid={Boolean(form.formState.errors.lastName)} {...form.register("lastName")} />
                                <FieldError error={form.formState.errors.lastName} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor="username">Username</label>
                                <input id="username" autoComplete="username" spellCheck="false" className={inputClassName} aria-invalid={Boolean(form.formState.errors.username)} {...form.register("username")} />
                                <FieldError error={form.formState.errors.username} />
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 border-t border-app-border px-4 py-6 sm:px-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
                        <SectionHeader icon={LockKeyhole} title="Password & security" description="Leave both fields empty to keep your current password." />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <PasswordField
                                id="currentPassword"
                                label="Current password"
                                register={form.register}
                                error={form.formState.errors.currentPassword}
                                autoComplete="current-password"
                                visible={passwordVisibility.currentPassword}
                                onToggle={() => togglePassword("currentPassword")}
                            />
                            <PasswordField
                                id="newPassword"
                                label="New password"
                                register={form.register}
                                error={form.formState.errors.newPassword}
                                autoComplete="new-password"
                                visible={passwordVisibility.newPassword}
                                onToggle={() => togglePassword("newPassword")}
                            />
                            <p className="flex items-start gap-2 border-l-2 border-app-accent-border pl-3 text-xs leading-5 text-app-muted sm:col-span-2">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-app-accent" aria-hidden="true" />
                                New passwords must contain at least 8 characters. Your current password is required to confirm the change.
                            </p>
                        </div>
                    </section>

                    <div className="flex flex-col-reverse items-stretch gap-3 border-t border-app-border bg-app-surface-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <p className="text-center text-xs font-semibold text-app-muted sm:text-left">
                            {form.formState.isDirty ? "You have unsaved changes." : "Your saved profile is up to date."}
                        </p>
                        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={mutation.isPending}>
                            <Save className="size-4" aria-hidden="true" />
                            {mutation.isPending ? "Updating…" : "Save changes"}
                        </Button>
                    </div>
                </form>
            </section>
        </main>
    );
}

function SettingsPage() {
    const { user, updateUser } = useAuth();
    return <SettingsForm key={user.id} user={user} updateUser={updateUser} />;
}

export default SettingsPage;

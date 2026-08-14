"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, KeyRound, LoaderCircle, LockKeyhole } from "@/src/shared/ui/icons";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { resetPasswordSchema } from "../../features/auth/schemas";
import { useResetPassword } from "../../features/auth/useAuthActions";
import { Button } from "../../shared/ui/Button";
import AuthActionCard from "./AuthActionCard";
import { AuthenticationField } from "./AuthFormControls";

export default function ResetPassword({ token }) {
    const [successMessage, setSuccessMessage] = useState("");
    const form = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
    const reset = useResetPassword({
        onSuccess: ({ message }) => setSuccessMessage(message),
        onError: (error) => form.setError("root.server", { message: error.message }),
    });
    const missingToken = !token;

    return (
        <AuthActionCard eyebrow="Account recovery" title="Choose a new password" description="The secure reset link is valid for 30 minutes and can only be used once." icon={KeyRound}>
            {successMessage ? (
                <div className="mt-7 rounded-2xl border border-app-positive-border bg-app-positive-surface p-5 text-center" role="status"><BadgeCheck className="mx-auto size-8 text-app-positive-foreground" /><p className="mt-3 text-sm font-bold leading-6">{successMessage}</p></div>
            ) : missingToken ? (
                <p className="mt-7 rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground" role="alert">This reset link is missing its token. Request a new password reset email.</p>
            ) : (
                <form className="mt-7 space-y-4" onSubmit={form.handleSubmit(({ password }) => reset.mutate({ token, password }))} noValidate>
                    <AuthenticationField id="new-password" label="New password" placeholder="At least 8 characters" autoComplete="new-password" registration={form.register("password")} error={form.formState.errors.password} icon={LockKeyhole} type="password" revealable />
                    <AuthenticationField id="confirm-new-password" label="Confirm new password" placeholder="Repeat your password" autoComplete="new-password" registration={form.register("confirmPassword")} error={form.formState.errors.confirmPassword} icon={LockKeyhole} type="password" revealable />
                    {form.formState.errors.root?.server && <p className="rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground" role="alert">{form.formState.errors.root.server.message}</p>}
                    <Button type="submit" size="lg" className="w-full" disabled={reset.isPending}>{reset.isPending ? <><LoaderCircle className="size-5 animate-spin" /> Updating…</> : "Update password"}</Button>
                </form>
            )}
        </AuthActionCard>
    );
}

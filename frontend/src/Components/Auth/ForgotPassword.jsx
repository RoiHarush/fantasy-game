"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, LoaderCircle, Mail, RotateCcwKey } from "@/src/shared/ui/icons";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { emailSchema } from "../../features/auth/schemas";
import { useRequestPasswordReset } from "../../features/auth/useAuthActions";
import { Button } from "../../shared/ui/Button";
import AuthActionCard from "./AuthActionCard";
import { AuthenticationField } from "./AuthFormControls";

export default function ForgotPassword() {
    const [sentMessage, setSentMessage] = useState("");
    const form = useForm({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
    const request = useRequestPasswordReset({
        onSuccess: ({ message }) => setSentMessage(message),
        onError: (error) => form.setError("root.server", { message: error.message }),
    });

    return (
        <AuthActionCard eyebrow="Account recovery" title="Forgot your password?" description="Enter the verified email connected to your manager account." icon={RotateCcwKey}>
            {sentMessage ? (
                <div className="mt-7 rounded-2xl border border-app-positive-border bg-app-positive-surface p-5 text-center" role="status">
                    <BadgeCheck className="mx-auto size-8 text-app-positive-foreground" aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold leading-6 text-app-foreground">{sentMessage}</p>
                </div>
            ) : (
                <form className="mt-7 space-y-4" onSubmit={form.handleSubmit(({ email }) => request.mutate(email))} noValidate>
                    <AuthenticationField id="recovery-email" label="Email address" placeholder="you@example.com" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck="false" registration={form.register("email")} error={form.formState.errors.email} icon={Mail} type="email" />
                    {form.formState.errors.root?.server && <p className="rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground" role="alert">{form.formState.errors.root.server.message}</p>}
                    <Button type="submit" size="lg" className="w-full" disabled={request.isPending}>{request.isPending ? <><LoaderCircle className="size-5 animate-spin" /> Sending…</> : "Send reset link"}</Button>
                </form>
            )}
        </AuthActionCard>
    );
}

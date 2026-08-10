"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, Save, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useAuth } from "../../../Context/AuthContext";
import { removeTeamLogo, updateTeamProfile } from "../../../features/team-profile/api";
import { teamProfileSchema } from "../../../features/team-profile/schema";
import { Button } from "../../../shared/ui/Button";
import ImageWithFallback from "../../../shared/ui/ImageWithFallback";

const inputClassName = "h-12 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3.5 text-sm font-bold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface";

function TeamProfilePage() {
    const { user, updateUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const form = useForm({
        resolver: zodResolver(teamProfileSchema),
        defaultValues: { teamName: user.fantasyTeamName || "", logo: null },
    });
    const selectedLogo = useWatch({ control: form.control, name: "logo" });
    const selectedPreviewUrl = useMemo(
        () => selectedLogo ? URL.createObjectURL(selectedLogo) : null,
        [selectedLogo],
    );
    const previewUrl = selectedPreviewUrl || user.logoPath;
    const hasCustomLogo = Boolean(user.logoPath && user.logoPath !== "/UI/team-placeholder.svg" && user.logoPath !== "/UI/icon.png");

    useEffect(() => {
        return () => {
            if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
        };
    }, [selectedPreviewUrl]);

    const submit = form.handleSubmit(async (values) => {
        setSaving(true);
        try {
            const updatedUser = await updateTeamProfile(values);
            updateUser(updatedUser);
            form.reset({ teamName: updatedUser.fantasyTeamName, logo: null });
            toast.success("Team identity updated");
        } catch (error) {
            toast.error(error.message || "Unable to update your team");
        } finally {
            setSaving(false);
        }
    });

    async function removeLogo() {
        setRemoving(true);
        try {
            const updatedUser = await removeTeamLogo();
            updateUser(updatedUser);
            form.setValue("logo", null);
            toast.success("Team logo removed");
        } catch (error) {
            toast.error(error.message || "Unable to remove the team logo");
        } finally {
            setRemoving(false);
        }
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-3 py-5 text-app-foreground sm:px-6 sm:py-10">
            <Link href="/pick-team" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-app-muted transition hover:text-app-foreground">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to your squad
            </Link>

            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel sm:rounded-3xl">
                <header className="relative overflow-hidden bg-component-gradient px-5 py-6 text-brand-ink sm:px-8 sm:py-8">
                    <div className="relative">
                        <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">Club identity</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Make this team yours</h1>
                        <p className="mt-2 max-w-xl text-sm font-semibold opacity-75">Choose the name and badge every manager will see around your league.</p>
                    </div>
                </header>

                <form onSubmit={submit} className="grid gap-6 p-4 sm:p-7 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-8">
                    <div>
                        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-app-border bg-app-surface-elevated p-6">
                            <ImageWithFallback src={previewUrl} fallbackSrc="/UI/team-placeholder.svg" alt="Team logo preview" width={220} height={220} unoptimized className="size-full object-contain" />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-app-accent-border bg-app-accent-surface px-3 text-xs font-black text-app-accent-foreground transition hover:bg-app-accent-hover">
                                <ImagePlus className="size-4" aria-hidden="true" />
                                Choose image
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="sr-only"
                                    onChange={(event) => form.setValue("logo", event.target.files?.[0] ?? null, { shouldDirty: true, shouldValidate: true })}
                                />
                            </label>
                            <button type="button" disabled={removing || !hasCustomLogo} onClick={removeLogo} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-app-border px-3 text-xs font-black text-app-muted transition hover:border-app-danger-border hover:bg-app-danger-surface hover:text-app-danger-foreground disabled:cursor-not-allowed disabled:opacity-45">
                                <Trash2 className="size-4" aria-hidden="true" />
                                Remove
                            </button>
                        </div>
                        {form.formState.errors.logo && <p className="mt-2 text-xs font-bold text-app-danger-foreground" role="alert">{form.formState.errors.logo.message}</p>}
                    </div>

                    <div className="flex min-w-0 flex-col justify-center">
                        <label htmlFor="teamName" className="text-xs font-black uppercase tracking-[0.12em] text-app-muted">Team name</label>
                        <input id="teamName" className={`${inputClassName} mt-2`} maxLength={50} {...form.register("teamName")} />
                        {form.formState.errors.teamName && <p className="mt-2 text-xs font-bold text-app-danger-foreground" role="alert">{form.formState.errors.teamName.message}</p>}
                        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-app-muted">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-app-accent" aria-hidden="true" />
                            Images are validated and stored with your team data. PNG, JPEG, WebP and GIF are supported up to 3 MB.
                        </p>
                        <Button type="submit" size="lg" className="mt-6 w-full sm:w-fit" disabled={saving || !form.formState.isDirty}>
                            <Save className="size-4" aria-hidden="true" />
                            {saving ? "Saving…" : "Save team identity"}
                        </Button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default TeamProfilePage;

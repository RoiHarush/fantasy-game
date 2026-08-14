import { ArrowLeft, ShieldCheck } from "@/src/shared/ui/icons";
import Link from "next/link";

import AuthPageShell, { AuthBrandIntro } from "./AuthPageShell";

export default function AuthActionCard({ eyebrow, title, description, icon: Icon = ShieldCheck, children, showBackLink = true }) {
    return (
        <AuthPageShell>
            <section className="w-full max-w-lg">
                <AuthBrandIntro eyebrow={null} title="Fantasy Draft" description="Secure access for every league manager." />
                <div className="mt-6 rounded-[1.75rem] border border-white/35 bg-app-surface/90 p-5 shadow-[0_20px_65px_rgba(27,16,53,0.28)] backdrop-blur-2xl sm:p-8">
                    <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-app-positive-border bg-app-positive-surface text-app-positive-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-app-positive-foreground">{eyebrow}</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
                            <p className="mt-1.5 text-sm leading-6 text-app-muted">{description}</p>
                        </div>
                    </div>
                    {children}
                    {showBackLink && (
                        <Link href="/login" className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-app-accent-foreground hover:bg-app-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-positive-border">
                            <ArrowLeft className="size-4" aria-hidden="true" /> Back to sign in
                        </Link>
                    )}
                </div>
            </section>
        </AuthPageShell>
    );
}

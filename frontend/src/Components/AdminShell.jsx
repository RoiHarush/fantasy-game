"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/src/Context/AuthContext";
import { Activity, Eye, LogOut, Menu, Settings2, ShieldAlert, Users, X } from "@/src/shared/ui/icons";
import { Button } from "@/src/shared/ui/Button";

const links = [
    { label: "Overview", href: "/admin", icon: Activity },
    { label: "Observe leagues", href: "/admin/observe", icon: Eye },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Emergency actions", href: "/admin/actions", icon: ShieldAlert },
    { label: "League maintenance", href: "/admin/leagues", icon: Settings2 },
];

function AdminNavigation({ pathname, onNavigate, logout }) {
    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-cyan-300">Fantasy operations</p>
                <h2 className="mt-1 text-xl font-black text-white">Super Admin</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">Observe safely. Intervene only when needed.</p>
            </div>
            <nav className="flex-1 space-y-1 p-3" aria-label="Super admin">
                {links.map(({ label, href, icon: Icon }) => {
                    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} onClick={onNavigate} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/25" : "text-slate-300 hover:bg-white/7 hover:text-white"}`}>
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                        </Link>
                    );
                })}
            </nav>
            <div className="space-y-1 border-t border-white/10 p-3">
                <Button asChild variant="ghost" className="w-full justify-start text-slate-300 hover:bg-white/7 hover:text-white"><Link href="/">Back to game</Link></Button>
                <Button variant="ghost" className="w-full justify-start text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => logout()}><LogOut className="size-4" />Logout</Button>
            </div>
        </div>
    );
}

export default function AdminShell({ children }) {
    const { logout } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const current = links.find(link => link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href)) ?? links[0];

    return (
        <div className="min-h-screen bg-app-background text-app-foreground lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="hidden min-h-screen border-r border-white/10 bg-[#0d0a18] lg:sticky lg:top-0 lg:block lg:h-screen">
                <AdminNavigation pathname={pathname} logout={logout} />
            </aside>

            <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-app-border bg-app-surface/95 px-4 backdrop-blur-xl lg:hidden">
                <div><p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-cyan-500">Super Admin</p><p className="font-black">{current.label}</p></div>
                <Button variant="secondary" size="icon" aria-label="Open admin navigation" onClick={() => setOpen(true)}><Menu className="size-5" /></Button>
            </header>

            {open && <div className="fixed inset-0 z-50 lg:hidden">
                <button className="absolute inset-0 bg-black/70" aria-label="Close admin navigation" onClick={() => setOpen(false)} />
                <aside className="absolute inset-y-0 left-0 w-[min(86vw,19rem)] bg-[#0d0a18] shadow-2xl">
                    <Button variant="ghost" size="icon" className="absolute right-3 top-3 z-10 text-white" aria-label="Close admin navigation" onClick={() => setOpen(false)}><X className="size-5" /></Button>
                    <AdminNavigation pathname={pathname} logout={logout} onNavigate={() => setOpen(false)} />
                </aside>
            </div>}

            <main className="min-w-0 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
    );
}

"use client";

import Link from "next/link";

import { useAuth } from "@/src/Context/AuthContext";
import { Button } from "@/src/shared/ui/Button";

const links = [
    ["Dashboard", "/admin"],
    ["User Management", "/admin/users"],
    ["System Actions", "/admin/actions"],
    ["League Maintenance", "/admin/leagues"],
];

export default function AdminShell({ children }) {
    const { logout } = useAuth();

    return (
        <div className="flex min-h-screen bg-slate-100">
            <nav className="w-60 shrink-0 bg-slate-800 p-4 text-white">
                <h2 className="my-4 text-2xl font-bold">Admin Panel</h2>
                <ul className="space-y-2">
                    {links.map(([label, href]) => (
                        <li key={href}>
                            <Link className="block rounded-lg px-3 py-2 hover:bg-slate-700" href={href}>
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="mt-8 space-y-2">
                    <Button asChild variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white">
                        <Link href="/">Back to Game</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-red-400 hover:bg-slate-700 hover:text-red-300" onClick={() => logout()}>
                        Logout
                    </Button>
                </div>
            </nav>
            <main className="min-w-0 flex-1 p-8">{children}</main>
        </div>
    );
}

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Users } from "@/src/shared/ui/icons";

import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

function includesId(ids, candidate) {
    return ids.some((id) => String(id) === String(candidate));
}

export default function LeaguePresenceStrip({ members = [], activeUserIds = [], loading = false, unavailable = false }) {
    const visibleMembers = members.filter((member) => member?.id != null);
    if (visibleMembers.length === 0 && !loading) return null;

    const activeCount = visibleMembers.filter((member) => includesId(activeUserIds, member.id)).length;
    const summary = loading
        ? "Checking…"
        : unavailable
            ? "Unavailable"
            : `${activeCount}/${visibleMembers.length} online`;

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild disabled={loading || unavailable}>
                <button
                    type="button"
                    aria-label="Open league presence details"
                    className="group inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-app-border bg-transparent px-3 py-1.5 text-xs font-black tabular-nums text-app-muted transition-colors disabled:cursor-default disabled:opacity-60 pointer-fine:hover:border-app-accent-border pointer-fine:hover:text-app-accent-foreground"
                >
                    <span className={`size-2 rounded-full ${activeCount > 0 && !loading && !unavailable ? "bg-emerald-400" : "bg-app-border"}`} aria-hidden="true" />
                    <Users className="size-3.5" aria-hidden="true" />
                    <span>{summary}</span>
                    {!loading && !unavailable && <ArrowRight className="size-3 shrink-0 transition-transform pointer-fine:group-hover:translate-x-0.5" aria-hidden="true" />}
                </button>
            </Dialog.Trigger>

            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-2rem),30rem)]">
                <div className="relative px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-7 sm:p-7">
                    <Dialog.Close asChild>
                        <CloseButton className="absolute right-4 top-4" aria-label="Close league presence" />
                    </Dialog.Close>
                    <span className="grid size-11 place-items-center rounded-2xl bg-app-accent-surface text-app-accent ring-1 ring-app-accent-border">
                        <Users className="size-5" aria-hidden="true" />
                    </span>
                    <Dialog.Title className="mt-4 pr-12 text-2xl font-black tracking-tight text-app-foreground">
                        League presence
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm leading-6 text-app-muted">
                        {activeCount} of {visibleMembers.length} managers are online now.
                    </Dialog.Description>

                    <ul className="mt-6 max-h-[min(55dvh,27rem)] list-none overflow-y-auto border-y border-app-border p-0">
                        {visibleMembers.map((member) => {
                            const active = includesId(activeUserIds, member.id);
                            const name = member.name || member.fantasyTeamName || `Manager ${member.id}`;
                            return (
                                <li key={member.id} className="flex min-h-12 items-center gap-3 border-b border-app-border py-3 last:border-b-0">
                                    <span className={`size-2.5 shrink-0 rounded-full ${active ? "bg-emerald-400" : "bg-app-border"}`} aria-hidden="true" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-app-foreground" title={name}>{name}</span>
                                    <span className={`text-[0.65rem] font-black uppercase tracking-[0.1em] ${active ? "text-app-positive-foreground" : "text-app-muted"}`}>
                                        {active ? "Online" : "Offline"}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

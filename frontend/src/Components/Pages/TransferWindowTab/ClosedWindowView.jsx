import {
    ArrowRightLeft,
    Bot,
    Clock3,
    Play,
    Settings2,
    ShieldCheck,
} from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import TransferWindowCountdown from "./TransferWindowCountdown";

export default function ClosedWindowView({
    gameweekId,
    transferOpenTime,
    transferOrder,
    orderPending,
    orderError,
    automaticAttendance,
    attendancePending,
    attendanceError,
    isLeagueAdmin,
    onAttendanceChange,
    onManageOrder,
    onOpenWindow,
}) {
    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-7 text-app-foreground sm:px-7 sm:py-11 lg:py-14">
            <header className="relative isolate overflow-hidden pb-8 sm:pb-10">
                <div className="pointer-events-none absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-cyan/8 blur-3xl dark:bg-brand-purple/10" aria-hidden="true" />
                <div className="h-1 w-16 rounded-full bg-component-gradient" aria-hidden="true" />

                <div className="mt-5 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-app-positive-foreground sm:text-xs">
                    <span className="relative flex size-2" aria-hidden="true">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-50 motion-reduce:animate-none" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Transfers paused
                </div>

                <div className="mt-3 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] lg:items-end lg:gap-12">
                    <div>
                        <h1 className="max-w-2xl text-3xl font-black tracking-[-0.035em] text-app-foreground sm:text-5xl">
                            Transfer window is closed
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-app-muted sm:text-base sm:leading-7">
                            The next order is ready. Review your position and prepare any waiver priorities before the window opens.
                        </p>
                    </div>

                    <TransferWindowCountdown value={transferOpenTime} />
                </div>
            </header>

            <div className="grid border-y border-app-border lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="py-7 sm:py-9 lg:pr-12" aria-labelledby="transfer-order-title">
                    <div className="flex items-start justify-between gap-5">
                        <div className="flex min-w-0 items-start gap-3">
                            <ArrowRightLeft className="mt-0.5 size-5 shrink-0 text-app-accent" aria-hidden="true" />
                            <div>
                                <h2 id="transfer-order-title" className="text-lg font-black tracking-tight sm:text-2xl">
                                    Upcoming order
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-app-muted sm:text-sm">
                                    Picks run from top to bottom in this exact sequence.
                                </p>
                            </div>
                        </div>
                        {gameweekId && (
                            <span className="shrink-0 pt-0.5 text-xs font-black uppercase tracking-[0.14em] text-app-accent-foreground">
                                GW {gameweekId}
                            </span>
                        )}
                    </div>

                    <TransferOrderList
                        order={transferOrder}
                        pending={orderPending}
                        error={orderError}
                    />
                </section>

                <aside className="border-t border-app-border py-7 sm:py-9 lg:border-l lg:border-t-0 lg:pl-9" aria-label="Transfer window preferences">
                    <section aria-labelledby="attendance-title">
                        <div className="flex items-center gap-2 text-app-accent-foreground">
                            <Bot className="size-4" aria-hidden="true" />
                            <h2 id="attendance-title" className="text-xs font-black uppercase tracking-[0.15em]">
                                Attendance
                            </h2>
                        </div>
                        <p className="mt-3 text-base font-black text-app-foreground">Can’t make this window?</p>
                        <p className="mt-1 text-xs leading-5 text-app-muted">
                            The server will try your waiver plan automatically, then pass if no move succeeds.
                        </p>

                        {gameweekId && (
                            <button
                                type="button"
                                role="switch"
                                aria-label="I won’t attend this transfer window"
                                aria-checked={automaticAttendance}
                                disabled={attendancePending}
                                onClick={onAttendanceChange}
                                className="mt-5 flex min-h-12 w-full items-center justify-between gap-4 border-y border-app-border py-3 text-left text-sm font-bold text-app-foreground transition disabled:cursor-wait disabled:opacity-60 pointer-fine:hover:text-app-accent-foreground"
                            >
                                <span className="min-w-0">
                                    <span className="block">I won’t attend this window</span>
                                    <span className={`mt-0.5 block text-[0.65rem] font-semibold ${automaticAttendance ? "text-app-positive-foreground" : "text-app-muted"}`}>
                                        {automaticAttendance ? "Auto waivers enabled" : "Off · You are expected to attend"}
                                    </span>
                                </span>
                                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${automaticAttendance ? "bg-emerald-500" : "bg-app-surface-muted ring-1 ring-app-border"}`} aria-hidden="true">
                                    <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${automaticAttendance ? "translate-x-6" : "translate-x-1"}`} />
                                </span>
                            </button>
                        )}

                        {attendanceError && (
                            <p className="mt-3 text-xs font-semibold text-app-danger-foreground" role="alert">
                                {attendanceError.message}
                            </p>
                        )}
                    </section>

                    {isLeagueAdmin && (
                        <section className="mt-8 border-t border-app-border pt-7" aria-labelledby="league-controls-title">
                            <div className="flex items-center gap-2 text-app-accent-foreground">
                                <Settings2 className="size-4" aria-hidden="true" />
                                <h2 id="league-controls-title" className="text-xs font-black uppercase tracking-[0.15em]">
                                    League controls
                                </h2>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-app-muted">
                                Adjust the order or start the window ahead of schedule.
                            </p>
                            <div className="mt-4 grid gap-2">
                                <Button variant="secondary" onClick={onManageOrder} className="w-full justify-between">
                                    Manage order
                                    <Settings2 className="size-4" aria-hidden="true" />
                                </Button>
                                <Button variant="danger" onClick={onOpenWindow} className="w-full justify-between">
                                    Open now
                                    <Play className="size-4" fill="currentColor" aria-hidden="true" />
                                </Button>
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </main>
    );
}

function TransferOrderList({ order, pending, error }) {
    if (pending) {
        return (
            <div className="mt-7 space-y-1" role="status" aria-label="Loading transfer order">
                {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="flex h-12 items-center gap-4 border-b border-app-border">
                        <span className="h-3 w-6 animate-pulse rounded bg-app-surface-muted" />
                        <span className="h-3 w-32 animate-pulse rounded bg-app-surface-muted" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p className="mt-7 border-l-2 border-app-danger-border py-2 pl-4 text-sm font-semibold text-app-danger-foreground" role="alert">
                Transfer order could not be loaded.
            </p>
        );
    }

    if (order.length === 0) {
        return (
            <div className="mt-7 border-y border-dashed border-app-border py-8 text-center">
                <Clock3 className="mx-auto size-5 text-app-muted" aria-hidden="true" />
                <p className="mt-3 font-black text-app-foreground">Order pending</p>
                <p className="mt-1 text-sm text-app-muted">The league manager can set it before the window opens.</p>
            </div>
        );
    }

    const useTwoColumns = order.length > 7;
    const splitAt = useTwoColumns ? Math.ceil(order.length / 2) : order.length;
    const columns = useTwoColumns
        ? [order.slice(0, splitAt), order.slice(splitAt)]
        : [order];
    const nextUserPick = order.find((pick) => pick.isCurrentUser);

    return (
        <div className="mt-7">
            {nextUserPick && (
                <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-app-accent-border pb-3" role="status">
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-muted">Your next pick</span>
                    <strong className="text-xl font-black tabular-nums text-app-accent sm:text-2xl">#{nextUserPick.pickNumber}</strong>
                </div>
            )}

            <div className={`grid gap-x-10 ${useTwoColumns ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                {columns.map((column, columnIndex) => (
                    <ol key={columnIndex} className="relative border-t border-app-border before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-[linear-gradient(to_bottom,transparent,var(--app-accent-border),transparent)]">
                        {column.map((pick) => (
                            <li
                                key={pick.id}
                                aria-current={pick.isCurrentUser ? "step" : undefined}
                                className={`group relative grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center border-b py-3.5 transition-colors sm:py-4 ${pick.isCurrentUser
                                    ? "border-app-accent-border bg-[linear-gradient(90deg,color-mix(in_srgb,var(--app-accent)_12%,transparent),transparent_78%)]"
                                    : "border-app-border"
                                }`}
                            >
                                <span className="relative z-10 flex items-center gap-2 font-mono text-sm font-black tabular-nums text-app-accent-foreground">
                                    <span className={`relative grid size-2.5 place-items-center rounded-full ring-[3px] ring-app-background ${pick.isCurrentUser ? "bg-brand-cyan" : "bg-app-border"}`} aria-hidden="true">
                                        {pick.isCurrentUser && (
                                            <span className="absolute size-3 animate-ping rounded-full bg-brand-cyan/60 motion-reduce:animate-none" />
                                        )}
                                    </span>
                                    {pick.pickNumber}
                                </span>
                                <span className={`min-w-0 truncate text-sm font-bold sm:text-base ${pick.isCurrentUser ? "text-app-accent-foreground" : "text-app-foreground"}`}>
                                    {pick.managerName}
                                </span>
                                {pick.isCurrentUser && (
                                    <span className="ml-2 whitespace-nowrap text-[0.6rem] font-black uppercase tracking-[0.14em] text-brand-cyan sm:text-[0.65rem]">
                                        You
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                ))}
            </div>
        </div>
    );
}

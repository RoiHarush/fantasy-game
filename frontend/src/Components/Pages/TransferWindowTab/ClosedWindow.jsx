"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
    ArrowRightLeft,
    CalendarClock,
    Clock3,
    Play,
    Settings2,
    ShieldCheck,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
    getCountdownParts,
    getVisibleCountdownUnits,
} from "../../../features/status/model";
import {
    useOpenTransferWindow,
    useTransferOrder,
} from "../../../features/transfer-window/useTransferWindow";
import { formatAppDateTime, toAppTimestamp } from "../../../lib/dateTime";
import { Button } from "../../../shared/ui/Button";
import TurnOrderModal from "./TurnOrderModal";

function ClosedWindow({ user, users, nextGameweek }) {
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const orderQuery = useTransferOrder(user?.leagueId, nextGameweek?.id);
    const openWindow = useOpenTransferWindow(user?.leagueId, nextGameweek?.id, {
        onSuccess: () => {
            setIsConfirmOpen(false);
        },
    });

    const currentOrder = (orderQuery.data ?? []).map((id) => (
        users.find((item) => String(item.id) === String(id))?.name ?? `User ${id}`
    ));
    const useTwoOrderColumns = currentOrder.length > 7;
    const orderSplitIndex = useTwoOrderColumns ? Math.ceil(currentOrder.length / 2) : currentOrder.length;
    const orderColumns = useTwoOrderColumns
        ? [currentOrder.slice(0, orderSplitIndex), currentOrder.slice(orderSplitIndex)]
        : [currentOrder];
    const transferWindowOpens = formatAppDateTime(nextGameweek?.transferOpenTime);

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 px-3 py-5 text-app-foreground sm:space-y-7 sm:px-6 sm:py-9 lg:py-12">
            <section className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel sm:rounded-3xl">
                <div className="h-1 w-full bg-component-gradient sm:h-1.5" aria-hidden="true" />
                <div className="relative p-4 sm:px-7 sm:py-6">
                    <div className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-app-accent-surface blur-3xl" aria-hidden="true" />
                    <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-7">
                        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground shadow-sm sm:size-12 sm:rounded-2xl">
                                <Clock3 aria-hidden="true" className="size-5 sm:size-6" strokeWidth={2.2} />
                            </span>
                            <div className="min-w-0">
                                <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-app-border bg-app-surface-muted px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-app-muted sm:text-[0.68rem]">
                                    <ShieldCheck aria-hidden="true" size={12} />
                                    Transfers paused
                                </div>
                                <h1 className="text-xl font-black tracking-tight text-app-foreground sm:text-3xl">
                                    Transfer window is closed
                                </h1>
                                <p className="mt-1 max-w-2xl text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                                    Review the next selection order and be ready when transfers reopen.
                                </p>
                            </div>
                        </div>

                        <TransferWindowCountdown
                            value={nextGameweek?.transferOpenTime}
                            formattedValue={transferWindowOpens}
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel sm:rounded-3xl">
                <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-7 sm:py-5">
                    <span className="grid size-10 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                        <ArrowRightLeft aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-extrabold leading-5 text-app-foreground sm:text-xl sm:leading-7">Upcoming transfer order</h2>
                        <p className="mt-0.5 text-[0.7rem] leading-4 text-app-muted sm:text-sm sm:leading-5">Picks are shown in the exact order they will be played.</p>
                    </div>
                    {nextGameweek?.id && (
                        <span className="whitespace-nowrap rounded-full border border-app-accent-border bg-app-accent-surface px-2.5 py-1 text-[0.65rem] font-extrabold text-app-accent-foreground sm:px-3 sm:text-xs">
                            GW {nextGameweek.id}
                        </span>
                    )}
                </header>

                <div className="p-3.5 sm:p-6">
                    {orderQuery.isPending ? (
                        <div className="grid min-h-40 place-items-center" role="status">
                            <div className="text-center">
                                <span className="mx-auto block size-8 animate-spin rounded-full border-3 border-app-border border-t-app-accent" aria-hidden="true" />
                                <p className="mt-3 text-sm font-semibold text-app-muted">Loading transfer order…</p>
                            </div>
                        </div>
                    ) : orderQuery.error ? (
                        <p className="rounded-2xl border border-app-danger-border bg-app-danger-surface p-5 text-center text-sm font-semibold text-app-danger-foreground" role="alert">
                            Transfer order could not be loaded.
                        </p>
                    ) : currentOrder.length > 0 ? (
                        <div className={`grid gap-3 ${useTwoOrderColumns ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                            {orderColumns.map((column, columnIndex) => {
                                const offset = columnIndex === 0 ? 0 : orderSplitIndex;
                                return (
                                    <ol key={columnIndex} start={offset + 1} className="space-y-2.5">
                                        {column.map((name, index) => {
                                            const pickNumber = offset + index + 1;
                                            return (
                                                <li
                                                    key={`${pickNumber}-${name}`}
                                                    className="group flex min-w-0 items-center gap-3 rounded-xl border border-app-border bg-app-surface-elevated px-3 py-2.5 transition hover:border-app-accent-border hover:bg-app-accent-hover sm:rounded-2xl sm:px-4 sm:py-3"
                                                >
                                                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-app-surface-muted text-xs font-black text-app-accent-foreground ring-1 ring-app-border">
                                                        {pickNumber}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate text-left text-sm font-bold text-app-foreground sm:text-base">
                                                        {name}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-5 py-10 text-center">
                            <Settings2 className="mx-auto text-app-muted" aria-hidden="true" size={28} />
                            <p className="mt-3 font-extrabold text-app-foreground">Transfer order is not ready yet</p>
                            <p className="mt-1 text-sm text-app-muted">The league manager can set the order before opening the window.</p>
                        </div>
                    )}
                </div>
            </section>

            {user?.leagueAdmin && (
                <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="text-left">
                        <p className="text-sm font-extrabold text-app-foreground">League controls</p>
                        <p className="text-xs text-app-muted">Adjust the picks or open the window ahead of schedule.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:flex">
                        <Button
                            variant="secondary"
                            className="border-app-border bg-app-surface-muted text-app-foreground hover:bg-app-accent-hover"
                            onClick={() => setIsOrderModalOpen(true)}
                        >
                            <Settings2 aria-hidden="true" size={17} />
                            Manage order
                        </Button>
                        <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                            <Play aria-hidden="true" size={17} fill="currentColor" />
                            Open now
                        </Button>
                    </div>
                </section>
            )}

            {isOrderModalOpen && <TurnOrderModal onClose={() => setIsOrderModalOpen(false)} usersList={users} />}

            <Dialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed bottom-0 left-1/2 z-[5001] max-h-[92dvh] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-t-3xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none sm:top-1/2 sm:bottom-auto sm:w-[min(calc(100vw-1.5rem),27rem)] sm:-translate-y-1/2 sm:rounded-3xl">
                        <div className="h-1.5 bg-component-gradient" aria-hidden="true" />
                        <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                            <Dialog.Close asChild>
                                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-app-muted hover:bg-app-accent-hover hover:text-app-foreground" aria-label="Close confirmation">
                                    <X aria-hidden="true" size={20} />
                                </Button>
                            </Dialog.Close>
                            <span className="grid size-10 place-items-center rounded-xl bg-app-danger-surface text-app-danger-foreground ring-1 ring-app-danger-border sm:size-12 sm:rounded-2xl">
                                <Play aria-hidden="true" size={20} fill="currentColor" />
                            </span>
                            <Dialog.Title className="mt-4 pr-10 text-lg font-black sm:mt-5 sm:text-2xl">Open the window now?</Dialog.Title>
                            <Dialog.Description className="mt-2 text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                                This starts the transfer order immediately. All managers will be notified and the first pick can begin.
                            </Dialog.Description>
                            {openWindow.error && (
                                <p className="mt-4 rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-sm text-app-danger-foreground" role="alert">
                                    {openWindow.error.message}
                                </p>
                            )}
                            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
                                <Dialog.Close asChild>
                                    <Button variant="secondary" className="border-app-border bg-app-surface-muted text-app-foreground hover:bg-app-accent-hover">
                                        Cancel
                                    </Button>
                                </Dialog.Close>
                                <Button variant="danger" onClick={() => openWindow.mutate()} disabled={openWindow.isPending}>
                                    {openWindow.isPending ? "Opening…" : "Open window"}
                                </Button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </main>
    );
}

function TransferWindowCountdown({ value, formattedValue }) {
    const [now, setNow] = useState(null);
    const targetTime = toAppTimestamp(value);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setNow(Date.now()));
        const timer = window.setInterval(() => setNow(Date.now()), 1_000);

        return () => {
            window.cancelAnimationFrame(frame);
            window.clearInterval(timer);
        };
    }, []);

    const hasScheduledOpening = Number.isFinite(targetTime);
    const isElapsed = hasScheduledOpening && now !== null && targetTime <= now;
    const parts = hasScheduledOpening && now !== null
        ? getCountdownParts(targetTime, now)
        : null;
    const visibleUnits = parts ? getVisibleCountdownUnits(parts) : [];
    const readableTime = visibleUnits
        .map(([key, label]) => `${parts[key]}${label}`)
        .join(", ");

    return (
        <div className="rounded-xl border border-app-border bg-app-surface-elevated p-3 shadow-sm sm:rounded-2xl sm:px-4 lg:min-w-[22rem]">
            <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-component-gradient text-brand-ink sm:rounded-xl">
                    <CalendarClock aria-hidden="true" className="size-4 sm:size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-app-muted sm:text-[0.65rem]">
                        Next window
                    </p>
                    <p className="truncate text-xs font-extrabold text-app-foreground sm:text-sm">
                        {formattedValue || "Not scheduled yet"}
                    </p>
                </div>
            </div>

            {hasScheduledOpening && now !== null && (
                <div
                    className="mt-3 border-t border-app-border pt-2.5"
                    role="timer"
                    aria-live="off"
                    aria-label={isElapsed ? "Transfer window is opening" : `${readableTime} until the transfer window opens`}
                >
                    <p className="mb-1.5 text-[0.65rem] font-bold text-app-muted sm:text-xs">
                        {isElapsed ? "Opening now" : "Opens in"}
                    </p>
                    {!isElapsed && (
                        <div className="flex w-full min-w-0 items-center gap-1.5">
                            {visibleUnits.map(([key, label]) => (
                                <span key={key} className="inline-flex min-w-0 flex-1 items-baseline justify-center gap-0.5 rounded-lg bg-app-surface px-1.5 py-1.5 ring-1 ring-app-border">
                                    <strong className="text-sm leading-none font-black tabular-nums text-app-accent sm:text-base">
                                        {String(parts[key]).padStart(2, "0")}
                                    </strong>
                                    <span className="text-[0.55rem] font-bold uppercase text-app-muted">
                                        {label}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ClosedWindow;

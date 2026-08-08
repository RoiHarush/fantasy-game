"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    useOpenTransferWindow,
    useTransferOrder,
} from "../../../features/transfer-window/useTransferWindow";
import { formatAppDateTime } from "../../../lib/dateTime";
import { Button } from "../../../shared/ui/Button";
import Style from "../../../Styles/ClosedWindow.module.css";
import TurnOrderModal from "./TurnOrderModal";

function ClosedWindow({ user, users, nextGameweek }) {
    const router = useRouter();
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
        <div className={Style.closedWindow}>
            <h2 className={Style.title}>Transfer Window</h2>
            <p className={Style.message}>The transfer window is currently closed.</p>

            {nextGameweek && (
                <>
                    <p className={Style.message}>The window will open in:</p>
                    <p>{transferWindowOpens || "Schedule not available"}</p>
                </>
            )}

            <section className={`mx-auto my-5 w-full rounded-xl bg-[#1b1035] p-6 ${useTwoOrderColumns ? "max-w-xl" : "max-w-sm"}`}>
                <h3 className="mb-4 border-b border-white/10 pb-2 text-center text-lg font-bold text-brand-cyan">
                    Upcoming Transfer Order (GW {nextGameweek?.id})
                </h3>
                {orderQuery.isPending ? (
                    <p className="p-3 text-center text-sm text-slate-400" role="status">Loading transfer order…</p>
                ) : orderQuery.error ? (
                    <p className="p-3 text-center text-sm text-red-300" role="alert">Transfer order could not be loaded.</p>
                ) : currentOrder.length > 0 ? (
                    <div className={`mt-3 grid gap-3 ${useTwoOrderColumns ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                        {orderColumns.map((column, columnIndex) => {
                            const offset = columnIndex === 0 ? 0 : orderSplitIndex;
                            return (
                                <ol key={columnIndex} start={offset + 1} className="space-y-2">
                                    {column.map((name, index) => (
                                        <li key={`${offset + index}-${name}`} className="flex min-w-56 justify-between gap-5 rounded-md border-l-3 border-emerald-500 bg-white/5 px-3 py-2 text-sm text-white">
                                            <span className="w-6 text-slate-400">{offset + index + 1}.</span>
                                            <span className="font-medium">{name}</span>
                                        </li>
                                    ))}
                                </ol>
                            );
                        })}
                    </div>
                ) : (
                    <p className="p-3 text-center text-sm italic text-slate-400">Transfer order hasn&apos;t been set yet.</p>
                )}
            </section>

            <Button className={Style.scoutButton} onClick={() => router.push("/scout")}>Go to Scout and build your Watchlist</Button>

            {user?.leagueAdmin && (
                <div className="mt-8 flex w-full justify-center gap-4">
                    <Button variant="secondary" onClick={() => setIsOrderModalOpen(true)}>Manage Transfer Order</Button>
                    <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>Open Window NOW</Button>
                </div>
            )}

            {isOrderModalOpen && <TurnOrderModal onClose={() => setIsOrderModalOpen(false)} usersList={users} />}

            <Dialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,25rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700 bg-slate-800 p-7 text-center text-white shadow-2xl focus:outline-none">
                        <Dialog.Title className="text-2xl font-bold">Are you sure?</Dialog.Title>
                        <Dialog.Description className="mt-3 leading-6 text-slate-300">
                            You are about to open the transfer window immediately. All managers will be able to start making transfers.
                        </Dialog.Description>
                        {openWindow.error && <p className="mt-4 text-sm text-red-300" role="alert">{openWindow.error.message}</p>}
                        <div className="mt-7 flex justify-center gap-3">
                            <Dialog.Close asChild><Button variant="ghost" className="text-slate-200 hover:bg-slate-700">Cancel</Button></Dialog.Close>
                            <Button variant="danger" onClick={() => openWindow.mutate()} disabled={openWindow.isPending}>
                                {openWindow.isPending ? "Opening…" : "Yes, open it"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

export default ClosedWindow;

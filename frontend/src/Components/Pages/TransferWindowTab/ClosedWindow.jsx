"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { queryKeys } from "../../../lib/query/keys";
import { apiRequest } from "../../../services/apiClient";
import { fetchAllUsers } from "../../../services/usersService";
import { Button } from "../../../shared/ui/Button";
import Style from "../../../Styles/ClosedWindow.module.css";
import TurnOrderModal from "./TurnOrderModal";

function parseDateArray(dateArray) {
    if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
    return new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]);
}

function ClosedWindow() {
    const { nextGameweek } = useGameweek();
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const usersQuery = useQuery({
        queryKey: queryKeys.leagueUsers(user?.leagueId),
        queryFn: fetchAllUsers,
        enabled: Boolean(user?.leagueId),
        staleTime: 60_000,
    });
    const orderKey = queryKeys.transferOrder(user?.leagueId, nextGameweek?.id);
    const orderQuery = useQuery({
        queryKey: orderKey,
        queryFn: () => apiRequest(`/api/market/turn-order/${nextGameweek.id}`),
        enabled: Boolean(user?.leagueId && nextGameweek?.id),
    });
    const openWindow = useMutation({
        mutationFn: () => apiRequest(`/api/market/open/${nextGameweek.id}`, { method: "POST" }),
        onSuccess: async () => {
            setIsConfirmOpen(false);
            await queryClient.invalidateQueries({ queryKey: queryKeys.transferWindow(user.leagueId) });
            router.refresh();
        },
    });

    const users = usersQuery.data ?? [];
    const usersById = new Map(users.map(item => [item.id, item]));
    const currentOrder = (orderQuery.data ?? []).map(id => usersById.get(id)?.name ?? `User ${id}`);
    const useTwoOrderColumns = currentOrder.length > 7;
    const orderSplitIndex = useTwoOrderColumns ? Math.ceil(currentOrder.length / 2) : currentOrder.length;
    const orderColumns = useTwoOrderColumns
        ? [currentOrder.slice(0, orderSplitIndex), currentOrder.slice(orderSplitIndex)]
        : [currentOrder];
    const transferWindowOpens = nextGameweek?.transferOpenTime
        ? parseDateArray(nextGameweek.transferOpenTime)
        : new Date();

    return (
        <div className={Style.closedWindow}>
            <h2 className={Style.title}>Transfer Window</h2>
            <p className={Style.message}>The transfer window is currently closed.</p>

            {nextGameweek && (
                <>
                    <p className={Style.message}>The window will open in:</p>
                    <span>{formatDateTime(transferWindowOpens)}</span>
                </>
            )}

            <section className={`mx-auto my-5 w-full rounded-xl bg-[#1b1035] p-6 ${useTwoOrderColumns ? "max-w-xl" : "max-w-sm"}`}>
                <h3 className="mb-4 border-b border-white/10 pb-2 text-center text-lg font-bold text-brand-cyan">
                    Upcoming Transfer Order (GW {nextGameweek?.id})
                </h3>
                {orderQuery.isPending || usersQuery.isPending ? (
                    <p className="p-3 text-center text-sm text-slate-400" role="status">Loading transfer order…</p>
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

function formatDateTime(date) {
    if (!date) return "";
    const dateStr = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).replace(/,/g, "");
    const timeStr = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jerusalem",
    });
    return <p>{dateStr} {timeStr}</p>;
}

export default ClosedWindow;

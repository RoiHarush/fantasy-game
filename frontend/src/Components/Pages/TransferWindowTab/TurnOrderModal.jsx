"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import {
    useSaveTransferOrder,
    useTransferOrder,
} from "../../../features/transfer-window/useTransferWindow";
import { Button } from "../../../shared/ui/Button";

export default function TurnOrderModal({ onClose, usersList }) {
    const { nextGameweek } = useGameweek();
    const { user } = useAuth();
    const pickCount = usersList.length * 2;
    const [editedPicks, setEditedPicks] = useState(null);
    const orderQuery = useTransferOrder(user?.leagueId, nextGameweek?.id);
    const initialPicks = Array.from({ length: pickCount }, (_, index) => (
        index < (orderQuery.data?.length ?? 0) ? String(orderQuery.data[index]) : ""
    ));
    const picks = editedPicks ?? initialPicks;
    const saveOrder = useSaveTransferOrder(user?.leagueId, nextGameweek?.id, {
        onSuccess: onClose,
    });

    const handleUserSelect = (index, userId) => {
        setEditedPicks(picks.map((pick, pickIndex) => (
            pickIndex === index ? userId : pick
        )));
    };

    const handleSave = async () => {
        const cleanOrder = picks.filter(Boolean).map(Number);

        if (cleanOrder.length === 0
            && !window.confirm("You are saving an empty list. This will clear the transfer order. Continue?")) {
            return;
        }

        saveOrder.mutate(cleanOrder);
    };

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(95vw,38rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-slate-700 bg-slate-800 p-8 text-slate-100 shadow-2xl focus:outline-none">
                    <div className="border-b border-slate-600 pb-4 text-center">
                        <Dialog.Title className="text-2xl font-bold">
                            Set Transfer Order (GW {nextGameweek?.id})
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-slate-400">
                            Two transfer rounds are generated from the current league membership.
                        </Dialog.Description>
                    </div>

                    <Dialog.Close asChild>
                        <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-300 hover:bg-slate-700 hover:text-white" aria-label="Close">
                            <X aria-hidden="true" />
                        </Button>
                    </Dialog.Close>

                    <div className="my-6 min-h-20 flex-1 space-y-2 overflow-y-auto pr-2">
                        {orderQuery.isPending ? (
                            <p className="py-8 text-center text-slate-400" role="status">Loading transfer order…</p>
                        ) : picks.length === 0 ? (
                            <p className="py-8 text-center text-slate-400">No league members are available.</p>
                        ) : picks.map((selectedUserId, index) => (
                            <label key={index} className="flex items-center gap-4 rounded-lg border border-slate-600 bg-slate-700 p-3">
                                <span className="w-20 shrink-0 font-semibold text-slate-300">Pick #{index + 1}</span>
                                <select
                                    className="min-w-0 flex-1 rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-white outline-none focus:border-brand-cyan focus:ring-3 focus:ring-brand-cyan/30"
                                    value={selectedUserId}
                                    onChange={(event) => handleUserSelect(index, event.target.value)}
                                >
                                    <option value="">Select user</option>
                                    {usersList.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}{user.fantasyTeam ? ` (${user.fantasyTeam})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-600 pt-4">
                        <Dialog.Close asChild>
                            <Button variant="danger" disabled={saveOrder.isPending}>Cancel</Button>
                        </Dialog.Close>
                        <Button onClick={handleSave} disabled={orderQuery.isPending || saveOrder.isPending || picks.length === 0}>
                            {saveOrder.isPending ? "Saving…" : "Save Order"}
                        </Button>
                    </div>
                    {saveOrder.error && <p className="mt-3 text-right text-sm text-red-300" role="alert">{saveOrder.error.message}</p>}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

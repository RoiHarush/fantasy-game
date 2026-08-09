"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownUp, Save, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import {
    useSaveTransferOrder,
    useTransferOrder,
} from "../../../features/transfer-window/useTransferWindow";
import { validateTransferOrder } from "../../../features/transfer-window/model";
import { Button } from "../../../shared/ui/Button";

export default function TurnOrderModal({ onClose, usersList }) {
    const { nextGameweek } = useGameweek();
    const { user } = useAuth();
    const pickCount = usersList.length * 2;
    const [editedPicks, setEditedPicks] = useState(null);
    const [validationError, setValidationError] = useState("");
    const orderQuery = useTransferOrder(user?.leagueId, nextGameweek?.id);
    const initialPicks = Array.from({ length: pickCount }, (_, index) => (
        index < (orderQuery.data?.length ?? 0) ? String(orderQuery.data[index]) : ""
    ));
    const picks = editedPicks ?? initialPicks;
    const saveOrder = useSaveTransferOrder(user?.leagueId, nextGameweek?.id, {
        onSuccess: onClose,
    });

    const handleUserSelect = (index, userId) => {
        setValidationError("");
        setEditedPicks(picks.map((pick, pickIndex) => (
            pickIndex === index ? userId : pick
        )));
    };

    const handleSave = () => {
        const cleanOrder = picks.filter(Boolean).map(Number);
        const nextValidationError = validateTransferOrder(
            cleanOrder,
            usersList.map((item) => item.id),
            2,
            false,
        );
        if (nextValidationError) {
            setValidationError(nextValidationError);
            return;
        }

        saveOrder.mutate(cleanOrder);
    };

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm" />
                <Dialog.Content className="fixed bottom-0 left-1/2 z-[5001] flex max-h-[92dvh] w-full max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none sm:top-1/2 sm:bottom-auto sm:w-[min(calc(100vw-2rem),38rem)] sm:-translate-y-1/2 sm:rounded-3xl">
                    <form
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSave();
                        }}
                    >
                    <div className="h-1.5 shrink-0 bg-component-gradient" aria-hidden="true" />
                    <div className="relative border-b border-app-border bg-app-surface-muted px-5 py-4 pr-14 sm:px-7 sm:py-5">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                                <ArrowDownUp aria-hidden="true" size={19} />
                            </span>
                            <div className="min-w-0">
                                <Dialog.Title className="text-lg font-black sm:text-2xl">
                                    Transfer order <span className="whitespace-nowrap text-app-accent">GW {nextGameweek?.id}</span>
                                </Dialog.Title>
                                <Dialog.Description className="mt-0.5 text-xs leading-5 text-app-muted sm:mt-1 sm:text-sm">
                            Reassign existing picks after trades. The total number of picks stays unchanged.
                                </Dialog.Description>
                            </div>
                        </div>
                    </div>

                    <Dialog.Close asChild>
                        <Button variant="ghost" size="icon" className="absolute right-3 top-3.5 z-10 text-app-muted hover:bg-app-accent-hover hover:text-app-foreground sm:right-4 sm:top-5" aria-label="Close">
                            <X aria-hidden="true" size={20} />
                        </Button>
                    </Dialog.Close>

                    <div className="min-h-20 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                        {orderQuery.isPending ? (
                            <p className="py-8 text-center text-app-muted" role="status">Loading transfer order…</p>
                        ) : picks.length === 0 ? (
                            <p className="py-8 text-center text-app-muted">No league members are available.</p>
                        ) : picks.map((selectedUserId, index) => (
                            <label key={index} className="grid grid-cols-[3.1rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-app-border bg-app-surface px-2.5 py-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3">
                                <span className="text-center text-xs font-black text-app-accent-foreground sm:text-left sm:text-sm">#{index + 1}</span>
                                <select
                                    className="min-w-0 rounded-lg border border-app-border bg-app-surface-elevated px-2.5 py-2 text-xs font-semibold text-app-foreground outline-none transition focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface sm:px-3 sm:text-sm"
                                    value={selectedUserId}
                                    onChange={(event) => handleUserSelect(index, event.target.value)}
                                >
                                    <option value="">Select user</option>
                                    {usersList.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}{user.fantasyTeamName ? ` (${user.fantasyTeamName})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>

                    {(validationError || orderQuery.error || saveOrder.error) && (
                        <p className="mx-4 mb-3 rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-xs font-semibold text-app-danger-foreground sm:mx-6 sm:text-sm" role="alert">
                            {validationError || orderQuery.error?.message || saveOrder.error?.message}
                        </p>
                    )}
                    <div className="grid shrink-0 grid-cols-2 gap-2.5 border-t border-app-border bg-app-surface-muted px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="border-app-border bg-app-surface text-app-foreground hover:bg-app-accent-hover" disabled={saveOrder.isPending}>Cancel</Button>
                        </Dialog.Close>
                        <Button type="submit" disabled={orderQuery.isPending || saveOrder.isPending || picks.length === 0}>
                            <Save aria-hidden="true" size={16} />
                            {saveOrder.isPending ? "Saving…" : "Save order"}
                        </Button>
                    </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

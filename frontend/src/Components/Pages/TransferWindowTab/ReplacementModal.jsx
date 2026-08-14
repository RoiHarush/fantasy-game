"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowRightLeft, Check, LockKeyhole } from "@/src/shared/ui/icons";
import { useMemo } from "react";

import { getFixtureItems } from "../../../features/fixtures/model";
import { useSquad } from "../../../features/squad/useSquad";
import { useTransferPlayer } from "../../../features/transfer-window/useTransferWindow";
import { getReplacementBlockReason } from "../../../features/transfer-window/model";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";
import PlayerKit from "../../General/PlayerKit";

function ReplacementModal({ playerIn, user, onClose, players, fixturesByTeam, nextGameweek, previewMode = false, previewSquad = null }) {
    const squadQuery = useSquad(user?.id, nextGameweek?.id, { enabled: !previewMode });
    const squad = previewSquad ?? squadQuery.data;
    const { replacementChoices } = useMemo(() => {
        if (!playerIn) return { replacementChoices: [] };
        const lineupIds = Object.values(squad?.startingLineup || {}).flat();
        const benchIds = Object.values(squad?.bench || {});
        const squadIds = [...lineupIds, ...benchIds];
        const roster = squadIds
            .map((id) => (players ?? []).find((player) => String(id) === String(player.id)))
            .filter(Boolean);
        const choices = roster
            .filter((player) => String(player.id) !== String(playerIn.id) && player.position === playerIn.position)
            .map((player) => ({
                player,
                blockReason: getReplacementBlockReason({ playerIn, playerOut: player, squadPlayers: roster }),
            }));
        return { squadPlayers: roster, replacementChoices: choices };
    }, [playerIn, players, squad]);
    const transfer = useTransferPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        gameweekId: nextGameweek?.id,
        playerInId: playerIn?.id,
        onSuccess: onClose,
    });

    if (!playerIn) return null;

    const loading = !previewMode && squadQuery.isPending;
    const loadError = !previewMode && squadQuery.error;
    const eligibleChoiceCount = replacementChoices.filter((choice) => !choice.blockReason).length;

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-2rem),44rem)]" aria-label="Select player to replace">
                <div className="flex max-h-[calc(92dvh-0.75rem)] flex-col">
                    <header className="relative shrink-0 border-b border-app-border px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
                        <Dialog.Close asChild>
                            <CloseButton className="absolute right-3 top-2" aria-label="Close replacement dialog" />
                        </Dialog.Close>
                        <div className="flex items-center gap-3 pr-12">
                            <span className="grid size-9 shrink-0 place-items-center text-app-accent-foreground">
                                <ArrowRightLeft className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-muted">Manual transfer</p>
                                <Dialog.Title className="truncate text-xl font-black tracking-tight sm:text-2xl">Choose who leaves</Dialog.Title>
                            </div>
                        </div>
                        <Dialog.Description className="mt-3 text-sm leading-5 text-app-muted">
                            Sign <strong className="text-emerald-600 dark:text-emerald-300">{playerIn.viewName}</strong> by replacing a player in the same position.
                        </Dialog.Description>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                        {loading ? (
                            <StatusMessage>Loading your squad…</StatusMessage>
                        ) : loadError || !squad ? (
                            <StatusMessage tone="error">{loadError?.message || "Could not load this squad."}</StatusMessage>
                        ) : (
                            <>
                                <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.15em] text-app-muted">Incoming player</p>
                                <PlayerChoiceRow
                                    player={playerIn}
                                    fixtures={getUpcomingFixtures(playerIn.teamId, fixturesByTeam, nextGameweek?.id)}
                                    incoming
                                />

                                <div className="my-3 flex items-center gap-3 text-app-muted" aria-hidden="true">
                                    <span className="h-px flex-1 bg-app-border" />
                                    <span className="grid size-8 place-items-center rounded-full border border-app-border bg-app-surface"><ArrowDown className="size-4" /></span>
                                    <span className="h-px flex-1 bg-app-border" />
                                </div>

                                <div className="mb-2 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-app-muted">Outgoing player</p>
                                        <h3 className="text-base font-black">Select one from your squad</h3>
                                    </div>
                                    <span className="text-xs font-bold text-app-muted">
                                        {eligibleChoiceCount} eligible / {replacementChoices.length} shown
                                    </span>
                                </div>

                                {transfer.error && <StatusMessage tone="error">{transfer.error.message || "Transfer failed on the server."}</StatusMessage>}

                                <div className="divide-y divide-app-border border-y border-app-border">
                                    {replacementChoices.length > 0 ? replacementChoices.map(({ player, blockReason }) => (
                                        <PlayerChoiceRow
                                            key={player.id}
                                            player={player}
                                            fixtures={getUpcomingFixtures(player.teamId, fixturesByTeam, nextGameweek?.id)}
                                            actionLabel={previewMode ? "Preview" : "Replace"}
                                            pending={transfer.isPending}
                                            blockReason={blockReason}
                                            onSelect={() => previewMode ? onClose() : transfer.mutate(player.id)}
                                        />
                                    )) : <StatusMessage>No players in this position are available to replace.</StatusMessage>}
                                </div>
                            </>
                        )}
                    </div>

                    <footer className="shrink-0 border-t border-app-border bg-app-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="w-full border-app-border bg-app-surface text-app-foreground hover:bg-app-surface-muted">Cancel transfer</Button>
                        </Dialog.Close>
                    </footer>
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

function PlayerChoiceRow({ player, fixtures, incoming = false, actionLabel, pending = false, blockReason, onSelect }) {
    return (
        <div className={`flex min-w-0 items-center gap-3 border-l-2 px-1 py-3 sm:px-2 ${incoming ? "border-emerald-400 bg-emerald-500/8" : "border-transparent"}`}>
            <PlayerKit
                teamId={player.teamId}
                type={player.position === "GK" ? "gk" : "field"}
                className="h-auto w-10 shrink-0 select-none sm:w-12"
            />
            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-2">
                    <strong className={`truncate text-sm sm:text-base ${incoming ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{player.viewName}</strong>
                    <span className="shrink-0 text-[0.65rem] font-black uppercase tracking-wide text-app-muted">{player.position}</span>
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-[0.68rem] font-bold text-app-muted sm:text-xs">
                    <span>{player.points ?? 0} pts</span>
                    {fixtures.map((fixture, index) => (
                        <span key={`${fixture}-${index}`} className="max-w-24 truncate">{fixture}</span>
                    ))}
                </div>
            </div>
            {incoming ? (
                <span className="grid size-9 shrink-0 place-items-center text-emerald-500"><Check className="size-4" aria-hidden="true" /></span>
            ) : blockReason ? (
                <span className="flex max-w-36 shrink-0 items-center gap-1.5 text-right text-[0.62rem] leading-4 font-bold text-app-danger-foreground sm:max-w-48 sm:text-xs">
                    <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
                    {blockReason}
                </span>
            ) : (
                <Button size="sm" className="shrink-0 px-3" onClick={onSelect} disabled={pending}>
                    {pending ? "Saving…" : actionLabel}
                </Button>
            )}
        </div>
    );
}

function StatusMessage({ children, tone = "neutral" }) {
    return (
        <p role={tone === "error" ? "alert" : "status"} className={`border-y px-4 py-5 text-center text-sm ${tone === "error" ? "border-red-400/40 text-red-700 dark:text-red-300" : "border-app-border text-app-muted"}`}>
            {children}
        </p>
    );
}

function getUpcomingFixtures(teamId, fixturesByTeam = {}, firstGameweekId) {
    if (!firstGameweekId) return [];
    return [0, 1, 2].flatMap((offset) => (
        getFixtureItems(fixturesByTeam?.[teamId]?.[firstGameweekId + offset]).map((fixture) => fixture.opponent)
    ));
}

export default ReplacementModal;

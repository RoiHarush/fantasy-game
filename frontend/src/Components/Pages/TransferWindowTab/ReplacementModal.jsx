"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo } from "react";

import { useSquad } from "../../../features/squad/useSquad";
import { useTransferPlayer } from "../../../features/transfer-window/useTransferWindow";
import { getFixtureItems } from "../../../features/fixtures/model";
import Style from "../../../Styles/TransferModal.module.css";
import PlayerKit from "../../General/PlayerKit";

function ReplacementModal({ playerIn, user, onClose, players, fixturesByTeam, nextGameweek, previewMode = false, previewSquad = null }) {
    const squadQuery = useSquad(user?.id, nextGameweek?.id);
    const squad = previewSquad ?? squadQuery.data;
    const samePositionPlayers = useMemo(() => {
        if (!playerIn) return [];
        const lineupIds = Object.values(squad?.startingLineup || {}).flat();
        const benchIds = Object.values(squad?.bench || {});
        const squadIds = [...lineupIds, ...benchIds];
        return players.filter((player) => (
            squadIds.some((id) => String(id) === String(player.id))
            && player.position === playerIn.position
        ));
    }, [playerIn, players, squad]);
    const transfer = useTransferPlayer({
        leagueId: user?.leagueId,
        userId: user?.id,
        gameweekId: nextGameweek?.id,
        playerInId: playerIn?.id,
        onSuccess: onClose,
    });

    function renderFixtureCell(teamId, offsetGameweek) {
        const gameweekId = (nextGameweek?.id || 0) + offsetGameweek;
        const fixtures = getFixtureItems(fixturesByTeam[teamId]?.[gameweekId]);
        if (fixtures.length === 0) return <td key={offsetGameweek} className={Style.hideOnMobile}>-</td>;
        return <td key={offsetGameweek} className={Style.hideOnMobile}>{fixtures.map((fixture) => fixture.opponent).join(" • ")}</td>;
    }

    if (!playerIn) return null;

    return (
        <Dialog.Root open onOpenChange={open => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className={Style.overlay} />
                <Dialog.Content className={Style.modal} aria-label="Select player to replace">
                    {!previewMode && squadQuery.isPending ? <p role="status">Loading squad data…</p> : (!previewMode && squadQuery.error) || !squad ? (
                        <>
                            <p role="alert">{squadQuery.error?.message || "Could not load squad for this user."}</p>
                            <Dialog.Close asChild><button type="button" className={Style.closeBtn}>Close</button></Dialog.Close>
                        </>
                    ) : (
                        <>
                            <h3>You have requested to sign <span className={Style.green}>{playerIn.viewName}</span>.</h3>
                            <div className={Style.section}>
                                <div className={Style.tableWrapper}>
                                    <table className={Style.table}>
                                        <thead><tr><th>Player</th><th>Points</th><th className={Style.hideOnMobile}>GW{nextGameweek?.id}</th><th className={Style.hideOnMobile}>GW{nextGameweek.id + 1}</th><th className={Style.hideOnMobile}>GW{nextGameweek.id + 2}</th><th /></tr></thead>
                                        <tbody><tr>
                                            <td className={Style.playerCell}><PlayerKit teamId={playerIn.teamId} type={playerIn.position === "GK" ? "gk" : "field"} className={Style["player-shirt"]} /><span>{playerIn.viewName}</span></td>
                                            <td>{playerIn.points}</td>
                                            {renderFixtureCell(playerIn.teamId, 0)}{renderFixtureCell(playerIn.teamId, 1)}{renderFixtureCell(playerIn.teamId, 2)}
                                            <td><Dialog.Close asChild><button type="button" className={Style.cancelBtnSmall}>Cancel</button></Dialog.Close></td>
                                        </tr></tbody>
                                    </table>
                                </div>
                            </div>

                            <h4 className={Style.subtitle}>Which player would you like <span className={Style.green}>{playerIn.viewName}</span> to replace?</h4>
                            {transfer.error && <p role="alert">{transfer.error.message || "Transfer failed on server"}</p>}
                            <div className={Style.section}>
                                <div className={Style.tableWrapper}>
                                    <table className={Style.table}>
                                        <thead><tr><th>Player</th><th>Points</th><th className={Style.hideOnMobile}>GW{nextGameweek.id}</th><th className={Style.hideOnMobile}>GW{nextGameweek.id + 1}</th><th className={Style.hideOnMobile}>GW{nextGameweek.id + 2}</th><th /></tr></thead>
                                        <tbody>
                                            {samePositionPlayers.length > 0 ? samePositionPlayers.map(player => (
                                                <tr key={player.id}>
                                                    <td className={Style.playerCell}><PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className={Style["player-shirt"]} /><span>{player.viewName}</span></td>
                                                    <td>{player.points}</td>
                                                    {renderFixtureCell(player.teamId, 0)}{renderFixtureCell(player.teamId, 1)}{renderFixtureCell(player.teamId, 2)}
                                                    <td><button type="button" className={Style.replaceBtn} onClick={() => previewMode ? onClose() : transfer.mutate(player.id)} disabled={transfer.isPending}>{transfer.isPending ? "Saving…" : previewMode ? "Preview" : "Replace"}</button></td>
                                                </tr>
                                            )) : <tr><td colSpan="6" className="text-center text-slate-400">No players in this position.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <Dialog.Close asChild><button type="button" className={Style.closeBtn}>Close</button></Dialog.Close>
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default ReplacementModal;

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import styles from "../../../Styles/WaiverScout.module.css";

export default function WaiverCandidateDialog({
    candidate,
    eligibleOutgoing,
    entries,
    onChange,
    saving,
    onClose,
}) {
    const [playerOutId, setPlayerOutId] = useState("");

    async function addPriority() {
        if (!playerOutId) return;

        const entry = {
            playerInId: candidate.id,
            playerOutId: Number(playerOutId),
        };
        const alreadyPlanned = entries.some(
            (item) => String(item.playerInId) === String(entry.playerInId)
                && String(item.playerOutId) === String(entry.playerOutId),
        );

        if (!alreadyPlanned) await onChange([...entries, entry]);
        onClose();
    }

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.modalBackdrop} />
                <Dialog.Content className={styles.modal}>
                    <Dialog.Title>Add {candidate.viewName} to waivers</Dialog.Title>
                    <Dialog.Description>
                        Choose the {candidate.position} player who should leave your squad.
                    </Dialog.Description>
                    <label>
                        Outgoing player
                        <select value={playerOutId} onChange={(event) => setPlayerOutId(event.target.value)}>
                            <option value="">Choose outgoing player</option>
                            {eligibleOutgoing.map((player) => (
                                <option key={player.id} value={player.id}>{player.viewName}</option>
                            ))}
                        </select>
                    </label>
                    <div className={styles.modalActions}>
                        <Dialog.Close asChild>
                            <button type="button">Cancel</button>
                        </Dialog.Close>
                        <button type="button" disabled={!playerOutId || saving} onClick={addPriority}>
                            {saving ? "Saving…" : "Add priority"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

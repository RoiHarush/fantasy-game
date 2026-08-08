"use client";

import { useState } from "react";

import { Button } from "../../../shared/ui/Button";
import styles from "../../../Styles/LeagueOnboarding.module.css";

export default function LeagueCreatedCard({ league, onContinue }) {
    const [copyStatus, setCopyStatus] = useState("idle");

    async function copyLeagueCode() {
        try {
            await navigator.clipboard.writeText(league.leagueCode);
            setCopyStatus("copied");
        } catch {
            setCopyStatus("failed");
        }
    }

    const copyLabel = copyStatus === "copied"
        ? "Code copied!"
        : copyStatus === "failed"
            ? "Copy failed — select the code above"
            : "Copy league code";

    return (
        <section className={styles.page} aria-labelledby="league-created-title">
            <div className={styles.card}>
                <p className={styles.eyebrow}>League created</p>
                <h1 id="league-created-title">Invite your managers</h1>
                <p>Share this code before the initial draft begins:</p>
                <div className="my-6 text-4xl font-extrabold tracking-[.16em]">{league.leagueCode}</div>
                <Button type="button" variant="secondary" onClick={copyLeagueCode}>
                    {copyLabel}
                </Button>
                <Button type="button" className={styles.submit} onClick={onContinue}>
                    Set up initial draft
                </Button>
            </div>
        </section>
    );
}

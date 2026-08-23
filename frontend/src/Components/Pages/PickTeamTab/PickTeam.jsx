import { useState } from "react";
import { Check } from "@/src/shared/ui/icons";

import FixturesTable from "../FixturesTab/FixturesTable";
import PickTeamBlock from "../../Blocks/PickTeamBlock";
import { usePlayers } from "../../../features/players/usePlayers";
import IRManager from "./IR/IRManager";
import FirstPickManager from "./FirstPickCaptain/FirstPickManager";
import GameweekChipManager from "./GameweekChip/GameweekChipManager";
import PitchWrapperBase from "../../General/Pitch/PitchWrapperBase";
import { PlayerInteractionProvider } from "../../../Context/PlayerInteractionProvider";
import { Button } from "../../../shared/ui/Button";
import AlexLineupDock from "../../AI/AlexLineupDock";
import AlexChipHint from "../../AI/AlexChipHint";
import { aiFeaturesEnabled, useAlexCoach } from "../../../features/ai/useAlexCoach";

function PickTeam({
    user,
    nextGameweek,
    gameweeks,
    squad,
    setSquad,
    chips,
    setChips,
    playerData,
    saveTeam,
    savePending,
    saveSucceeded,
    saveError,
    isDirty,
    setIsDirty,
    refreshPlayerData,
    readOnly = false,
    previewPlayers = null,
}) {
    const playersQuery = usePlayers();
    const players = previewPlayers ?? playersQuery.players;
    const coach = useAlexCoach(nextGameweek.id, !readOnly);
    const [alexPreviewActive, setAlexPreviewActive] = useState(false);
    const [alexCopyPending, setAlexCopyPending] = useState(false);
    const [alexChatOpen, setAlexChatOpen] = useState(false);
    const [alexQuestion, setAlexQuestion] = useState("");
    const alexAnalysis = coach.analysis;
    const alexBusy = coach.analyze.isPending || coach.ask.isPending;
    const alexError = coach.analyze.error || coach.ask.error || coach.error;
    const alexPreviewSquad = alexPreviewActive ? alexAnalysis?.recommendedSquad : null;
    const displayedSquad = alexPreviewSquad ?? squad;
    const captainIsFirstPick = squad.captainId != null
        && squad.firstPickId != null
        && String(squad.captainId) === String(squad.firstPickId);

    const handleSave = async () => {
        await saveTeam().catch(() => undefined);
    };

    const analyzeWithAlex = () => {
        setAlexPreviewActive(false);
        setAlexCopyPending(false);
        coach.analyze.mutate({ mode: "lineup", draftSquad: squad });
    };

    const confirmAlexCopy = () => {
        if (!alexAnalysis?.recommendedSquad) return;
        setSquad(alexAnalysis.recommendedSquad);
        setIsDirty(true);
        setAlexPreviewActive(false);
        setAlexCopyPending(false);
    };

    const sendAlexQuestion = async (event) => {
        event.preventDefault();
        if (!alexQuestion.trim()) return;
        await coach.ask.mutateAsync(alexQuestion.trim()).catch(() => undefined);
        setAlexQuestion("");
    };

    if (!previewPlayers && playersQuery.isPending) return <p role="status">Loading player data…</p>;
    if (!previewPlayers && playersQuery.error) return <p role="alert">Player data is temporarily unavailable.</p>;

    return (
        <div className="flex min-w-0 flex-col gap-5">
            <h3 className="mb-1 text-center text-xl font-bold text-[var(--app-foreground)] md:mb-5 md:text-left md:text-[1.6rem]">
                My Team – {nextGameweek.name}
            </h3>

            {readOnly && (
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-app-foreground">
                    Squad snapshot. Formation, captaincy and chips cannot be changed from observer mode.
                </div>
            )}

            {!readOnly && <div className="mx-auto mb-1 grid w-full max-w-[760px] grid-cols-1 gap-2 sm:grid-cols-2">
                {aiFeaturesEnabled && <AlexChipHint suggestion={alexAnalysis?.chipSuggestion} />}
                <IRManager
                    userId={user.id}
                    gameweekId={nextGameweek.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    transferWindowProcessed={nextGameweek.transferWindowProcessed}
                    refreshPlayerData={refreshPlayerData}
                    players={players}
                    hasUnsavedChanges={isDirty}
                    squadSavePending={savePending}
                />

                <FirstPickManager
                    userId={user.id}
                    gameweekId={nextGameweek.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    players={players}
                    hasUnsavedChanges={isDirty}
                    squadSavePending={savePending}
                />

                <GameweekChipManager
                    userId={user.id}
                    gameweekId={nextGameweek.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    chipName="TRIPLE_CAPTAIN"
                    chipSlug="triple-captain"
                    title="Triple Captain"
                    icon="/Icons/tcaptain-chip.svg"
                    description="Your captain will score triple points in the upcoming Gameweek instead of double."
                    hasUnsavedChanges={isDirty}
                    squadSavePending={savePending}
                    disabledReason={
                        (chips.active?.FIRST_PICK_CAPTAIN || captainIsFirstPick)
                            ? "Unavailable while your first-pick player is captain."
                            : ""
                    }
                />

                <GameweekChipManager
                    userId={user.id}
                    gameweekId={nextGameweek.id}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    chipName="BENCH_BOOST"
                    chipSlug="bench-boost"
                    title="Bench Boost"
                    icon="/Icons/bboost-chip.svg"
                    description="All four bench players will be included in your score for the upcoming Gameweek."
                    hasUnsavedChanges={isDirty}
                    squadSavePending={savePending}
                />
            </div>}

            <div className="relative flex w-full max-w-[1000px] flex-col gap-5">
                <div className="w-full">
                    <PlayerInteractionProvider
                        mode={readOnly || alexPreviewActive ? "points" : "pick"}
                        squad={displayedSquad}
                        setSquad={setSquad}
                        setIsDirty={setIsDirty}
                        players={players}
                        chips={chips}
                        user={user}
                        gameweek={nextGameweek}
                    >
                        <PitchWrapperBase
                            key={alexPreviewActive ? "alex-preview" : "manager-squad"}
                            squad={displayedSquad}
                            view="pick"
                            currentGw={nextGameweek.id}
                            playerData={playerData}
                            players={players}
                            block={
                                <PickTeamBlock
                                    gameweek={nextGameweek.id}
                                    kickoffTime={nextGameweek.firstKickoffTime}
                                />
                            }
                            previewActive={alexPreviewActive}
                            assistant={!readOnly && aiFeaturesEnabled ? <AlexLineupDock
                                analysis={alexAnalysis}
                                busy={alexBusy}
                                error={alexError}
                                previewActive={alexPreviewActive}
                                confirmCopy={alexCopyPending}
                                question={alexQuestion}
                                chatOpen={alexChatOpen}
                                onAnalyze={analyzeWithAlex}
                                onPreview={() => {
                                    setAlexPreviewActive(true);
                                    setAlexCopyPending(false);
                                }}
                                onCancelPreview={() => {
                                    setAlexPreviewActive(false);
                                    setAlexCopyPending(false);
                                }}
                                onRequestCopy={() => setAlexCopyPending(true)}
                                onConfirmCopy={confirmAlexCopy}
                                onCancelCopy={() => setAlexCopyPending(false)}
                                onChatOpenChange={setAlexChatOpen}
                                onQuestionChange={setAlexQuestion}
                                onQuestionSubmit={sendAlexQuestion}
                            /> : null}
                        />
                    </PlayerInteractionProvider>
                </div>

                {!readOnly && <div className="mt-4 flex flex-col items-center">
                    <Button
                        type="button"
                        variant="primary"
                        className="rounded-lg [background:var(--component-gradient)] px-5 py-2.5 font-bold text-[var(--color-brand-ink)] shadow-[0_8px_22px_color-mix(in_srgb,var(--app-accent)_28%,transparent)] hover:-translate-y-0.5 hover:brightness-110 disabled:bg-[var(--app-border)] disabled:text-[var(--app-muted)] disabled:shadow-none"
                        onClick={handleSave}
                        disabled={!isDirty || savePending}
                    >
                        {savePending ? "Saving…" : "Save Team"}
                    </Button>

                    {!isDirty && saveSucceeded && (
                        <div className="mx-auto mt-3 flex w-full max-w-[400px] items-center justify-center gap-2 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-surface-elevated)] p-3 text-center text-sm text-[var(--app-accent-foreground)] shadow-[0_6px_18px_color-mix(in_srgb,var(--app-foreground)_10%,transparent)] sm:text-base" role="status">
                            <span className="grid size-5 place-items-center rounded-full [background:var(--component-gradient)] text-[var(--color-brand-ink)]">
                                <Check className="size-3" aria-hidden="true" />
                            </span>
                            Your team has been saved
                        </div>
                    )}
                    {saveError && (
                        <p role="alert" className="mt-2 text-sm text-red-500">
                            {saveError.message || "Your team could not be saved."}
                        </p>
                    )}

                </div>}

                <div className="w-full">
                    <FixturesTable
                        gameweeks={gameweeks}
                        defaultGameweek={nextGameweek}
                    />
                </div>
            </div>
        </div>
    );
}

export default PickTeam;

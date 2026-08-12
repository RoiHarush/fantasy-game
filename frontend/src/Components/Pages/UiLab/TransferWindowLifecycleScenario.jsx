"use client";

import { CheckCircle2, CircleStop, Play, RotateCcw, StepForward, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import ClosedWindowView from "../TransferWindowTab/ClosedWindowView";
import TransferWindow from "../TransferWindowTab/TransferWindow";
import {
    buildClosedTransferOrder,
    buildTransferWindowPreview,
    buildWindowState,
} from "./transferPreviewData";

const PHASES = {
    CLOSED: "closed",
    OPENING: "opening",
    LIVE: "live",
    CLOSING: "closing",
};

const PHASE_LABELS = {
    [PHASES.CLOSED]: "Window closed",
    [PHASES.OPENING]: "Opening animation",
    [PHASES.LIVE]: "Window live",
    [PHASES.CLOSING]: "Closing grace period",
};

const MANAGER_COUNT_OPTIONS = Array.from({ length: 19 }, (_, index) => {
    const count = index + 2;
    return { value: count, label: `${count} managers` };
});

export default function TransferWindowLifecycleScenario({
    previewUser,
    previewUsers,
    players,
    teams,
    fixturesByTeam,
    nextGameweek,
    squad,
}) {
    const [managerCount, setManagerCount] = useState(7);
    const [phase, setPhase] = useState(PHASES.CLOSED);
    const [actions, setActions] = useState([]);
    const [turnIndex, setTurnIndex] = useState(0);
    const [latestEvent, setLatestEvent] = useState(null);
    const [isReplaying, setIsReplaying] = useState(false);
    const timersRef = useRef(new Set());
    const scenarioUsers = useMemo(
        () => buildScenarioUsers(previewUsers, previewUser, managerCount),
        [managerCount, previewUser, previewUsers],
    );
    const scenarioUser = scenarioUsers[0];
    const preview = useMemo(() => buildTransferWindowPreview({
        players,
        users: scenarioUsers,
        currentUser: scenarioUser,
        squad,
        nextGameweek,
    }), [nextGameweek, players, scenarioUser, scenarioUsers, squad]);
    const transferOrder = useMemo(
        () => buildClosedTransferOrder(scenarioUsers, scenarioUser.id),
        [scenarioUser.id, scenarioUsers],
    );
    const windowState = useMemo(() => buildWindowState({
        users: scenarioUsers,
        currentUser: scenarioUser,
        nextGameweek,
        actionCount: turnIndex,
    }), [nextGameweek, scenarioUser, scenarioUsers, turnIndex]);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach((timer) => window.clearTimeout(timer));
        timersRef.current.clear();
    }, []);
    const schedule = useCallback((callback, delay) => {
        const timer = window.setTimeout(() => {
            timersRef.current.delete(timer);
            callback();
        }, delay);
        timersRef.current.add(timer);
    }, []);
    useEffect(() => clearTimers, [clearTimers]);

    const reset = useCallback(() => {
        clearTimers();
        setActions([]);
        setTurnIndex(0);
        setLatestEvent(null);
        setPhase(PHASES.CLOSED);
        setIsReplaying(false);
    }, [clearTimers]);

    const openWindow = useCallback(() => {
        clearTimers();
        setActions([]);
        setTurnIndex(0);
        setLatestEvent(null);
        setIsReplaying(false);
        setPhase(PHASES.OPENING);
        schedule(() => setPhase(PHASES.LIVE), 700);
    }, [clearTimers, schedule]);

    const addSampleMove = useCallback(() => {
        const sample = preview.sampleActions[turnIndex % preview.sampleActions.length];
        if (!sample) return;
        const nextAction = { ...sample, id: `${sample.id}-${turnIndex + 1}` };
        setActions((current) => [...current, nextAction]);
        setLatestEvent(transferActionEvent(nextAction));
        setTurnIndex((current) => current + 1);
    }, [preview.sampleActions, turnIndex]);

    const passTurn = useCallback(() => {
        const currentManager = scenarioUsers.find((manager) => String(manager.id) === String(windowState.currentUserId));
        setLatestEvent({
            event: "turn_passed",
            userId: currentManager?.id,
            userName: currentManager?.name || currentManager?.fantasyTeamName || "Preview manager",
        });
        setTurnIndex((current) => current + 1);
    }, [scenarioUsers, windowState.currentUserId]);

    const closeWindow = useCallback(() => {
        clearTimers();
        setIsReplaying(false);
        const sample = preview.sampleActions[turnIndex % preview.sampleActions.length];
        if (sample) {
            const finalAction = { ...sample, id: `${sample.id}-final-${turnIndex + 1}` };
            setActions((current) => [...current, finalAction]);
            setLatestEvent(transferActionEvent(finalAction));
            setTurnIndex((current) => current + 1);
        }
        setPhase(PHASES.CLOSING);
        schedule(() => setPhase(PHASES.CLOSED), 5000);
    }, [clearTimers, preview.sampleActions, schedule, turnIndex]);

    const replay = useCallback(() => {
        clearTimers();
        setActions([]);
        setTurnIndex(0);
        setLatestEvent(null);
        setPhase(PHASES.CLOSED);
        setIsReplaying(true);
        schedule(() => setPhase(PHASES.OPENING), 500);
        schedule(() => setPhase(PHASES.LIVE), 1200);
        schedule(() => {
            const manager = scenarioUsers[0];
            setLatestEvent({ event: "turn_passed", userId: manager?.id, userName: manager?.name });
            setTurnIndex(1);
        }, 2300);
        schedule(() => {
            const action = preview.sampleActions[1 % preview.sampleActions.length];
            if (!action) return;
            setActions([{ ...action, id: `${action.id}-replay-1` }]);
            setLatestEvent(transferActionEvent(action));
            setTurnIndex(2);
        }, 3500);
        schedule(() => {
            const action = preview.sampleActions[2 % preview.sampleActions.length];
            if (action) {
                setActions((current) => [...current, { ...action, id: `${action.id}-replay-final` }]);
                setLatestEvent(transferActionEvent(action));
                setTurnIndex(3);
            }
            setPhase(PHASES.CLOSING);
        }, 4700);
        schedule(() => {
            setPhase(PHASES.CLOSED);
            setIsReplaying(false);
        }, 9700);
    }, [clearTimers, preview.sampleActions, scenarioUsers, schedule]);

    const changeManagerCount = useCallback((value) => {
        reset();
        setManagerCount(Number(value));
    }, [reset]);

    const isClosed = phase === PHASES.CLOSED;
    const isLive = phase === PHASES.LIVE;
    const isClosing = phase === PHASES.CLOSING;

    return (
        <div className="w-full text-app-foreground">
            <section className="sticky top-0 z-[120] border-b border-app-border bg-app-background/95 px-3 py-3 shadow-sm backdrop-blur sm:px-6">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className={`size-2.5 shrink-0 rounded-full ${isClosed ? "bg-app-muted" : isClosing ? "bg-amber-400" : "bg-emerald-400"}`} aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black sm:text-base">Transfer-window lifecycle</p>
                            <p className="text-xs text-app-muted">
                                {PHASE_LABELS[phase]} · Preview only — no server requests
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-44 items-center gap-2">
                            <Users className="size-4 shrink-0 text-app-accent" aria-hidden="true" />
                            <SelectField
                                value={managerCount}
                                onValueChange={changeManagerCount}
                                options={MANAGER_COUNT_OPTIONS}
                                ariaLabel="Preview manager count"
                                className="min-h-9 py-1.5"
                                disabled={!isClosed || isReplaying}
                            />
                        </div>
                        <Button size="sm" onClick={openWindow} disabled={!isClosed || isReplaying}>
                            <Play className="size-4" fill="currentColor" aria-hidden="true" /> Open
                        </Button>
                        <Button size="sm" variant="secondary" onClick={addSampleMove} disabled={!isLive || isReplaying}>
                            <StepForward className="size-4" aria-hidden="true" /> Add move
                        </Button>
                        <Button size="sm" variant="danger" onClick={closeWindow} disabled={!isLive || isReplaying}>
                            <CircleStop className="size-4" aria-hidden="true" /> Final move + close
                        </Button>
                        <Button size="sm" variant="secondary" onClick={replay} disabled={isReplaying}>
                            <RotateCcw className="size-4" aria-hidden="true" /> Replay full flow
                        </Button>
                        <Button size="sm" variant="ghost" onClick={reset}>
                            <CheckCircle2 className="size-4" aria-hidden="true" /> Reset
                        </Button>
                    </div>
                </div>
            </section>

            {isClosed ? (
                <ClosedWindowView
                    gameweekId={nextGameweek.id}
                    transferOpenTime={nextGameweek.transferOpenTime}
                    transferOrder={transferOrder}
                    orderPending={false}
                    orderError={null}
                    automaticAttendance={false}
                    attendancePending={false}
                    attendanceError={null}
                    isLeagueAdmin
                    onAttendanceChange={() => {}}
                    onManageOrder={() => {}}
                    onOpenWindow={openWindow}
                />
            ) : (
                <PageLayout
                    left={(
                        <TransferWindow
                            user={scenarioUser}
                            allUsers={scenarioUsers}
                            windowState={windowState}
                            nextGameweek={nextGameweek}
                            players={preview.windowPlayers}
                            teams={teams}
                            fixturesByTeam={fixturesByTeam}
                            isClosing={isClosing}
                            previewMode
                            previewSquad={squad}
                            previewTransferActions={actions}
                            previewLatestEvent={latestEvent}
                            previewOnPass={passTurn}
                        />
                    )}
                    right={(
                        <TransferUserSidebar
                            users={scenarioUsers}
                            currentUserId={windowState.currentUserId}
                            squad={squad}
                            players={preview.windowPlayers}
                            fixturesByTeam={fixturesByTeam}
                            nextGameweek={nextGameweek}
                        />
                    )}
                />
            )}
        </div>
    );
}

function buildScenarioUsers(baseUsers, currentUser, count) {
    const candidates = [currentUser, ...baseUsers]
        .filter(Boolean)
        .filter((manager, index, values) => values.findIndex((item) => String(item.id) === String(manager.id)) === index);
    const generatedNames = [
        "North London Manager",
        "Electric City Manager",
        "Long Name United Manager",
        "South Stand Manager",
        "Seven Hills Manager",
        "Midnight Football Manager",
        "Extra Time Manager",
    ];

    return Array.from({ length: count }, (_, index) => {
        const existing = candidates[index];
        if (existing) return { ...existing, leagueAdmin: index === 0 || existing.leagueAdmin };
        const number = index + 1;
        const name = generatedNames[index % generatedNames.length];
        return {
            id: `ui-lab-manager-${number}`,
            name: `${name} ${number}`,
            fantasyTeamName: `Preview FC ${number}`,
            leagueAdmin: false,
        };
    });
}

function transferActionEvent(action) {
    return {
        event: "transfer_done",
        userId: action.userId,
        userName: action.userName,
        playerInId: action.playerInId,
        playerOutId: action.playerOutId,
    };
}

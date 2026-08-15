"use client";

import { ArrowLeft } from "@/src/shared/ui/icons";
import { useMemo, useState } from "react";

import { Button } from "../../../shared/ui/Button";
import RouteError from "../../../shared/ui/RouteError";
import LoadingPage from "../../General/LoadingPage";
import NotFoundPage from "../NotFoundPage";
import { LeagueModeTabs, LeagueOnboardingShell, leagueInputClassName } from "../LeagueOnboarding/LeagueOnboardingUi";
import PageLayout from "../../PageLayout";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "../PointsTab/Points";
import { PreSeasonPointsState } from "../PointsTab/PointsPage";
import Status from "../StatusTab/Status";
import DraftLobbyView from "../DraftRoomTab/DraftLobbyView";
import ClosedWindowView from "../TransferWindowTab/ClosedWindowView";
import TransferWindow from "../TransferWindowTab/TransferWindow";
import TransferWindowLifecycleScenario from "./TransferWindowLifecycleScenario";
import {
    buildClosedTransferOrder,
    buildTransferWindowPreview,
    squadPlayerIds,
} from "./transferPreviewData";

const SCREEN_TITLES = {
    "screen-loading": "Application loading",
    "screen-gameweek-update": "Gameweek rollover",
    "screen-not-found": "Not found",
    "screen-server-error": "Internal server error",
    "screen-onboarding": "League onboarding",
    "screen-draft": "Active draft room",
    "screen-draft-closed": "Closed draft room",
    "screen-transfer": "Open transfer window",
    "screen-transfer-closed": "Closed transfer window",
    "screen-transfer-lifecycle": "Transfer-window lifecycle",
    "screen-points": "Regular-season points",
    "screen-points-closed": "Pre-season points",
    "screen-status": "Regular-season status",
};

export default function UiLabScreenPreview({ id, user, users, players, squad, onClose }) {
    const [onboardingMode, setOnboardingMode] = useState("create");
    const previewUser = {
        id: user?.id ?? users[0]?.id ?? 1,
        leagueId: user?.leagueId ?? 1,
        name: user?.name || "Roi Harush",
        fantasyTeamName: user?.fantasyTeamName || "Roi FC",
        leagueAdmin: true,
    };
    const previewUsers = users.map((manager, index) => ({
        ...manager,
        rank: index + 1,
        gwPoints: [71, 64, 59][index] ?? 48,
        points: [384, 371, 355][index] ?? 320,
    }));
    const previewLeague = { id: 1, name: "UI Lab League", users: previewUsers };
    const previewTeams = useMemo(() => buildTeams(players), [players]);
    const fixturesByTeam = useMemo(() => buildFixturesByTeam(previewTeams), [previewTeams]);
    const gameweeks = useMemo(() => buildGameweeks(), []);
    const currentGameweek = gameweeks[5];
    const nextGameweek = gameweeks[6];
    const completeSquad = useMemo(() => completePreviewSquad(squad, players), [players, squad]);
    const previewFixtures = useMemo(
        () => buildPreviewFixtures(previewTeams, currentGameweek.id),
        [currentGameweek.id, previewTeams],
    );
    const statusPreviewData = useMemo(
        () => buildStatusPreviewData(players, previewUsers, currentGameweek.id),
        [currentGameweek.id, players, previewUsers],
    );
    const previewDreamTeam = useMemo(() => buildPreviewDreamTeam(players), [players]);

    let content;
    if (id === "screen-loading") {
        content = <LoadingPage title="Preparing your matchday workspace" />;
    } else if (id === "screen-gameweek-update") {
        content = (
            <LoadingPage
                eyebrow="Gameweek rollover"
                title="Season update in progress"
                description="Scores, squads and league standings are being finalized. The app will unlock automatically when the update is complete."
            />
        );
    } else if (id === "screen-not-found") {
        content = <NotFoundPage />;
    } else if (id === "screen-server-error") {
        content = <RouteError reset={() => {}} />;
    } else if (id === "screen-onboarding") {
        content = (
            <LeagueOnboardingShell
                eyebrow="Welcome to Fantasy Draft"
                title="Choose your league"
                intro="Create a league for your group or join one using a code from a friend."
                labelledBy="preview-league-onboarding-title"
            >
                <LeagueModeTabs mode={onboardingMode} onChange={setOnboardingMode} />
                <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
                    <label className="grid gap-1.5 text-sm font-bold">
                        {onboardingMode === "create" ? "League name" : "League code"}
                        <input className={leagueInputClassName} defaultValue={onboardingMode === "create" ? "UI Lab League" : "DRAFT26"} />
                    </label>
                    {onboardingMode === "create" && (
                        <label className="grid gap-1.5 text-sm font-bold">
                            Maximum participants
                            <input className={leagueInputClassName} type="number" defaultValue="7" />
                        </label>
                    )}
                    <label className="grid gap-1.5 text-sm font-bold">
                        Fantasy team name
                        <input className={leagueInputClassName} defaultValue="Roi FC" />
                    </label>
                    <Button type="submit" className="w-full sm:w-auto sm:justify-self-start">
                        {onboardingMode === "create" ? "Create league" : "Join league"}
                    </Button>
                </form>
            </LeagueOnboardingShell>
        );
    } else if (id === "screen-draft-closed") {
        content = (
            <DraftLobbyView
                isAdmin
                supplementalDraft
                league={{
                    id: previewLeague.id,
                    name: previewLeague.name,
                    status: "ACTIVE",
                    participantCount: previewUsers.length,
                    maxParticipants: previewUsers.length,
                }}
                users={previewUsers}
                rawDate="2027-01-26T20:30:00"
                hasScheduledDraft
                scheduledTime=""
                orderSource="TRANSFER_ORDER"
                manualPicks={Array.from({ length: previewUsers.length * 2 }, () => "")}
                orderError=""
                actionError={null}
                actionPending={false}
                pendingAction={null}
                copied={false}
                copyError=""
                onScheduledTimeChange={() => {}}
                onOrderSourceChange={() => {}}
                onManualPickChange={() => {}}
                onSchedule={() => {}}
                onPendingAction={() => {}}
                onConfirmationOpenChange={() => {}}
                onConfirmedAction={() => {}}
                onCopyCode={() => {}}
                onDraftTimeElapsed={() => {}}
            />
        );
    } else if (id === "screen-transfer-lifecycle") {
        content = (
            <TransferWindowLifecycleScenario
                previewUser={previewUser}
                previewUsers={previewUsers}
                players={players}
                teams={previewTeams}
                fixturesByTeam={fixturesByTeam}
                nextGameweek={nextGameweek}
                squad={completeSquad}
            />
        );
    } else if (id === "screen-transfer-closed") {
        const previewOrder = buildClosedTransferOrder(previewUsers, previewUser.id);

        content = (
            <ClosedWindowView
                gameweekId={nextGameweek.id}
                transferOpenTime={nextGameweek.transferOpenTime}
                transferOrder={previewOrder}
                orderPending={false}
                orderError={null}
                automaticAttendance={false}
                attendancePending={false}
                attendanceError={null}
                isLeagueAdmin
                onAttendanceChange={() => {}}
                onManageOrder={() => {}}
                onOpenWindow={() => {}}
            />
        );
    } else if (id === "screen-transfer" || id === "screen-draft") {
        const draftMode = id === "screen-draft";
        const preview = buildTransferWindowPreview({
            players,
            users: previewUsers,
            currentUser: previewUser,
            squad: completeSquad,
            nextGameweek,
            draftMode,
        });

        content = (
            <PageLayout
                left={(
                    <TransferWindow
                        user={previewUser}
                        allUsers={previewUsers}
                        windowState={preview.windowState}
                        nextGameweek={nextGameweek}
                        players={preview.windowPlayers}
                        teams={previewTeams}
                        fixturesByTeam={fixturesByTeam}
                        previewMode
                        previewSquad={completeSquad}
                        previewDraftActions={preview.draftActions}
                        previewTransferActions={preview.transferActions}
                    />
                )}
                right={(
                    <TransferUserSidebar
                        users={previewUsers}
                        currentUserId={previewUser.id}
                        squad={completeSquad}
                        players={preview.windowPlayers}
                        fixturesByTeam={fixturesByTeam}
                        nextGameweek={nextGameweek}
                    />
                )}
            />
        );
    } else if (id === "screen-points-closed") {
        content = <PreSeasonPointsState />;
    } else if (id === "screen-points") {
        const visibleGameweeks = gameweeks.slice(0, 6);
        const playerData = squadPlayerIds(completeSquad).map((playerId, index) => ({
            playerId,
            points: [8, 6, 5, 12, 3, 7, 2, 9, 4, 6, 1, 3, 8, 2, 5][index] ?? 2,
            nextFixture: index % 2 === 0 ? "CHE (H)" : "LIV (A)",
        }));
        const gameweekView = {
            effectiveGameweek: currentGameweek,
            visibleGameweeks,
            selectedIndex: visibleGameweeks.length - 1,
            canGoPrevious: true,
            canGoNext: false,
        };

        content = (
            <PageLayout
                left={(
                    <Points
                        user={previewUser}
                        squad={completeSquad}
                        points={71}
                        playerData={playerData}
                        gameweekView={gameweekView}
                        allGameweeks={gameweeks}
                        onSelectGameweek={() => {}}
                        previewPlayers={players}
                        previewFixtures={{ fixtures: previewFixtures, teams: previewTeams }}
                    />
                )}
                right={(
                    <UserSidebar
                        user={previewUser}
                        editable
                        previewPoints={{ gameweekPoints: 71, totalPoints: 384 }}
                    />
                )}
            />
        );
    } else {
        content = (
            <PageLayout
                left={(
                    <Status
                        user={previewUser}
                        league={previewLeague}
                        currentGameweek={currentGameweek}
                        nextGameweek={nextGameweek}
                        transferHistoryGameweekId={currentGameweek.id}
                        refreshGameweeks={() => {}}
                        previewData={statusPreviewData}
                    />
                )}
                right={(
                    <StatusSidebar
                        league={previewLeague}
                        user={previewUser}
                        previewDreamTeam={previewDreamTeam}
                    />
                )}
            />
        );
    }

    return (
        <>
            {content}
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[4500] shadow-panel sm:right-6 sm:bottom-6"
                aria-label={`Close ${SCREEN_TITLES[id]} preview`}
            >
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to lab
            </Button>
        </>
    );
}

function buildStatusPreviewData(players, users, gameweekId) {
    const availablePlayers = players.filter(Boolean);
    const pickPlayer = (index) => availablePlayers[index % Math.max(availablePlayers.length, 1)] ?? {};
    const playersOfTheWeek = Array.from({ length: gameweekId }, (_, index) => {
        const player = pickPlayer(index + 2);
        return {
            id: player.id,
            gameweek: index + 1,
            playerName: player.viewName || `Player ${index + 1}`,
            position: player.position,
            teamId: player.teamId,
            points: [11, 13, 10, 15, 12, 14][index] ?? 10,
        };
    });
    const playerIn = pickPlayer(4);
    const playerOut = pickPlayer(5);
    const waiverIn = pickPlayer(7);
    const waiverOut = pickPlayer(8);
    const irPlayer = pickPlayer(2);

    return {
        points: 71,
        players: availablePlayers,
        dailyStatus: [
            { date: "2026-09-19T14:00:00", isCalculated: true },
            { date: "2026-09-20T14:00:00", isCalculated: false },
            { date: "2026-09-21T19:00:00", isCalculated: false },
        ],
        playersOfTheWeek,
        transferActions: [
            {
                id: 101,
                windowType: "TRANSFER",
                userId: users[0]?.id ?? 1,
                userName: users[0]?.name || "Roi Harush",
                playerInId: playerIn.id,
                playerOutId: playerOut.id,
                source: "MANUAL",
                createdAt: "2026-09-16T18:04:00",
            },
            {
                id: 102,
                windowType: "TRANSFER",
                userId: users[1]?.id ?? 2,
                userName: users[1]?.name || "Demo Manager",
                playerInId: waiverIn.id,
                playerOutId: waiverOut.id,
                source: "WAIVER",
                createdAt: "2026-09-16T18:06:00",
            },
            {
                id: 103,
                windowType: "TRANSFER",
                userId: users[0]?.id ?? 1,
                userName: users[0]?.name || "Roi Harush",
                playerInId: pickPlayer(9).id,
                playerOutId: irPlayer.id,
                source: "IR",
                createdAt: "2026-09-16T18:09:00",
            },
        ],
        irStatuses: users.map((manager, index) => ({
            userId: manager.id,
            userName: manager.name,
            teamName: manager.fantasyTeamName,
            hasIr: index === 0,
            irPlayerName: index === 0 ? pickPlayer(2).viewName || "Van Dijk" : null,
        })),
    };
}

function buildPreviewDreamTeam(players) {
    return players.slice(0, 11).map((player, index) => ({
        id: player.id,
        name: player.viewName,
        position: player.position,
        teamId: player.teamId,
        team: player.teamShort || player.teamName?.slice(0, 3).toUpperCase() || "TST",
        points: [12, 10, 9, 8, 15, 7, 11, 8, 6, 13, 9][index] ?? 6,
    }));
}

function buildPreviewFixtures(teams, gameweekId) {
    const matchTeams = teams.slice(0, Math.min(10, teams.length));
    return Array.from({ length: Math.floor(matchTeams.length / 2) }, (_, index) => ({
        id: `preview-fixture-${gameweekId}-${index + 1}`,
        event: gameweekId,
        homeTeamId: matchTeams[index * 2].id,
        awayTeamId: matchTeams[index * 2 + 1].id,
        kickoff_time: `2026-09-${String(19 + (index > 2 ? 1 : 0)).padStart(2, "0")}T${String(14 + index).padStart(2, "0")}:00:00`,
        homeScore: index < 2 ? [2, 1][index] : null,
        awayScore: index < 2 ? [1, 1][index] : null,
    }));
}

function buildTeams(players) {
    return [...new Map(players.map((player) => [String(player.teamId), {
        id: player.teamId,
        code: player.teamId,
        name: player.teamName || `Team ${player.teamId}`,
        shortName: player.teamShort || player.teamName?.slice(0, 3).toUpperCase() || "TST",
    }])).values()];
}

function buildFixturesByTeam(teams) {
    return Object.fromEntries(teams.map((team, index) => [team.id, {
        7: [{ opponent: index % 2 ? "ARS (H)" : "MCI (A)", difficulty: 3 }],
    }]));
}

function buildGameweeks() {
    return Array.from({ length: 8 }, (_, index) => {
        const id = index + 1;
        return {
            id,
            name: `Gameweek ${id}`,
            status: id < 6 ? "COMPLETED" : id === 6 ? "LIVE" : "UPCOMING",
            calculated: id < 6,
            transferOpenTime: id === 7 ? "2026-08-21T20:45:00" : null,
            firstKickoffTime: id === 7 ? "2026-08-21T22:00:00" : "2026-08-15T17:00:00",
        };
    });
}

function completePreviewSquad(squad, players) {
    const byPosition = (position) => players.filter((player) => player.position === position).map((player) => player.id);
    const gk = byPosition("GK");
    const def = byPosition("DEF");
    const mid = byPosition("MID");
    const fwd = byPosition("FWD");
    const fallbackIds = players.map((player) => player.id);
    const take = (items, count, offset = 0) => Array.from({ length: count }, (_, index) => items[index + offset] ?? fallbackIds[(index + offset) % fallbackIds.length]).filter(Boolean);
    const startingLineup = {
        GK: take(gk, 1),
        DEF: take(def, 4),
        MID: take(mid, 4),
        FWD: take(fwd, 2),
    };
    const startingIds = Object.values(startingLineup).flat();
    const benchIds = fallbackIds.filter((id) => !startingIds.includes(id));
    return {
        ...squad,
        startingLineup,
        formation: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
        bench: { GK: gk[1] ?? benchIds[0], S1: benchIds[1], S2: benchIds[2], S3: benchIds[3] },
        captainId: mid[0] ?? fwd[0],
        viceCaptainId: fwd[0] ?? mid[1],
        firstPickId: def[0],
        tripleCaptainActive: false,
        benchBoostActive: false,
        irId: null,
    };
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Footer from "../../../Footer";
import Header from "../../../Header";
import HeaderCollage from "../../../HeaderCollage";
import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { findActiveGameweek, gameweekLabel } from "../../../features/gameweeks/availability";
import { getNextTransferGameweek } from "../../../features/gameweeks/model";
import { useLeagueObserver, useObservedManagerSquad } from "../../../features/super-admin/useLeagueObserver";
import { getObserverScreenHref } from "../../../features/super-admin/observerModel";
import { useTeams } from "../../../features/teams/useTeams";
import { isSameTransferId } from "../../../features/transfer-window/model";
import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import { Eye, LockKeyhole, ShieldCheck } from "../../../shared/ui/icons";
import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import UserSidebar from "../../Sidebar/UserSidebar";
import DraftLobby from "../DraftRoomTab/DraftLobby";
import Fixtures from "../FixturesTab/Fixtures";
import LeagueControlPage from "../Admin/LeagueControlPage";
import LeagueTable from "../LeagueTab/LeagueTable";
import PickTeam from "../PickTeamTab/PickTeam";
import Points from "../PointsTab/Points";
import Scout from "../ScoutTab/Scout";
import SettingsPage from "../SettingsTab/SettingsPage";
import Status from "../StatusTab/Status";
import ClosedWindowView from "../TransferWindowTab/ClosedWindowView";
import CompletedTransferWindowView from "../TransferWindowTab/CompletedTransferWindowView";
import TransferWindow from "../TransferWindowTab/TransferWindow";

const SCREEN_LABELS = {
    status: "Status",
    points: "Points",
    "pick-team": "Pick Team",
    league: "League",
    fixtures: "Fixtures",
    scout: "Scout",
    "transfer-window": "Transfer Window",
    "draft-room": "Draft Room",
    "league-control": "League Control",
    settings: "Settings",
};

function ObserverBanner({ league, manager, managers, onManagerChange }) {
    return (
        <div className="sticky top-2 z-30 mx-3 mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-300/35 bg-[#0c1620]/94 px-3 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-xl sm:mx-5 lg:mx-8">
            <Eye className="size-4 text-cyan-300" aria-hidden="true" />
            <span className="uppercase tracking-[0.14em] text-cyan-300">Read only</span>
            <span aria-hidden="true">·</span>
            <span>{league?.name ?? "League"}</span>
            <span aria-hidden="true">·</span>
            <div className="w-full min-w-0 sm:w-64">
                <SelectField
                    value={manager?.userId ?? ""}
                    onValueChange={onManagerChange}
                    options={(managers ?? []).map((item) => ({
                        value: item.userId,
                        label: `${item.fantasyTeamName} · ${item.managerName}`,
                    }))}
                    ariaLabel="Switch observed manager"
                    disabled={!manager || !managers?.length}
                    className="min-h-9 border-cyan-300/35 bg-white/10 px-3 py-1.5 text-xs text-white shadow-none hover:border-cyan-200/60 hover:bg-white/15"
                    contentClassName="min-w-[min(22rem,calc(100vw-1.5rem))]"
                />
            </div>
            <span className="flex items-center gap-2 text-white/65 sm:ml-auto">
                <LockKeyhole className="size-4" aria-hidden="true" />
                Writes blocked
            </span>
            <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                <Link href="/admin/observe">Exit view</Link>
            </Button>
        </div>
    );
}

function ObserverPageState({ children, error = false }) {
    return (
        <main className="mx-auto grid min-h-[24rem] max-w-5xl place-items-center px-4 py-10">
            <p className={`rounded-2xl border px-5 py-4 text-center text-sm font-semibold ${error ? "border-app-danger-border bg-app-danger-surface text-app-danger-foreground" : "border-app-border bg-app-surface text-app-muted"}`} role={error ? "alert" : "status"}>
                {children}
            </p>
        </main>
    );
}

function ObservedPickTeam({ user, nextGameweek, gameweeks, squad, players, playerData }) {
    const [localSquad, setLocalSquad] = useState(squad);
    const [chips, setChips] = useState({ remaining: {}, active: {} });

    return (
        <PageLayout
            left={(
                <PickTeam
                    user={user}
                    nextGameweek={nextGameweek}
                    gameweeks={gameweeks}
                    squad={localSquad}
                    setSquad={setLocalSquad}
                    chips={chips}
                    setChips={setChips}
                    playerData={playerData}
                    saveTeam={() => Promise.resolve(localSquad)}
                    savePending={false}
                    saveSucceeded={false}
                    saveError={null}
                    isDirty={false}
                    setIsDirty={() => {}}
                    refreshPlayerData={() => Promise.resolve()}
                    readOnly
                    previewPlayers={players}
                />
            )}
            right={<UserSidebar user={user} previewPoints={{ gameweekPoints: 0, totalPoints: user.totalPoints ?? 0 }} />}
        />
    );
}

export default function LeagueObserverExperience({ leagueId, managerId, screen }) {
    const router = useRouter();
    const gameweeks = useGameweek();
    const [selectedGameweekId, setSelectedGameweekId] = useState(null);
    const [transferUserSelection, setTransferUserSelection] = useState(null);
    const selectedTransferUserId = transferUserSelection?.perspectiveManagerId === String(managerId)
        ? transferUserSelection.userId
        : Number(managerId);
    const setSelectedTransferUserId = (userId) => setTransferUserSelection({
        perspectiveManagerId: String(managerId),
        userId: Number(userId),
    });
    const defaultGameweek = gameweeks.currentGameweek ?? gameweeks.nextGameweek ?? gameweeks.gameweeks[0] ?? null;
    const selectedGameweek = gameweeks.gameweeks.find((item) => String(item.id) === String(selectedGameweekId)) ?? defaultGameweek;
    const scheduledTransferGameweek = getNextTransferGameweek({
        gameweeks: gameweeks.gameweeks,
        nextGameweek: gameweeks.nextGameweek,
    });
    const requestedGameweek = screen === "pick-team"
        ? gameweeks.nextGameweek ?? selectedGameweek
        : screen === "transfer-window"
            ? scheduledTransferGameweek ?? selectedGameweek
            : selectedGameweek;
    const observer = useLeagueObserver({
        leagueId,
        managerId,
        gameweekId: requestedGameweek?.id,
        includePlayersOfTheWeek: screen === "status" && Boolean(gameweeks.currentGameweek),
    });
    const activeWindowGameweek = gameweeks.gameweeks.find(
        (item) => Number(item.id) === Number(observer.windowState.data?.gameWeekId),
    ) ?? requestedGameweek;
    const selectedTransferSquad = useObservedManagerSquad({
        leagueId,
        managerId: selectedTransferUserId,
        gameweekId: activeWindowGameweek?.id,
        enabled: Boolean(
            (screen === "transfer-window" || screen === "draft-room")
            && observer.windowState.data?.isOpen,
        ),
    });
    const teams = useTeams();
    const teamFixtures = useAllTeamFixtures(teams.teams);
    const league = observer.league.data;
    const manager = league?.managers?.find((item) => String(item.userId) === String(managerId));
    const observedUser = useMemo(() => manager ? {
        id: manager.userId,
        leagueId: Number(leagueId),
        leagueStatus: league.status,
        leagueAdmin: manager.leagueAdmin,
        name: manager.managerName,
        firstName: manager.firstName,
        lastName: manager.lastName,
        email: manager.email,
        emailVerified: manager.emailVerified,
        username: manager.username,
        fantasyTeamName: manager.fantasyTeamName,
        totalPoints: manager.totalPoints,
    } : null, [league, leagueId, manager]);
    const observedLeague = useMemo(() => league ? {
        ...league,
        participantCount: league.managers.length,
        users: league.managers.map((item, index) => ({
            id: item.userId,
            name: item.managerName,
            username: item.username,
            fantasyTeamName: item.fantasyTeamName,
            rank: index + 1,
            gwPoints: 0,
            points: item.totalPoints,
        })),
    } : null, [league]);
    const observedManagers = useMemo(() => (league?.managers ?? []).map((item) => ({
        ...item,
        id: item.userId,
        name: item.managerName,
    })), [league]);
    const gameweekView = useMemo(() => {
        const visibleGameweeks = gameweeks.gameweeks ?? [];
        const selectedIndex = Math.max(0, visibleGameweeks.findIndex((item) => item.id === requestedGameweek?.id));
        return {
            effectiveGameweek: requestedGameweek,
            visibleGameweeks,
            selectedIndex,
            canGoPrevious: selectedIndex > 0,
            canGoNext: selectedIndex >= 0 && selectedIndex < visibleGameweeks.length - 1,
        };
    }, [gameweeks.gameweeks, requestedGameweek]);

    const navigationBase = `/observe/${leagueId}/${managerId}`;
    const observedManagerPointsHref = (leagueMember) => getObserverScreenHref(leagueId, leagueMember.id, "points");
    const switchObservedManager = (nextManagerId) => {
        if (!nextManagerId || String(nextManagerId) === String(managerId)) return;
        router.replace(getObserverScreenHref(leagueId, nextManagerId, screen));
    };
    const shell = (content) => (
        <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
            <HeaderCollage />
            <Header navigationProps={{
                userOverride: observedUser,
                navigationBase,
                activePath: `/${screen}`,
                observerMode: true,
            }} />
            <ObserverBanner
                league={league}
                manager={manager}
                managers={league?.managers ?? []}
                onManagerChange={switchObservedManager}
            />
            <main className="min-w-0 flex-1">{content}</main>
            <Footer />
        </div>
    );

    if (observer.league.isPending || gameweeks.loading) return shell(<ObserverPageState>Loading the selected league view…</ObserverPageState>);
    if (observer.league.error || gameweeks.error) return shell(<ObserverPageState error>{observer.league.error?.message || gameweeks.error}</ObserverPageState>);
    if (!league || !manager || !observedUser || !observedLeague) return shell(<ObserverPageState error>The selected manager is not part of this league.</ObserverPageState>);

    let content;
    if (screen === "status" && requestedGameweek) {
        content = <PageLayout
            left={<Status
                user={observedUser}
                league={observedLeague}
                currentGameweek={requestedGameweek}
                nextGameweek={gameweeks.nextGameweek}
                preSeason={!gameweeks.currentGameweek}
                transferHistoryGameweekId={requestedGameweek.id}
                refreshGameweeks={() => {}}
                previewData={{
                    points: observer.points.data ?? 0,
                    dailyStatus: [],
                    players: observer.players.data ?? [],
                    playersOfTheWeek: observer.playersOfTheWeek.data?.playersOfTheWeek ?? [],
                    crownStandings: observer.playersOfTheWeek.data?.crownStandings ?? [],
                    transferActions: observer.history.data ?? [],
                    irStatuses: [],
                }}
            />}
            right={<StatusSidebar
                user={observedUser}
                league={observedLeague}
                preSeason={!gameweeks.currentGameweek}
                previewDreamTeam={[]}
                getMemberPointsHref={observedManagerPointsHref}
            />}
        />;
    } else if (screen === "points" && requestedGameweek && observer.squad.data) {
        content = <PageLayout
            left={<Points
                user={observedUser}
                squad={observer.squad.data}
                points={observer.points.data ?? 0}
                playerData={observer.squadData.data ?? []}
                gameweekView={gameweekView}
                allGameweeks={gameweeks.gameweeks}
                onSelectGameweek={setSelectedGameweekId}
                previewPlayers={observer.players.data ?? []}
            />}
            right={<UserSidebar user={observedUser} previewPoints={{ gameweekPoints: observer.points.data ?? 0, totalPoints: manager.totalPoints }} />}
        />;
    } else if (screen === "pick-team" && requestedGameweek && observer.squad.data) {
        content = <ObservedPickTeam
            key={`${managerId}-${requestedGameweek.id}-${observer.squad.data.id ?? "squad"}`}
            user={observedUser}
            nextGameweek={requestedGameweek}
            gameweeks={gameweeks.gameweeks}
            squad={observer.squad.data}
            players={observer.players.data ?? []}
            playerData={observer.squadData.data ?? []}
        />;
    } else if (screen === "league") {
        content = <PageLayout
            left={<LeagueTable
                currentUser={observedUser}
                league={observedLeague}
                getMemberPointsHref={observedManagerPointsHref}
            />}
            right={<SidebarContainer><PointsSummaryBlock user={observedUser} previewPoints={{ gameweekPoints: observer.points.data ?? 0, totalPoints: manager.totalPoints }} /></SidebarContainer>}
        />;
    } else if (screen === "fixtures") {
        content = <PageLayout
            left={<Fixtures />}
            right={<SidebarContainer><PointsSummaryBlock user={observedUser} previewPoints={{ gameweekPoints: observer.points.data ?? 0, totalPoints: manager.totalPoints }} /></SidebarContainer>}
        />;
    } else if (screen === "scout") {
        content = <PageLayout
            left={<Scout
                user={observedUser}
                players={observer.players.data ?? []}
                teams={teams.teams}
                fixturesByTeam={teamFixtures.fixturesByTeam ?? {}}
                squad={observer.squad.data}
                previewMode
            />}
            right={<UserSidebar user={observedUser} previewPoints={{ gameweekPoints: observer.points.data ?? 0, totalPoints: manager.totalPoints }} />}
        />;
    } else if (screen === "transfer-window" || screen === "draft-room") {
        const isDraft = screen === "draft-room";
        const correctWindowType = isDraft ? observer.windowState.data?.isDraftMode : !observer.windowState.data?.isDraftMode;
        if (observer.windowState.data?.isOpen && correctWindowType) {
            content = <PageLayout
                left={<TransferWindow
                    user={observedUser}
                    allUsers={observedManagers}
                    windowState={observer.windowState.data}
                    nextGameweek={activeWindowGameweek}
                    players={observer.players.data ?? []}
                    teams={teams.teams}
                    fixturesByTeam={teamFixtures.fixturesByTeam ?? {}}
                    isClosing={Boolean(observer.windowState.data?.isClosing)}
                    previewMode
                    previewSquad={observer.squad.data}
                    previewDraftActions={observer.history.data ?? []}
                    previewTransferActions={observer.history.data ?? []}
                    readOnly
                />}
                right={<TransferUserSidebar
                    users={observedManagers}
                    currentUserId={selectedTransferUserId}
                    onUserChange={setSelectedTransferUserId}
                    squad={selectedTransferSquad.data ?? null}
                    players={observer.players.data ?? []}
                    fixturesByTeam={teamFixtures.fixturesByTeam ?? {}}
                    nextGameweek={activeWindowGameweek}
                    isLoading={selectedTransferSquad.isPending}
                    error={selectedTransferSquad.error}
                />}
            />;
        } else if (isDraft) {
            content = observer.draft.isPending
                ? <ObserverPageState>Loading the draft lobby…</ObserverPageState>
                : <DraftLobby
                    isAdmin={Boolean(manager.leagueAdmin)}
                    config={observer.draft.data}
                    league={observedLeague}
                    users={observedManagers}
                    gameweeks={gameweeks.gameweeks}
                    currentGameweek={gameweeks.currentGameweek}
                    onDraftTimeElapsed={() => observer.draft.refetch()}
                    readOnly
                />;
        } else if (observer.attendance.data?.windowStatus === "CLOSED") {
            content = <CompletedTransferWindowView gameweekId={requestedGameweek?.id} />;
        } else {
            const automaticUserIds = observer.attendance.data?.automaticUserIds ?? [];
            const transferOrder = (observer.order.data ?? []).map((id, index) => {
                const orderManager = observedManagers.find((item) => isSameTransferId(item.id, id));
                return {
                    id: `${index + 1}-${id}`,
                    pickNumber: index + 1,
                    managerName: orderManager?.name ?? orderManager?.fantasyTeamName ?? `User ${id}`,
                    isCurrentUser: isSameTransferId(id, observedUser.id),
                    automatic: automaticUserIds.some((automaticUserId) => isSameTransferId(automaticUserId, id)),
                };
            });
            const activeGameweek = findActiveGameweek(gameweeks.gameweeks, gameweeks.currentGameweek);
            content = <ClosedWindowView
                gameweekId={requestedGameweek?.id}
                transferOpenTime={requestedGameweek?.transferOpenTime}
                transferOrder={transferOrder}
                orderPending={observer.order.isPending}
                orderError={observer.order.error}
                automaticAttendance={Boolean(observer.attendance.data?.automatic)}
                attendancePending={observer.attendance.isPending}
                attendanceError={observer.attendance.error}
                isLeagueAdmin={Boolean(manager.leagueAdmin)}
                openBlockedReason={activeGameweek
                    ? `Transfers cannot open while ${gameweekLabel(activeGameweek)} is active.`
                    : ""}
                onAttendanceChange={() => {}}
                onManageOrder={() => {}}
                onOpenWindow={() => {}}
                readOnly
            />;
        }
    } else if (screen === "league-control") {
        content = <LeagueControlPage
            leagueOverride={observedLeague}
            managersOverride={observedManagers}
            apiLeagueId={Number(leagueId)}
            readOnly
        />;
    } else if (screen === "settings") {
        content = <SettingsPage userOverride={observedUser} readOnly />;
    } else {
        content = <ObserverPageState>{SCREEN_LABELS[screen] ?? "This screen"} has no data available for the selected manager yet.</ObserverPageState>;
    }

    return shell(content);
}

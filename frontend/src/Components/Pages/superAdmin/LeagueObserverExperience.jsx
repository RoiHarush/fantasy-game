"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Footer from "../../../Footer";
import Header from "../../../Header";
import HeaderCollage from "../../../HeaderCollage";
import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useLeagueObserver } from "../../../features/super-admin/useLeagueObserver";
import { useTeams } from "../../../features/teams/useTeams";
import { Button } from "../../../shared/ui/Button";
import { Eye, LockKeyhole, ShieldCheck } from "../../../shared/ui/icons";
import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import UserSidebar from "../../Sidebar/UserSidebar";
import Fixtures from "../FixturesTab/Fixtures";
import LeagueTable from "../LeagueTab/LeagueTable";
import PickTeam from "../PickTeamTab/PickTeam";
import Points from "../PointsTab/Points";
import Scout from "../ScoutTab/Scout";
import Status from "../StatusTab/Status";
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

function ObserverBanner({ league, manager }) {
    return (
        <div className="sticky top-2 z-30 mx-3 mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-300/35 bg-[#0c1620]/94 px-3 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-xl sm:mx-5 lg:mx-8">
            <Eye className="size-4 text-cyan-300" aria-hidden="true" />
            <span className="uppercase tracking-[0.14em] text-cyan-300">Read only</span>
            <span aria-hidden="true">·</span>
            <span>{league?.name ?? "League"}</span>
            <span aria-hidden="true">·</span>
            <span className="min-w-0 truncate">{manager?.fantasyTeamName ?? "Manager"}</span>
            <span className="ml-auto flex items-center gap-2 text-white/65">
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

function ReadOnlySettings({ user }) {
    return (
        <main className="mx-auto w-full max-w-4xl px-3 py-5 text-app-foreground sm:px-6 sm:py-9 lg:py-12">
            <section className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-sm">
                <header className="border-b border-app-border px-4 py-5 sm:px-7 sm:py-7">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-500">Read-only profile</p>
                    <h1 className="mt-1 text-xl font-black tracking-tight text-app-foreground sm:text-2xl">Account settings</h1>
                    <p className="mt-1 text-sm text-app-muted">This is how the selected manager&apos;s identity is represented. Editing controls are intentionally unavailable.</p>
                </header>
                <dl className="grid gap-px bg-app-border sm:grid-cols-2">
                    {[
                        ["First name", user.firstName || "—"],
                        ["Last name", user.lastName || "—"],
                        ["Username", user.username],
                        ["Verified email", user.email || "—"],
                        ["Fantasy team", user.fantasyTeamName],
                        ["Access", user.leagueAdmin ? "League manager" : "Manager"],
                    ].map(([label, value]) => (
                        <div key={label} className="bg-app-surface px-4 py-5 sm:px-7">
                            <dt className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-app-muted">{label}</dt>
                            <dd className="mt-1 break-words text-sm font-extrabold text-app-foreground">{value}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        </main>
    );
}

function ReadOnlyLeagueControl({ league, manager }) {
    return (
        <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-9 lg:py-12">
            <section className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-sm">
                <header className="border-b border-app-border px-4 py-5 sm:px-7">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-500">League manager view</p>
                    <h1 className="mt-1 text-2xl font-black text-app-foreground">League Control</h1>
                    <p className="mt-1 text-sm text-app-muted">Configuration is visible, but scheduling, membership and scoring actions are blocked.</p>
                </header>
                <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-7">
                    <div className="rounded-2xl border border-app-border bg-app-surface-muted p-4"><p className="text-xs font-black uppercase tracking-wider text-app-muted">Status</p><p className="mt-2 font-black text-app-foreground">{league.status?.replaceAll("_", " ")}</p></div>
                    <div className="rounded-2xl border border-app-border bg-app-surface-muted p-4"><p className="text-xs font-black uppercase tracking-wider text-app-muted">Managers</p><p className="mt-2 font-black text-app-foreground">{league.managers?.length}/{league.maxParticipants}</p></div>
                    <div className="rounded-2xl border border-app-border bg-app-surface-muted p-4"><p className="text-xs font-black uppercase tracking-wider text-app-muted">Viewed as</p><p className="mt-2 font-black text-app-foreground">{manager.managerName}</p></div>
                </div>
                <div className="border-t border-app-border px-4 py-5 sm:px-7">
                    <h2 className="text-sm font-black text-app-foreground">Scoring rules</h2>
                    <pre className="mt-3 overflow-auto rounded-2xl border border-app-border bg-app-surface-muted p-4 text-xs text-app-foreground">{JSON.stringify(league.scoringRules ?? {}, null, 2)}</pre>
                </div>
            </section>
        </main>
    );
}

export default function LeagueObserverExperience({ leagueId, managerId, screen }) {
    const gameweeks = useGameweek();
    const [selectedGameweekId, setSelectedGameweekId] = useState(null);
    const defaultGameweek = gameweeks.currentGameweek ?? gameweeks.nextGameweek ?? gameweeks.gameweeks[0] ?? null;
    const selectedGameweek = gameweeks.gameweeks.find((item) => String(item.id) === String(selectedGameweekId)) ?? defaultGameweek;
    const requestedGameweek = screen === "pick-team" ? gameweeks.nextGameweek ?? selectedGameweek : selectedGameweek;
    const observer = useLeagueObserver({ leagueId, managerId, gameweekId: requestedGameweek?.id });
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
    const shell = (content) => (
        <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0">
            <HeaderCollage />
            <Header navigationProps={{
                userOverride: observedUser,
                navigationBase,
                activePath: `/${screen}`,
                observerMode: true,
            }} />
            <ObserverBanner league={league} manager={manager} />
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
                    playersOfTheWeek: [],
                    transferActions: observer.history.data ?? [],
                    irStatuses: [],
                }}
            />}
            right={<StatusSidebar user={observedUser} league={observedLeague} preSeason={!gameweeks.currentGameweek} previewDreamTeam={[]} />}
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
            left={<LeagueTable currentUser={observedUser} league={observedLeague} />}
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
        content = observer.windowState.data?.isOpen && correctWindowType ? (
            <TransferWindow
                user={observedUser}
                allUsers={league.managers.map((item) => ({ ...item, id: item.userId, name: item.managerName }))}
                windowState={observer.windowState.data}
                nextGameweek={gameweeks.nextGameweek ?? requestedGameweek}
                players={observer.players.data ?? []}
                teams={teams.teams}
                fixturesByTeam={teamFixtures.fixturesByTeam ?? {}}
                previewMode
                previewSquad={observer.squad.data}
                previewDraftActions={observer.history.data ?? []}
                previewTransferActions={observer.history.data ?? []}
                readOnly
            />
        ) : <ObserverPageState>No {isDraft ? "draft" : "transfer window"} is open right now. You are still viewing the same screen state the manager would encounter.</ObserverPageState>;
    } else if (screen === "league-control") {
        content = <ReadOnlyLeagueControl league={league} manager={manager} />;
    } else if (screen === "settings") {
        content = <ReadOnlySettings user={observedUser} />;
    } else {
        content = <ObserverPageState>{SCREEN_LABELS[screen] ?? "This screen"} has no data available for the selected manager yet.</ObserverPageState>;
    }

    return shell(content);
}

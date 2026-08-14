"use client";

import { useMemo, useState } from "react";

import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useMaintenanceLeagues } from "../../../features/league/useLeague";
import { useLeagueObserver } from "../../../features/super-admin/useLeagueObserver";
import { useTeams } from "../../../features/teams/useTeams";
import SelectField from "../../../shared/ui/SelectField";
import { Activity, Eye, LockKeyhole, ShieldCheck, Users } from "../../../shared/ui/icons";
import Fixtures from "../FixturesTab/Fixtures";
import Points from "../PointsTab/Points";
import Scout from "../ScoutTab/Scout";
import Status from "../StatusTab/Status";
import TransferWindow from "../TransferWindowTab/TransferWindow";

const views = ["Status", "Points", "Pick team", "League", "Fixtures", "Scout", "Transfers", "Draft", "League control", "Settings"];

function ReadOnlyBanner({ league, manager }) {
    return (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-app-foreground shadow-lg backdrop-blur-xl">
            <Eye className="size-4 text-cyan-400" aria-hidden="true" />
            <span className="uppercase tracking-[0.14em] text-cyan-400">Read only</span>
            <span aria-hidden="true">·</span>
            <span>{league?.name ?? "No league"}</span>
            {manager && <><span aria-hidden="true">·</span><span>Viewing {manager.fantasyTeamName}</span></>}
            <LockKeyhole className="ml-auto size-4 text-app-muted" aria-label="Editing disabled" />
        </div>
    );
}

function ManagerTable({ managers }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-app-border">
            {managers.map((manager, index) => (
                <div key={manager.userId} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-app-border px-3 py-3 last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(8rem,auto)_5rem]">
                    <span className="text-center text-xs font-black text-app-muted">{index + 1}</span>
                    <div className="min-w-0">
                        <p className="truncate font-black text-app-foreground">{manager.fantasyTeamName}</p>
                        <p className="truncate text-xs text-app-muted">{manager.managerName} · @{manager.username}</p>
                    </div>
                    <span className="hidden text-xs font-bold text-app-muted sm:block">{manager.leagueAdmin ? "League manager" : "Manager"}</span>
                    <strong className="text-right text-sm text-app-foreground">{manager.totalPoints} pts</strong>
                </div>
            ))}
        </div>
    );
}

export default function LeagueObserverPage() {
    const [leagueId, setLeagueId] = useState("");
    const [managerId, setManagerId] = useState("");
    const [view, setView] = useState("Status");
    const leagues = useMaintenanceLeagues();
    const gameweeks = useGameweek();
    const displayedGameweek = gameweeks.currentGameweek ?? gameweeks.nextGameweek ?? gameweeks.gameweeks[0] ?? null;
    const { league, windowState, squad, players, squadData, points, history, effectiveManagerId } = useLeagueObserver({
        leagueId,
        managerId,
        gameweekId: displayedGameweek?.id,
    });
    const teams = useTeams();
    const teamFixtures = useAllTeamFixtures(teams.teams);

    const manager = useMemo(() => league.data?.managers?.find(item => String(item.userId) === String(effectiveManagerId)), [effectiveManagerId, league.data]);
    const observedUser = useMemo(() => manager ? {
        id: manager.userId,
        leagueId: Number(leagueId),
        name: manager.managerName,
        username: manager.username,
        fantasyTeamName: manager.fantasyTeamName,
    } : null, [leagueId, manager]);
    const observedLeague = useMemo(() => league.data ? {
        ...league.data,
        users: league.data.managers.map((item, index) => ({
            id: item.userId,
            name: item.managerName,
            username: item.username,
            fantasyTeamName: item.fantasyTeamName,
            rank: index + 1,
            gwPoints: 0,
            points: item.totalPoints,
        })),
    } : null, [league.data]);
    const gameweekView = useMemo(() => {
        const visibleGameweeks = gameweeks.gameweeks ?? [];
        const selectedIndex = Math.max(0, visibleGameweeks.findIndex(item => item.id === displayedGameweek?.id));
        return {
            effectiveGameweek: displayedGameweek,
            visibleGameweeks,
            selectedIndex,
            canGoPrevious: selectedIndex > 0,
            canGoNext: selectedIndex >= 0 && selectedIndex < visibleGameweeks.length - 1,
        };
    }, [displayedGameweek, gameweeks.gameweeks]);

    const observedContent = () => {
        if (!observedUser || !observedLeague) return <p className="text-sm text-app-muted">Choose a manager to inspect this screen.</p>;
        if (view === "Status" && displayedGameweek) {
            return <Status
                user={observedUser}
                league={observedLeague}
                currentGameweek={displayedGameweek}
                nextGameweek={gameweeks.nextGameweek}
                preSeason={!gameweeks.currentGameweek}
                transferHistoryGameweekId={displayedGameweek.id}
                refreshGameweeks={() => {}}
                previewData={{
                    points: points.data ?? 0,
                    dailyStatus: [],
                    players: players.data ?? [],
                    playersOfTheWeek: [],
                    transferActions: history.data ?? [],
                    irStatuses: [],
                }}
            />;
        }
        if ((view === "Points" || view === "Pick team") && displayedGameweek && squad.data) {
            return <Points
                user={observedUser}
                squad={squad.data}
                points={points.data ?? 0}
                playerData={squadData.data ?? []}
                gameweekView={gameweekView}
                allGameweeks={gameweeks.gameweeks}
                onSelectGameweek={() => {}}
                previewPlayers={players.data ?? []}
            />;
        }
        if (view === "League") return <ManagerTable managers={league.data?.managers ?? []} />;
        if (view === "Fixtures") return <Fixtures />;
        if (view === "Scout") return <Scout
            user={observedUser}
            players={players.data ?? []}
            teams={teams.teams}
            fixturesByTeam={teamFixtures.fixturesByTeam ?? {}}
            squad={squad.data}
            previewMode
        />;
        if (view === "Transfers" || view === "Draft") {
            const correctWindowType = view === "Draft" ? windowState.data?.isDraftMode : !windowState.data?.isDraftMode;
            if (!windowState.data?.isOpen || !correctWindowType) {
                return <div className="space-y-4"><p className="text-sm text-app-muted">No {view.toLowerCase()} session is open right now.</p><p className="text-xs font-bold uppercase tracking-[0.14em] text-app-muted">{history.data?.length ?? 0} recorded moves in the inspected gameweek</p></div>;
            }
            return <TransferWindow
                user={observedUser}
                allUsers={league.data.managers.map(item => ({ ...item, id: item.userId, name: item.managerName }))}
                windowState={windowState.data}
                nextGameweek={gameweeks.nextGameweek ?? displayedGameweek}
                players={players.data ?? []}
                teams={teams.teams}
                fixturesByTeam={teamFixtures.fixturesByTeam ?? {}}
                previewMode
                previewSquad={squad.data}
                previewDraftActions={history.data ?? []}
                previewTransferActions={history.data ?? []}
                readOnly
            />;
        }
        if (view === "League control" || view === "Settings") return <div className="space-y-3 text-sm text-app-muted"><p>League status: <b className="text-app-foreground">{league.data?.status}</b></p><p>Capacity: <b className="text-app-foreground">{league.data?.managers?.length}/{league.data?.maxParticipants}</b></p><pre className="overflow-auto rounded-xl bg-app-surface-muted p-3 text-xs text-app-foreground">{JSON.stringify(league.data?.scoringRules ?? {}, null, 2)}</pre></div>;
        return null;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <header>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-500">Super Admin Observer</p>
                <h1 className="mt-1 text-2xl font-black text-app-foreground sm:text-3xl">Watch any league safely</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">Live data and league events are visible here. This surface exposes no mutation controls.</p>
            </header>

            <div className="grid gap-3 rounded-2xl border border-app-border bg-app-surface p-3 sm:grid-cols-2">
                <SelectField ariaLabel="League to observe" value={leagueId} onValueChange={(value) => { setLeagueId(String(value)); setManagerId(""); }} options={[
                    { value: "", label: "Choose a league" },
                    ...(leagues.data ?? []).map(item => ({ value: item.id, label: `${item.name} · ${item.participantCount} managers` })),
                ]} />
                <SelectField ariaLabel="Manager to observe" value={String(effectiveManagerId)} onValueChange={(value) => setManagerId(String(value))} disabled={!league.data} options={[
                    { value: "", label: "Choose a manager" },
                    ...(league.data?.managers ?? []).map(item => ({ value: item.userId, label: `${item.fantasyTeamName} · ${item.managerName}` })),
                ]} />
            </div>

            <ReadOnlyBanner league={league.data} manager={manager} />

            {leagueId && <>
                <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Observed screen">
                    {views.map(item => <button key={item} type="button" onClick={() => setView(item)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition ${view === item ? "border-cyan-400 bg-cyan-500/15 text-cyan-400" : "border-app-border text-app-muted hover:text-app-foreground"}`}>{item}</button>)}
                </nav>

                <section className="min-h-72 rounded-2xl border border-app-border bg-app-surface p-4 sm:p-6">
                    <div className="mb-5 flex items-center gap-3 border-b border-app-border pb-4">
                        {view === "Transfers" || view === "Draft" ? <Activity className="size-5 text-cyan-400" /> : view === "League" ? <Users className="size-5 text-cyan-400" /> : <ShieldCheck className="size-5 text-cyan-400" />}
                        <div><h2 className="font-black text-app-foreground">{view}</h2><p className="text-xs text-app-muted">Observed from the real league state</p></div>
                    </div>
                    {observedContent()}
                </section>
            </>}
        </div>
    );
}

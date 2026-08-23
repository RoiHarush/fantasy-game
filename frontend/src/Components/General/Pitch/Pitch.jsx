import PlayerCard from "../PlayerCard";
import { getPlayerById } from "../../../Utils/ItemGetters";
import { cn } from "../../../lib/cn";
import BenchBoostEffect from "./BenchBoostEffect";
import BenchPlayerShock from "./BenchPlayerShock";
import { BENCH_BOOST_CYCLE_SECONDS, getBenchImpactDelay } from "./benchBoostTiming";
import { getLeagueLeadingPlayerId } from "./model";

function Pitch({
    squad,
    view,
    currentGw,
    playerData,
    players,
}) {
    const defaultFormation = { GK: 1, DEF: 3, MID: 4, FWD: 3 };
    const playerDataById = new Map(
        (playerData ?? []).map((player) => [String(player.playerId), player]),
    );
    const leadingPlayerId = squad.crownPlayerId ?? getLeagueLeadingPlayerId(playerData);
    const firstPickCaptainIsGoalkeeper = !squad.tripleCaptainActive
        && squad.captainId != null
        && squad.firstPickId != null
        && String(squad.captainId) === String(squad.firstPickId)
        && (squad.startingLineup?.GK ?? []).some((id) => String(id) === String(squad.captainId));
    const leaderIsGoalkeeper = leadingPlayerId != null
        && (squad.startingLineup?.GK ?? []).some((id) => String(id) === String(leadingPlayerId));

    const renderPlayer = (id, index) => {
        const player = id ? getPlayerById(players, id) : null;

        let points = null;
        let nextFixture = null;
        let nextFixtures = [];
        let fixturePostponed = false;

        if (player) {
            const playerDynamic = playerDataById.get(String(id));
            points = playerDynamic?.points ?? null;
            nextFixture = playerDynamic?.nextFixture ?? null;
            nextFixtures = playerDynamic?.nextFixtures ?? [];
            fixturePostponed = playerDynamic?.fixturePostponed === true;
        }

        if (!player) {
            return (
                <PlayerCard
                    key={`empty-${index}`}
                    player={null}
                    view={view}
                    captain={false}
                    viceCaptain={false}
                    currentGw={currentGw}
                    points={null}
                    nextFixture={null}
                    nextFixtures={[]}
                    fixturePostponed={false}
                />
            );
        }

        const isCaptain = String(squad.captainId) === String(id);
        const isFirstPickCaptain = isCaptain
            && !squad.tripleCaptainActive
            && squad.firstPickId != null
            && String(squad.firstPickId) === String(id);

        return (
            <PlayerCard
                key={id}
                player={player}
                view={view}
                captain={isCaptain}
                viceCaptain={String(squad.viceCaptainId) === String(id)}
                captainMultiplier={squad.tripleCaptainActive ? 3 : 2}
                pointsLeader={leadingPlayerId != null && String(leadingPlayerId) === String(id)}
                chipEffect={
                    squad.tripleCaptainActive && isCaptain
                        ? "triple-captain"
                        : isFirstPickCaptain
                            ? "first-pick-captain"
                            : null
                }
                currentGw={currentGw}
                points={points}
                nextFixture={nextFixture}
                nextFixtures={nextFixtures}
                fixturePostponed={fixturePostponed}
            />
        );
    };

    return (
        <div className="relative aspect-[5/4] w-full max-w-[1000px] overflow-hidden rounded-[10px] bg-[url('/UI/pitch-default.svg')] bg-contain bg-bottom bg-no-repeat max-md:aspect-[3/4] max-md:bg-[length:170%_105%] max-md:bg-top">
            <div className="relative grid h-full w-full grid-cols-12 grid-rows-[0.8fr_1fr_1fr_1.2fr_auto]">
                {["GK", "DEF", "MID", "FWD"].map(pos => {
                    const playerIds = squad.startingLineup?.[pos] || [];
                    const slotCount = view === "pick"
                        ? playerIds.length
                        : Number(squad.formation?.[pos]) || defaultFormation[pos];
                    const slots = Array.from(
                        { length: Math.max(slotCount, playerIds.length) },
                        (_, index) => playerIds[index] ?? null
                    );
                    return (
                        <div
                            key={pos}
                            className={cn(
                                "col-span-full m-0 flex items-start justify-center gap-[6.6%] max-md:grid max-md:w-full max-md:gap-[clamp(4px,1.5vw,10px)] max-md:px-[3%]",
                                pos === "GK" && (firstPickCaptainIsGoalkeeper || leaderIsGoalkeeper) && "pt-5 max-md:pt-4",
                            )}
                            style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
                        >
                            {slots.map((id, index) => renderPlayer(id, `${pos}-${index}`))}
                        </div>
                    );
                })}

                <div
                    className="relative isolate col-span-full row-start-5 grid w-[78%] grid-cols-4 items-center gap-5 self-end justify-self-center rounded-t-sm bg-white/40 p-2.5 max-md:w-[95%] max-md:gap-1 max-md:rounded-t-lg max-md:p-1.5"
                    style={{ "--bench-cycle-duration": `${BENCH_BOOST_CYCLE_SECONDS}s` }}
                >
                    {squad.benchBoostActive && <BenchBoostEffect />}

                    {["GK", "S1", "S2", "S3"].map((slot, index) => {
                        const playerId = squad.bench ? squad.bench[slot] : null;
                        const label = slot === "GK" ? "GK" : slot.replace("S", "");

                        return (
                            <div
                                key={slot}
                                className={cn(
                                    "relative z-[1] flex flex-col items-center justify-start",
                                    squad.benchBoostActive && "bench-player-impact",
                                )}
                                style={squad.benchBoostActive
                                    ? { "--bench-impact-delay": `${getBenchImpactDelay(index, 4)}s` }
                                    : undefined}
                            >
                                {squad.benchBoostActive && <BenchPlayerShock index={index} />}
                                {renderPlayer(playerId, `bench-${index}`)}
                                <div className="mt-0.5 text-[13px] font-bold tracking-[0.5px] text-[#333] max-md:text-[6px]">
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Pitch;

import { useGameweek } from "../../features/gameweeks/useGameweek";
import { useDreamTeam } from "../../features/status/useStatusData";
import { Star } from "../../shared/ui/icons";
import PlayerKit from "../General/PlayerKit";

function TeamOfTheWeekBlock({ previewTeam }) {
    const { currentGameweek } = useGameweek();
    const preview = Array.isArray(previewTeam);
    const dreamTeamQuery = useDreamTeam(currentGameweek?.id, !preview);
    const dreamTeam = preview ? previewTeam : dreamTeamQuery.data?.team ?? [];
    const pending = !preview && dreamTeamQuery.isPending;

    return (
        <section className="mb-5 w-full overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm transition-colors">
            <div className="flex items-center gap-2 bg-component-gradient px-4 py-3 text-base font-bold text-brand-ink">
                <Star className="size-5 text-brand-green" aria-hidden="true" />
                Team of the Week
            </div>

            {pending ? (
                <p className="p-4 text-center text-sm text-app-muted">Loading dream team...</p>
            ) : dreamTeam.length === 0 ? (
                <p className="p-4 text-center text-sm text-app-muted">No dream team is available yet.</p>
            ) : (
                <div className="w-full overflow-hidden">
                    <table className="w-full table-fixed border-collapse text-sm">
                        <thead className="bg-app-surface-muted text-xs tracking-wide text-app-muted uppercase"><tr><th className="w-[15%] px-1 py-2 text-center">Pos</th><th className="w-[55%] px-1 py-2 text-center">Player</th><th className="w-[15%] px-1 py-2 text-center">Club</th><th className="w-[15%] px-1 py-2 text-center">Pts</th></tr></thead>
                        <tbody>
                            {dreamTeam.map((player, index) => (
                                <tr key={player.id ?? `row-${index}`} className="border-b border-app-border last:border-b-0">
                                    <td className="overflow-hidden px-1 py-2 text-center text-ellipsis whitespace-nowrap">{player.position}</td>
                                    <td className="px-1 py-2">
                                        <div className="flex min-w-0 items-center justify-start gap-1.5">
                                        <PlayerKit
                                            teamId={player.teamId}
                                            type={player.position === "GK" ? "gk" : "field"}
                                            className="size-6 shrink-0 object-contain"
                                        />
                                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{player.name}</span>
                                        </div>
                                    </td>
                                    <td className="overflow-hidden px-1 py-2 text-center text-ellipsis whitespace-nowrap">{player.team}</td>
                                    <td className="px-1 py-2 text-center font-bold text-violet-950 dark:text-violet-200">{player.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default TeamOfTheWeekBlock;

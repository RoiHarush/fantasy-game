import { isSameEntityId } from "../../../features/league/model";
import { cn } from "../../../lib/cn";
import TableUser from "./TableUser";

function LeagueTable({ currentUser, league, compact = false, getMemberPointsHref }) {
    const users = league.users ?? [];

    return (
        <div className={cn(
            "w-full font-sans",
            compact
                ? "bg-transparent"
                : "overflow-x-auto rounded-xl border border-app-border bg-app-surface shadow-sm",
        )}>
            <table className={cn("w-full border-collapse text-sm", !compact && "md:min-w-[700px]")}>
                <caption className="sr-only">{league.name} standings</caption>
                <thead className="border-b-2 border-black/10 bg-app-surface text-xs tracking-wide text-app-muted uppercase dark:border-white/10">
                    <tr>
                        <th scope="col" className="w-[10%] px-1 py-2 text-center sm:w-auto sm:px-3">Rank</th>
                        <th scope="col" className="w-[54%] px-2 py-2 text-left sm:w-auto sm:px-3">Team</th>
                        <th scope="col" className="w-[18%] px-1 py-2 text-center sm:w-auto sm:px-3"><abbr title="Gameweek points">GW</abbr></th>
                        <th scope="col" className="w-[18%] px-1 py-2 text-center sm:w-auto sm:px-3"><abbr title="Total points">TOT</abbr></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.id}
                            className={cn(
                                "border-b border-app-border transition-colors last:border-b-0 hover:bg-app-surface-muted",
                                isSameEntityId(user.id, currentUser.id) && "bg-linear-to-r from-brand-green to-brand-cyan font-semibold text-brand-ink hover:from-brand-green hover:to-brand-cyan",
                            )}
                        >
                            <td className="px-1 py-2 text-center sm:px-3">{user.rank}</td>

                            <td className="px-2 py-2 text-left sm:px-3">
                                <TableUser
                                    user={user}
                                    currentUser={currentUser}
                                    pointsHref={getMemberPointsHref?.(user)}
                                />
                            </td>
                            <td className="px-1 py-2 text-center sm:px-3">{user.gwPoints}</td>
                            <td className="px-1 py-2 text-center sm:px-3">{user.points}</td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan="4" className="px-3 py-5 text-center text-app-muted">No managers are available in this league yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default LeagueTable;

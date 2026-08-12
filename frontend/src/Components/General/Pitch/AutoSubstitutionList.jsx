import { ArrowDownLeft, ArrowUpRight, Repeat2 } from "lucide-react";

import { getPlayerById } from "../../../Utils/ItemGetters";
import PlayerKit from "../PlayerKit";

function SubstitutionPlayer({ player, direction }) {
    const incoming = direction === "in";

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
                className={incoming ? "text-emerald-500" : "text-rose-500"}
                aria-hidden="true"
            >
                {incoming ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
            </span>
            {player ? (
                <PlayerKit
                    teamId={player.teamId}
                    type={player.position === "GK" ? "gk" : "field"}
                    className="h-9 w-7 shrink-0 object-contain sm:h-11 sm:w-9"
                />
            ) : null}
            <div className="min-w-0">
                <p className={`text-[0.62rem] font-black uppercase tracking-[0.12em] ${incoming ? "text-emerald-500" : "text-rose-500"}`}>
                    {incoming ? "In" : "Out"}
                </p>
                <p className="truncate text-xs font-bold text-app-foreground sm:text-sm">
                    {player?.viewName ?? "Unknown player"}
                </p>
            </div>
        </div>
    );
}

export default function AutoSubstitutionList({ substitutions = [], players = [] }) {
    if (!substitutions.length) return null;

    return (
        <section className="w-[calc(100%-24px)] self-center pb-4 max-md:w-[calc(100%-16px)]" aria-labelledby="auto-substitution-heading">
            <div className="mb-2 flex items-center gap-2 text-app-foreground">
                <span className="grid size-8 place-items-center rounded-lg border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                    <Repeat2 size={16} aria-hidden="true" />
                </span>
                <div>
                    <h4 id="auto-substitution-heading" className="text-sm font-black sm:text-base">Automatic substitutions</h4>
                    <p className="text-[0.68rem] text-app-muted sm:text-xs">Applied after the gameweek finished</p>
                </div>
            </div>

            <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border border-app-border bg-app-surface-muted">
                {substitutions.map((substitution, index) => {
                    const playerIn = getPlayerById(players, substitution.playerInId);
                    const playerOut = getPlayerById(players, substitution.playerOutId);

                    return (
                        <div
                            key={`${substitution.sequence}-${substitution.playerInId}-${substitution.playerOutId}`}
                            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4"
                        >
                            <SubstitutionPlayer player={playerIn} direction="in" />
                            <span className="text-[0.66rem] font-black text-app-muted">{index + 1}</span>
                            <SubstitutionPlayer player={playerOut} direction="out" />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

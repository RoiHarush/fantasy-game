import { ArrowLeft, ArrowRight, GripVertical, Trash2 } from "lucide-react";

import PlayerKit from "../../General/PlayerKit";

function WaiverPlanPanel({ entries, playersById, onChange, saving, message, gameWeekId }) {
    const move = (from, to) => {
        if (to < 0 || to >= entries.length || from === to) return;
        const reordered = [...entries];
        const [entry] = reordered.splice(from, 1);
        reordered.splice(to, 0, entry);
        void onChange(reordered);
    };

    const getPlayer = (id) => playersById.get(String(id));
    const playerName = (id) => getPlayer(id)?.viewName || `Player #${id}`;

    return (
        <section className="min-h-[26rem] bg-app-surface p-3 sm:p-5">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-app-border pb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-accent-foreground">Gameweek {gameWeekId}</p>
                    <h2 className="mt-1 text-base font-extrabold text-app-foreground sm:text-xl">Waiver plan</h2>
                    <p className="mt-1 hidden max-w-2xl text-sm text-app-muted sm:block">
                        These moves run only if you are offline when your transfer turn begins.
                    </p>
                </div>
                <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {saving ? "Saving..." : "Saved automatically"}
                </span>
            </header>

            {message && (
                <p className="mt-3 rounded-control border border-app-accent-border bg-app-accent-surface p-3 text-sm text-app-accent-foreground" role="status">
                    {message}
                </p>
            )}

            <ol className="mt-4 grid list-none gap-2 p-0">
                {entries.map((entry, index) => {
                    const incoming = getPlayer(entry.playerInId);
                    const outgoing = getPlayer(entry.playerOutId);
                    return (
                        <li
                            key={`${entry.playerInId}-${entry.playerOutId}`}
                            draggable
                            className="grid min-h-12 cursor-grab items-center gap-1 rounded-xl border border-app-border bg-app-surface-elevated p-1.5 shadow-sm transition hover:border-app-accent-border active:cursor-grabbing sm:min-h-16 sm:gap-2 sm:p-2"
                            style={{ gridTemplateColumns: "2.2rem minmax(0, 1fr) 2rem" }}
                            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault();
                                move(Number(event.dataTransfer.getData("text/plain")), index);
                            }}
                        >
                            <label className="grid justify-items-center gap-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-app-muted">
                                <GripVertical aria-hidden="true" size={15} />
                                <span className="sr-only">Priority for {playerName(entry.playerInId)}</span>
                                <input
                                    aria-label={`Priority for ${playerName(entry.playerInId)}`}
                                    type="number"
                                    min="1"
                                    max={entries.length}
                                    value={index + 1}
                                    className="size-7 rounded-lg border border-app-border bg-app-surface text-center text-[0.62rem] font-extrabold text-app-foreground outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/20 sm:size-8 sm:text-xs"
                                    onChange={(event) => move(index, Number(event.target.value) - 1)}
                                />
                            </label>

                            <div
                                className="grid min-w-0 items-center gap-0.5 sm:gap-2"
                                style={{ gridTemplateColumns: "minmax(0, 1fr) 1.65rem minmax(0, 1fr)" }}
                            >
                                <WaiverPlayer player={incoming} fallback={playerName(entry.playerInId)} tone="incoming" />
                                <span className="grid justify-items-center gap-0.5 text-app-muted" aria-label="Player exchange">
                                    <ArrowLeft aria-hidden="true" size={15} className="text-emerald-500 sm:size-[19px]" strokeWidth={2.5} />
                                    <ArrowRight aria-hidden="true" size={15} className="text-rose-500 sm:size-[19px]" strokeWidth={2.5} />
                                </span>
                                <WaiverPlayer player={outgoing} fallback={playerName(entry.playerOutId)} tone="outgoing" />
                            </div>

                            <button
                                type="button"
                                className="grid size-8 place-items-center rounded-lg text-app-muted transition hover:bg-app-danger-surface hover:text-app-danger-foreground focus-visible:outline-2 focus-visible:outline-app-danger-foreground sm:size-9"
                                aria-label={`Remove waiver for ${playerName(entry.playerInId)}`}
                                onClick={() => void onChange(entries.filter((_, itemIndex) => itemIndex !== index))}
                            >
                                <Trash2 aria-hidden="true" size={17} />
                            </button>
                        </li>
                    );
                })}
            </ol>

            {entries.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-app-border bg-app-surface-muted px-4 py-10 text-center">
                    <p className="font-bold text-app-foreground">No waiver priorities yet</p>
                    <p className="mt-1 text-sm text-app-muted">Choose Waiver next to a player to prepare your first move.</p>
                </div>
            )}
        </section>
    );
}

function WaiverPlayer({ player, fallback, tone }) {
    return (
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <PlayerKit
                teamId={player?.teamId || 0}
                type={player?.position === "GK" ? "gk" : "field"}
                className="block shrink-0 object-contain"
                style={{ width: "1.5rem", height: "1.5rem", maxWidth: "1.5rem", maxHeight: "1.5rem" }}
            />
            <div className="min-w-0 leading-tight">
                <span className={`block truncate text-[0.58rem] font-extrabold sm:text-xs ${tone === "incoming" ? "text-emerald-700 dark:text-emerald-300" : "text-app-foreground"}`}>
                    {player?.viewName || fallback}
                </span>
                <span className="block truncate text-[0.48rem] font-semibold uppercase tracking-wide text-app-muted sm:text-[0.65rem]">
                    <span className="hidden sm:inline">{tone === "incoming" ? "Incoming" : "Outgoing"} • </span>{player?.position || "-"}
                </span>
            </div>
        </div>
    );
}

export default WaiverPlanPanel;

import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, GripVertical, Save, Trash2 } from "lucide-react";

import PlayerKit from "../../General/PlayerKit";

function WaiverPlanPanel({ entries, playersById, onChange, onSave, hasChanges, saving, message, gameWeekId, planType = "REGULAR", onPlanTypeChange, hasIrPlan = false }) {
    const move = (from, to) => {
        if (to < 0 || to >= entries.length || from === to) return;
        const reordered = [...entries];
        const [entry] = reordered.splice(from, 1);
        reordered.splice(to, 0, entry);
        onChange(reordered);
    };

    const getPlayer = (id) => playersById.get(String(id));
    const playerName = (id) => getPlayer(id)?.viewName || `Player #${id}`;

    return (
        <section className="min-h-[26rem] bg-app-surface p-3 sm:p-5">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-app-border pb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-accent-foreground">Gameweek {gameWeekId}</p>
                    <h2 className="mt-1 text-base font-extrabold text-app-foreground sm:text-xl">
                        {planType === "IR" ? "IR replacement plan" : "Waiver plan"}
                    </h2>
                    <p className="mt-1 hidden max-w-2xl text-sm text-app-muted sm:block">
                        {planType === "IR"
                            ? "Your first legal priority is signed while offline; otherwise the highest-scoring legal player is selected."
                            : "These moves run only if you are offline when your transfer turn begins."}
                    </p>
                </div>
                <button
                    type="button"
                    className={`inline-flex min-h-9 min-w-28 items-center justify-center gap-1.5 rounded-control px-3 text-xs font-extrabold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${hasChanges
                        ? "bg-component-gradient text-brand-ink hover:brightness-105"
                        : "border border-app-border bg-app-surface-muted text-app-muted"
                    } disabled:cursor-not-allowed disabled:opacity-65`}
                    disabled={!hasChanges || saving}
                    onClick={() => void onSave?.()}
                >
                    <Save aria-hidden="true" size={15} />
                    {saving ? "Saving..." : hasChanges ? "Save changes" : "Saved"}
                </button>
            </header>

            {hasIrPlan && (
                <div className="mt-4 grid grid-cols-2 rounded-control border border-app-border bg-app-surface-muted p-1">
                    {[
                        ["REGULAR", "Transfer waivers"],
                        ["IR", "IR replacements"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            className={`rounded-lg px-3 py-2 text-xs font-extrabold transition sm:text-sm ${planType === value
                                ? "bg-app-surface-elevated text-app-accent-foreground shadow-sm"
                                : "text-app-muted hover:text-app-foreground"
                            }`}
                            onClick={() => onPlanTypeChange?.(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {message && (
                <p className="mt-3 rounded-control border border-app-danger-border bg-app-danger-surface p-3 text-sm text-app-danger-foreground" role="alert">
                    {message}
                </p>
            )}

            <ol className="mt-4 grid list-none gap-2 p-0">
                {entries.map((entry, index) => {
                    const incoming = getPlayer(entry.playerInId);
                    const outgoing = getPlayer(entry.playerOutId);
                    return (
                        <li
                            key={`${entry.playerInId}-${entry.playerOutId}-${index}`}
                            draggable
                            className="grid min-h-12 cursor-grab select-none items-center gap-1 rounded-xl border border-app-border bg-app-surface-elevated p-1.5 shadow-sm transition hover:border-app-accent-border active:cursor-grabbing sm:min-h-16 sm:gap-2 sm:p-2"
                            style={{
                                gridTemplateColumns: "5.1rem minmax(0, 1fr) 2rem",
                                WebkitTouchCallout: "none",
                            }}
                            onContextMenu={(event) => event.preventDefault()}
                            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault();
                                move(Number(event.dataTransfer.getData("text/plain")), index);
                            }}
                        >
                            <div className="grid justify-items-center gap-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-app-muted">
                                <GripVertical aria-hidden="true" size={15} className="hidden sm:block" />
                                <span className="sr-only">Priority for {playerName(entry.playerInId)}</span>
                                <div className="flex h-12 w-full items-stretch gap-1.5">
                                    <span className="grid w-9 shrink-0 place-items-center text-xl font-black tabular-nums text-app-accent-foreground" aria-label={`Priority ${index + 1} for ${playerName(entry.playerInId)}`}>
                                        {index + 1}
                                    </span>
                                    <div className="grid min-w-0 flex-1 grid-rows-2 gap-1">
                                        <button
                                            type="button"
                                            className="grid min-h-0 place-items-center rounded-md border border-app-border bg-app-surface-muted text-app-muted shadow-sm transition hover:border-app-accent-border hover:bg-app-accent-hover hover:text-app-foreground disabled:opacity-25"
                                            aria-label={`Move ${playerName(entry.playerInId)} up`}
                                            disabled={index === 0}
                                            onClick={() => move(index, index - 1)}
                                        >
                                            <ChevronUp aria-hidden="true" size={19} strokeWidth={2.7} />
                                        </button>
                                        <button
                                            type="button"
                                            className="grid min-h-0 place-items-center rounded-md border border-app-border bg-app-surface-muted text-app-muted shadow-sm transition hover:border-app-accent-border hover:bg-app-accent-hover hover:text-app-foreground disabled:opacity-25"
                                            aria-label={`Move ${playerName(entry.playerInId)} down`}
                                            disabled={index === entries.length - 1}
                                            onClick={() => move(index, index + 1)}
                                        >
                                            <ChevronDown aria-hidden="true" size={19} strokeWidth={2.7} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {planType === "IR" ? (
                                <div className="min-w-0 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1.5">
                                    <WaiverPlayer player={incoming} fallback={playerName(entry.playerInId)} tone="incoming" />
                                </div>
                            ) : (
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
                            )}

                            <button
                                type="button"
                                className="grid size-8 place-items-center rounded-lg text-app-muted transition hover:bg-app-danger-surface hover:text-app-danger-foreground focus-visible:outline-2 focus-visible:outline-app-danger-foreground sm:size-9"
                                aria-label={`Remove waiver for ${playerName(entry.playerInId)}`}
                                onClick={() => onChange(entries.filter((_, itemIndex) => itemIndex !== index))}
                            >
                                <Trash2 aria-hidden="true" size={17} />
                            </button>
                        </li>
                    );
                })}
            </ol>

            {entries.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-app-border bg-app-surface-muted px-4 py-10 text-center">
                    <p className="font-bold text-app-foreground">No {planType === "IR" ? "IR " : ""}priorities yet</p>
                    <p className="mt-1 text-sm text-app-muted">
                        {planType === "IR"
                            ? "Use Waiver next to a player in your IR position. The highest-scoring legal fallback is always available."
                            : "Choose Waiver next to a player to prepare your first move."}
                    </p>
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
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
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

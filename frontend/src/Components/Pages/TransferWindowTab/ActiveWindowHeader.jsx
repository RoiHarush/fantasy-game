import {
    ArrowDownLeft,
    ArrowRight,
    ArrowRightLeft,
    CheckCircle2,
    Clock3,
    Play,
    ShieldCheck,
    SkipForward,
} from "@/src/shared/ui/icons";

import { Button } from "../../../shared/ui/Button";
import { isSameTransferId } from "../../../features/transfer-window/model";

export default function ActiveWindowHeader({
    title,
    isDraftMode,
    isSupplementalDraft,
    isIrRound,
    isClosing,
    currentUserId,
    currentUserName,
    currentUserAutomatic,
    viewingUser,
    currentPickNumber,
    totalPicks,
    turnsLeft,
    managerSummaries,
    lastTransferNotice,
    errorMessage,
    passPending,
    skipPending,
    onPass,
    onSkip,
    readOnly = false,
}) {
    const isMyTurn = isSameTransferId(currentUserId, viewingUser?.id);
    const canPass = !isIrRound && (!isDraftMode || isSupplementalDraft);
    const statusTitle = isClosing
        ? "Window complete"
        : isMyTurn
            ? "Your move"
            : `${currentUserName} is on the clock`;
    const statusDescription = isClosing
        ? "The final result will remain visible for a moment before the closed-window screen returns."
        : isIrRound
            ? "The IR replacement round is now in progress."
            : currentUserAutomatic
                ? "The saved waiver plan is being processed automatically."
                : isMyTurn
                    ? "Choose an available player or pass when you are ready."
                    : "Follow the live order below.";
    const turnDistance = getTurnDistanceMessage({ isClosing, isMyTurn, turnsLeft });

    return (
        <section className="relative isolate overflow-hidden pb-7 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:pb-9" aria-labelledby="active-window-title">
            <div className="pointer-events-none absolute -right-28 -top-28 -z-10 size-72 rounded-full bg-brand-cyan/8 blur-3xl dark:bg-brand-purple/10" aria-hidden="true" />
            <div className="h-1 w-16 rounded-full bg-component-gradient" aria-hidden="true" />

            <div className="mt-5 flex items-center gap-2 text-[0.66rem] font-black uppercase tracking-[0.18em] text-app-positive-foreground sm:text-xs">
                <span className="relative flex size-2" aria-hidden="true">
                    {!isClosing && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-50 motion-reduce:animate-none" />}
                    <span className={`relative inline-flex size-2 rounded-full ${isClosing ? "bg-app-accent" : "bg-emerald-500"}`} />
                </span>
                {isClosing ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
                {isClosing ? "Final move recorded" : title}
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-8">
                <div className="min-w-0">
                    <h1
                        id="active-window-title"
                        aria-label={statusTitle}
                        className="h-[4.25rem] overflow-hidden text-[2rem] leading-[1.06] font-black tracking-[-0.035em] text-app-foreground sm:h-[5.25rem] sm:text-4xl"
                    >
                        {isClosing || isMyTurn ? statusTitle : (
                            <>
                                <span className="block truncate" title={currentUserName}>{currentUserName}</span>
                                <span className="block">is on the clock</span>
                            </>
                        )}
                    </h1>
                    <p className="mt-2 line-clamp-2 min-h-12 max-w-xl text-sm leading-6 text-app-muted sm:line-clamp-1 sm:min-h-6">
                        {statusDescription}
                    </p>
                    <div className="mt-3 flex min-h-9 items-center">
                        {turnDistance && (
                            <span className={`inline-flex min-h-8 items-center gap-2 border-l-2 px-3 py-1.5 text-xs font-black tracking-wide ${isMyTurn ? "border-app-positive-border bg-app-positive-surface/45 text-app-positive-foreground" : "border-app-accent-border bg-app-accent-surface/60 text-app-accent-foreground"}`}>
                                <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                                {turnDistance}
                            </span>
                        )}
                    </div>
                </div>

                {!isClosing && (
                    <div className="flex min-w-0 items-center gap-2 sm:justify-end">
                        {currentPickNumber && (
                            <div className="mr-auto border-l-2 border-app-accent-border pl-3 sm:mr-2">
                                <span className="block text-[0.58rem] font-black uppercase tracking-[0.14em] text-app-muted">Current pick</span>
                                <strong className="text-xl font-black tabular-nums text-app-accent-foreground">{currentPickNumber}<span className="text-xs text-app-muted">/{totalPicks}</span></strong>
                            </div>
                        )}
                        {!readOnly && isMyTurn && canPass && (
                            <Button variant="secondary" size="sm" onClick={onPass} disabled={passPending}>
                                <SkipForward className="size-4" aria-hidden="true" />
                                {passPending ? "Passing…" : "Pass"}
                            </Button>
                        )}
                        {!readOnly && !isMyTurn && viewingUser?.leagueAdmin && (
                            <Button variant="secondary" size="sm" onClick={onSkip} disabled={skipPending} title="League-manager action: skip the manager currently on the clock">
                                <Play className="size-4" fill="currentColor" aria-hidden="true" />
                                {skipPending ? "Skipping…" : isIrRound ? "Resolve" : "Skip manager"}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div
                className={`mt-5 flex h-32 min-w-0 items-center overflow-hidden border-y py-3 text-sm sm:h-24 ${isClosing ? "border-app-positive-border bg-app-positive-surface/40" : "border-app-border"}`}
                role="status"
                aria-live="polite"
                aria-label="Latest transfer activity"
            >
                {lastTransferNotice ? (
                    <div className="flex w-full min-w-0 items-start gap-3 sm:items-center">
                        <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-app-positive-foreground sm:mt-0" aria-hidden="true" />
                        <TransferNotice notice={lastTransferNotice} />
                        {isClosing && <span className="ml-auto hidden shrink-0 text-[0.62rem] font-black uppercase tracking-[0.14em] text-app-positive-foreground sm:inline">Complete</span>}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-app-muted">
                        <ArrowRightLeft className="size-4 shrink-0 opacity-65" aria-hidden="true" />
                        <span className="text-xs font-semibold sm:text-sm">The latest move or pass will appear here.</span>
                    </div>
                )}
            </div>

            {errorMessage && (
                <p className="mt-4 border-l-2 border-app-danger-border py-2 pl-4 text-sm font-semibold text-app-danger-foreground" role="alert">
                    {errorMessage}
                </p>
            )}

            <SnakeOrder
                managerSummaries={managerSummaries}
                currentUserId={currentUserId}
                isClosing={isClosing}
            />
        </section>
    );
}

function SnakeOrder({ managerSummaries, currentUserId, isClosing }) {
    if (managerSummaries.length === 0) return null;

    return (
        <section className="mt-6 border-y border-app-border" aria-labelledby="snake-order-title">
            <header className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-2">
                    <ArrowRight className="size-4 text-app-accent" aria-hidden="true" />
                    <h2 id="snake-order-title" className="text-xs font-black uppercase tracking-[0.15em] text-app-accent-foreground">Snake order</h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wide text-app-muted">
                    Round 1 <ArrowDownLeft className="size-3" aria-hidden="true" /> Round 2
                </span>
            </header>
            <ol className="grid grid-cols-2 border-t border-app-border sm:grid-cols-4">
                {managerSummaries.map((manager) => {
                    const isCurrent = !isClosing && isSameTransferId(manager.id, currentUserId);
                    const done = manager.used >= manager.total;
                    return (
                        <li
                            key={manager.id}
                            aria-current={isCurrent ? "step" : undefined}
                            className={`relative min-w-0 border-r border-b border-app-border px-3 py-3 transition-colors last:border-r-0 ${isCurrent ? "bg-[linear-gradient(90deg,color-mix(in_srgb,var(--app-accent)_12%,transparent),transparent)]" : ""} ${done ? "opacity-55" : ""}`}
                        >
                            {isCurrent && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-cyan" aria-hidden="true" />}
                            <div className="flex min-w-0 items-center gap-2">
                                <span className={`size-2 shrink-0 rounded-full ${isCurrent ? "bg-brand-cyan shadow-[0_0_0_4px_color-mix(in_srgb,var(--app-accent)_18%,transparent)]" : done ? "bg-app-positive-foreground" : "bg-app-border"}`} aria-hidden="true" />
                                <strong className={`min-w-0 truncate text-xs sm:text-sm ${isCurrent ? "text-app-accent-foreground" : "text-app-foreground"}`}>{manager.name}</strong>
                            </div>
                            <div className="mt-2 flex min-w-0 items-center gap-1.5">
                                <PresenceBadge online={manager.online} automatic={manager.automatic} />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[0.58rem] font-black tabular-nums text-app-muted sm:text-[0.65rem]">
                                <span>{manager.pickNumbers.join(" · ")}</span>
                                <span>{manager.used}/{manager.total}</span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

function PresenceBadge({ online, automatic }) {
    return (
        <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`inline-flex items-center gap-1 text-[0.52rem] font-black uppercase tracking-[0.09em] ${online ? "text-app-positive-foreground" : "text-app-muted"}`}>
                <span className={`size-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-app-border"}`} aria-hidden="true" />
                {online ? "Online" : "Offline"}
            </span>
            {automatic && (
                <span className="inline-flex items-center gap-1 text-[0.52rem] font-black uppercase tracking-[0.09em] text-amber-600 dark:text-amber-300" title="This manager marked that they will not attend; their waiver plan will run automatically">
                    <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Away · auto
                </span>
            )}
        </span>
    );
}

function getTurnDistanceMessage({ isClosing, isMyTurn, turnsLeft }) {
    if (isClosing) return "The window is finishing";
    if (isMyTurn) return "Your turn";
    if (turnsLeft === 1) return "You are next · 1 pick to go";
    if (turnsLeft > 1) return `${turnsLeft} picks until your turn`;
    return null;
}

function TransferNotice({ notice }) {
    if (notice.type === "pass") {
        return (
            <span className="min-w-0 font-bold text-app-foreground">
                <strong>{notice.managerName}</strong> passed the turn
            </span>
        );
    }

    if (notice.type === "draft") {
        return (
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <strong className="text-app-foreground">{notice.managerName}</strong>
                <span className="text-app-muted">selected</span>
                <strong className="text-app-positive-foreground">{notice.playerInName}</strong>
            </span>
        );
    }

    return (
        <span className="block min-w-0 flex-1">
            <span className="block leading-5 text-app-muted">
                <strong className="text-app-foreground">{notice.managerName}</strong> completed a transfer
            </span>
            <span className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:mt-1.5 sm:max-w-2xl">
                <TransferPlayerSummary
                    label="Incoming"
                    playerName={notice.playerInName}
                    tone="incoming"
                />
                <ArrowRight className="mt-3.5 size-4 shrink-0 text-app-muted" aria-hidden="true" />
                <TransferPlayerSummary
                    label="Outgoing"
                    playerName={notice.playerOutName}
                    tone="outgoing"
                />
            </span>
        </span>
    );
}

function TransferPlayerSummary({ label, playerName, tone }) {
    const incoming = tone === "incoming";
    return (
        <span className={`min-w-0 border-l-2 py-1 pl-2 ${incoming ? "border-app-positive-border" : "border-app-danger-border"}`}>
            <span className={`block text-[0.55rem] font-black uppercase tracking-[0.12em] ${incoming ? "text-app-positive-foreground" : "text-app-danger-foreground"}`}>
                {label}
            </span>
            <strong className="mt-0.5 block truncate text-xs text-app-foreground sm:text-sm" title={playerName}>
                {playerName}
            </strong>
        </span>
    );
}

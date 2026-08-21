import {
    ArrowDownUp,
    CalendarClock,
    CalendarDays,
    Check,
    Clipboard,
    Info,
    Play,
    Save,
    Settings2,
    ShieldCheck,
    Shuffle,
    Trash2,
    Users,
} from "@/src/shared/ui/icons";

import { formatAppDateTime } from "../../../lib/dateTime";
import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import DraftConfirmationDialog from "./DraftConfirmationDialog";
import DraftCountdown from "./DraftCountdown";

export default function DraftLobbyView({
    isAdmin,
    supplementalDraft,
    league,
    users = [],
    rawDate,
    hasScheduledDraft,
    scheduledTime,
    orderSource,
    manualPicks = [],
    orderError,
    actionError,
    actionPending,
    openBlockedReason,
    scheduleBlockedReason,
    configuredScheduleBlockedReason,
    pendingAction,
    copied,
    copyError,
    onScheduledTimeChange,
    onOrderSourceChange,
    onManualPickChange,
    onSchedule,
    onPendingAction,
    onConfirmationOpenChange,
    onConfirmedAction,
    onCopyCode,
    onDraftTimeElapsed,
    readOnly = false,
}) {
    const participantCount = league?.participantCount ?? users.length;
    const maxParticipants = league?.maxParticipants ?? users.length;
    const leagueIsFull = maxParticipants > 0 && participantCount >= maxParticipants;

    return (
        <main className="mx-auto w-full max-w-5xl overflow-x-clip px-4 py-7 text-app-foreground sm:px-7 sm:py-11 lg:py-14">
            <header className="relative isolate overflow-hidden pb-8 sm:pb-10">
                <div className="pointer-events-none absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-purple/8 blur-3xl dark:bg-brand-cyan/8" aria-hidden="true" />
                <div className="h-1 w-16 rounded-full bg-component-gradient" aria-hidden="true" />

                <div className="mt-5 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-app-accent-foreground sm:text-xs">
                    <span className="relative flex size-2" aria-hidden="true">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-cyan opacity-45 motion-reduce:animate-none" />
                        <span className="relative inline-flex size-2 rounded-full bg-brand-cyan" />
                    </span>
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Draft lobby
                </div>

                <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] lg:items-end lg:gap-12">
                    <div className="min-w-0">
                        <h1 className="max-w-2xl text-[2.15rem] leading-[1.06] font-black tracking-[-0.035em] text-app-foreground sm:text-5xl sm:leading-[1.05]">
                            {supplementalDraft ? "Supplemental draft is waiting" : "Your draft room is ready"}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-app-muted sm:text-base sm:leading-7">
                            {supplementalDraft
                                ? "Set the order and start time for the next two-round draft."
                                : "Choose the draw order and schedule the opening draft when the league is ready."}
                        </p>
                    </div>

                    <DraftTiming
                        hasScheduledDraft={hasScheduledDraft}
                        rawDate={rawDate}
                        onDraftTimeElapsed={onDraftTimeElapsed}
                    />
                </div>
            </header>

            {actionError && (
                <p className="mb-6 border-l-2 border-app-danger-border py-2 pl-4 text-sm font-semibold text-app-danger-foreground" role="alert">
                    {actionError.message}
                </p>
            )}

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] border-y border-app-border lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="min-w-0 py-7 sm:py-9 lg:pr-12" aria-labelledby="draft-setup-title">
                    <div className="flex min-w-0 items-start gap-3">
                        <Settings2 className="mt-0.5 size-5 shrink-0 text-app-accent" aria-hidden="true" />
                        <div>
                            <h2 id="draft-setup-title" className="text-lg font-black tracking-tight sm:text-2xl">
                                {isAdmin ? "Room setup" : "Before the first pick"}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-app-muted sm:text-sm">
                                {isAdmin
                                    ? "Order, time and start."
                                    : "This room updates automatically when the draft starts."}
                            </p>
                        </div>
                    </div>

                    {isAdmin ? (
                        <AdminSetup
                            supplementalDraft={supplementalDraft}
                            hasScheduledDraft={hasScheduledDraft}
                            scheduledTime={scheduledTime}
                            orderSource={orderSource}
                            manualPicks={manualPicks}
                            users={users}
                            orderError={orderError}
                            actionPending={actionPending}
                            openBlockedReason={openBlockedReason}
                            scheduleBlockedReason={scheduleBlockedReason}
                            configuredScheduleBlockedReason={configuredScheduleBlockedReason}
                            onScheduledTimeChange={onScheduledTimeChange}
                            onOrderSourceChange={onOrderSourceChange}
                            onManualPickChange={onManualPickChange}
                            onSchedule={onSchedule}
                            onPendingAction={onPendingAction}
                            readOnly={readOnly}
                        />
                    ) : (
                        <ManagerGuidance supplementalDraft={supplementalDraft} />
                    )}
                </section>

                <aside className="min-w-0 border-t border-app-border py-7 sm:py-9 lg:border-l lg:border-t-0 lg:pl-9" aria-label="Draft readiness">
                    <ReadinessSummary
                        supplementalDraft={supplementalDraft}
                        participantCount={participantCount}
                        maxParticipants={maxParticipants}
                        leagueIsFull={leagueIsFull}
                    />

                    {!supplementalDraft && league?.leagueCode && (
                        <LeagueCode
                            leagueCode={league.leagueCode}
                            copied={copied}
                            copyError={copyError}
                            onCopyCode={onCopyCode}
                        />
                    )}

                    <DraftFormat supplementalDraft={supplementalDraft} />
                </aside>
            </div>

            <DraftConfirmationDialog
                pendingAction={pendingAction}
                onOpenChange={onConfirmationOpenChange}
                onConfirm={onConfirmedAction}
                isPending={actionPending}
                supplementalDraft={supplementalDraft}
            />
        </main>
    );
}

function DraftTiming({ hasScheduledDraft, rawDate, onDraftTimeElapsed }) {
    if (!hasScheduledDraft) {
        return (
            <div className="min-w-0 border-l-2 border-app-border pl-4 sm:pl-5">
                <div className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.15em] text-app-muted">
                    <CalendarClock className="size-4 text-app-accent" aria-hidden="true" />
                    Start time
                </div>
                <p className="mt-2 text-xl font-black tracking-tight text-app-foreground sm:text-2xl">Not scheduled yet</p>
                <p className="mt-1 text-xs leading-5 text-app-muted">Choose a date or open it now.</p>
            </div>
        );
    }

    return (
        <div className="min-w-0 border-l-2 border-app-accent-border pl-4 sm:pl-5">
            <div className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.15em] text-app-accent-foreground">
                <CalendarClock className="size-4" aria-hidden="true" />
                Scheduled draft
            </div>
            <p className="mt-2 text-base font-black tracking-tight text-app-foreground sm:text-lg">
                {formatAppDateTime(rawDate) || "Invalid date"}
            </p>
            <div className="mt-3 max-w-sm">
                <DraftCountdown value={rawDate} onElapsed={onDraftTimeElapsed} variant="units" />
            </div>
        </div>
    );
}

function AdminSetup({
    supplementalDraft,
    hasScheduledDraft,
    scheduledTime,
    orderSource,
    manualPicks,
    users,
    orderError,
    actionPending,
    openBlockedReason,
    scheduleBlockedReason,
    configuredScheduleBlockedReason,
    onScheduledTimeChange,
    onOrderSourceChange,
    onManualPickChange,
    onSchedule,
    onPendingAction,
    readOnly,
}) {
    return (
        <div className="mt-7 space-y-7">
            <section className="border-t border-app-border pt-5" aria-labelledby="draft-order-label">
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,0.75fr)_minmax(15rem,1fr)] sm:items-center">
                    <div>
                        <p id="draft-order-label" className="text-xs font-black uppercase tracking-[0.14em] text-app-accent-foreground">Selection order</p>
                        <p className="mt-1 text-xs leading-5 text-app-muted">
                            {supplementalDraft
                                ? "Reuse the next order or set one."
                                : "Run a random draw or enter your own first-round order."}
                        </p>
                    </div>
                    <SelectField
                        id="draft-order-source"
                        value={orderSource}
                        onValueChange={onOrderSourceChange}
                        options={[
                            {
                                value: "TRANSFER_ORDER",
                                label: supplementalDraft ? "Use upcoming transfer-window order" : "Random draw",
                            },
                            { value: "MANUAL", label: "Set order manually" },
                        ]}
                        ariaLabel="Draft order"
                        disabled={hasScheduledDraft || readOnly}
                        className="h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-sm font-semibold text-app-foreground outline-none transition focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface"
                    />
                </div>

                {orderSource === "MANUAL" && (
                    <ManualOrder
                        manualPicks={manualPicks}
                        users={users}
                        onManualPickChange={onManualPickChange}
                        disabled={hasScheduledDraft || readOnly}
                    />
                )}
            </section>

            {orderError && (
                <p className="border-l-2 border-app-danger-border py-2 pl-4 text-xs font-semibold text-app-danger-foreground sm:text-sm" role="alert">
                    {orderError}
                </p>
            )}

            <section className="border-t border-app-border pt-5" aria-labelledby="draft-time-label">
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,0.75fr)_minmax(15rem,1fr)] sm:items-end">
                    <div>
                        <p id="draft-time-label" className="text-xs font-black uppercase tracking-[0.14em] text-app-accent-foreground">Start decision</p>
                        <p className="mt-1 text-xs leading-5 text-app-muted">Schedule it or open now.</p>
                    </div>

                    {!hasScheduledDraft ? (
                        <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); onSchedule(); }}>
                            <label className="min-w-0" htmlFor="draft-scheduled-time">
                                <span className="sr-only">Draft date and time</span>
                                <span className="relative block">
                                    <CalendarDays aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-accent" />
                                    {!scheduledTime && (
                                        <span className="pointer-events-none absolute top-1/2 left-10 -translate-y-1/2 text-sm font-semibold text-app-muted" aria-hidden="true">26.1.25</span>
                                    )}
                                    <input
                                        id="draft-scheduled-time"
                                        type="datetime-local"
                                        value={scheduledTime}
                                        onChange={(event) => onScheduledTimeChange(event.target.value)}
                                        className={`h-11 w-full min-w-0 cursor-pointer rounded-xl border border-app-border bg-app-surface-elevated pr-3 pl-10 text-sm font-semibold outline-none [color-scheme:light] transition pointer-fine:hover:border-app-accent-border focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface dark:[color-scheme:dark] ${scheduledTime ? "text-app-foreground" : "text-transparent"}`}
                                    />
                                </span>
                            </label>
                            <Button type="submit" disabled={readOnly || actionPending || !scheduledTime || Boolean(scheduleBlockedReason)} className="w-full justify-between">
                                Schedule draft
                                <Save aria-hidden="true" size={17} />
                            </Button>
                            {scheduleBlockedReason && (
                                <p className="text-xs font-semibold text-app-danger-foreground" role="alert">
                                    {scheduleBlockedReason}
                                </p>
                            )}
                        </form>
                    ) : (
                        <div>
                            <Button variant="danger" className="w-full justify-between" onClick={() => onPendingAction("delete")} disabled={readOnly || actionPending}>
                                Cancel scheduled draft
                                <Trash2 aria-hidden="true" size={17} />
                            </Button>
                            {configuredScheduleBlockedReason && (
                                <p className="mt-2 text-xs font-semibold text-app-danger-foreground" role="alert">
                                    {configuredScheduleBlockedReason}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-dashed border-app-border pt-4">
                    <span className="hidden text-xs leading-5 text-app-muted sm:block sm:flex-1">Opens the live room for everyone.</span>
                    <Button variant="success" className="w-full justify-between sm:w-auto" onClick={() => onPendingAction("open")} disabled={readOnly || actionPending || Boolean(openBlockedReason)}>
                        Open draft now
                        <Play aria-hidden="true" size={17} fill="currentColor" />
                    </Button>
                </div>
                {openBlockedReason && (
                    <p className="mt-2 text-xs font-semibold text-app-danger-foreground" role="status">
                        {openBlockedReason}
                    </p>
                )}
            </section>
        </div>
    );
}

function ManualOrder({ manualPicks, users, onManualPickChange, disabled = false }) {
    return (
        <div className="mt-5 border-y border-app-border py-4">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-app-muted">
                <span className="inline-flex items-center gap-2"><ArrowDownUp aria-hidden="true" size={15} /> Manual pick order</span>
                <span>{manualPicks.length} picks</span>
            </div>
            <div className="grid max-h-80 gap-x-5 overflow-y-auto overscroll-contain sm:grid-cols-2">
                {manualPicks.map((selectedUserId, index) => (
                    <label key={index} className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 border-b border-app-border py-2">
                        <span className="font-mono text-xs font-black tabular-nums text-app-accent-foreground">{String(index + 1).padStart(2, "0")}</span>
                        <SelectField
                            value={selectedUserId}
                            onValueChange={(value) => onManualPickChange(index, value)}
                            options={[
                                { value: "", label: "Select manager" },
                                ...users.map((manager) => ({ value: manager.id, label: manager.name })),
                            ]}
                            ariaLabel={`Manager for pick ${index + 1}`}
                            disabled={disabled}
                            className="h-9 min-w-0 rounded-lg border border-app-border bg-app-surface-elevated px-2.5 text-xs font-semibold text-app-foreground outline-none focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface"
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}

function ManagerGuidance({ supplementalDraft }) {
    return (
        <div className="mt-7 grid gap-4 border-y border-app-border py-5 sm:grid-cols-3">
            {[
                ["01", "Come early", "Join before the start."],
                ["02", "Follow live", "Every pick updates live."],
                ["03", supplementalDraft ? "Two decisions" : "Build the squad", supplementalDraft ? "Pick, replace or pass." : "The order runs in snake rounds."],
            ].map(([step, title, copy]) => (
                <div key={step} className="border-l border-app-border pl-3">
                    <span className="font-mono text-xs font-black text-app-accent">{step}</span>
                    <p className="mt-2 text-sm font-black text-app-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-app-muted">{copy}</p>
                </div>
            ))}
        </div>
    );
}

function ReadinessSummary({ supplementalDraft, participantCount, maxParticipants, leagueIsFull }) {
    const progress = maxParticipants > 0 ? Math.min(100, Math.round((participantCount / maxParticipants) * 100)) : 0;

    return (
        <section aria-labelledby="draft-readiness-title">
            <div className="flex items-center gap-2 text-app-accent-foreground">
                <Users className="size-4" aria-hidden="true" />
                <h2 id="draft-readiness-title" className="text-xs font-black uppercase tracking-[0.15em]">Readiness</h2>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                    <strong className="text-3xl font-black tabular-nums text-app-foreground">{participantCount}</strong>
                    <span className="ml-1 text-sm font-bold text-app-muted">/ {maxParticipants}</span>
                </div>
                <span className={`text-xs font-black ${leagueIsFull ? "text-app-positive-foreground" : "text-app-muted"}`}>
                    {leagueIsFull ? "League ready" : "Managers joined"}
                </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-app-surface-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-component-gradient transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            {!leagueIsFull && !supplementalDraft && (
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-app-muted">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-app-accent" aria-hidden="true" />
                    All configured managers must join first.
                </p>
            )}
        </section>
    );
}

function LeagueCode({ leagueCode, copied, copyError, onCopyCode }) {
    return (
        <section className="mt-8 border-t border-app-border pt-7" aria-labelledby="league-code-title">
            <p id="league-code-title" className="text-xs font-black uppercase tracking-[0.15em] text-app-accent-foreground">League code</p>
            <div className="mt-3 flex items-center justify-between gap-3">
                <strong className="min-w-0 truncate text-xl font-black tracking-[0.1em] text-app-foreground">{leagueCode}</strong>
                <Button type="button" variant="secondary" size="icon" onClick={onCopyCode} className="size-9 rounded-full text-app-muted" aria-label="Copy league code">
                    {copied ? <Check aria-hidden="true" size={16} /> : <Clipboard aria-hidden="true" size={16} />}
                </Button>
            </div>
            {copyError && <p className="mt-2 text-xs text-app-danger-foreground" role="alert">{copyError}</p>}
        </section>
    );
}

function DraftFormat({ supplementalDraft }) {
    return (
        <section className="mt-8 border-t border-app-border pt-7" aria-labelledby="draft-format-title">
            <div className="flex items-center gap-2 text-app-accent-foreground">
                <Shuffle className="size-4" aria-hidden="true" />
                <h2 id="draft-format-title" className="text-xs font-black uppercase tracking-[0.15em]">Format</h2>
            </div>
            <p className="mt-3 text-sm font-black text-app-foreground">{supplementalDraft ? "Two-round snake" : "Opening snake draft"}</p>
            <p className="mt-1 text-xs leading-5 text-app-muted">
                {supplementalDraft
                    ? "Pick a new arrival, replace or pass."
                    : "The selected first-round order reverses every round."}
            </p>
        </section>
    );
}

import * as Dialog from "@radix-ui/react-dialog";
import {
    ArrowDownUp,
    CalendarDays,
    CalendarClock,
    Check,
    Clipboard,
    Clock3,
    Info,
    Play,
    Save,
    Settings2,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";

import { useDraftAction } from "../../../features/draft/useDraft";
import { validateTransferOrder } from "../../../features/transfer-window/model";
import { formatAppDateTime } from "../../../lib/dateTime";
import { Button } from "../../../shared/ui/Button";
import DraftCountdown from "./DraftCountdown";

function DraftLobby({ isAdmin, config, league, users = [], onDraftTimeElapsed }) {
    const [scheduledTime, setScheduledTime] = useState("");
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");
    const [pendingAction, setPendingAction] = useState(null);
    const [orderSource, setOrderSource] = useState("TRANSFER_ORDER");
    const [manualOrder, setManualOrder] = useState([]);
    const [orderError, setOrderError] = useState("");
    const draftAction = useDraftAction(league?.id, {
        onSuccess: (_result, action) => {
            if (action.type === "schedule") setScheduledTime("");
            setPendingAction(null);
        },
    });

    const supplementalDraft = league?.status === "ACTIVE";
    const pickCount = users.length * 2;
    const manualPicks = Array.from({ length: pickCount }, (_, index) => (
        manualOrder[index] == null ? "" : String(manualOrder[index])
    ));

    const getDraftOrder = () => {
        if (!supplementalDraft || orderSource !== "MANUAL") {
            setOrderError("");
            return { orderSource: "TRANSFER_ORDER", order: [] };
        }
        const cleanOrder = manualPicks.filter(Boolean).map(Number);
        const error = validateTransferOrder(cleanOrder, users.map(user => user.id));
        if (error) {
            setOrderError(error);
            return null;
        }
        setOrderError("");
        return { orderSource: "MANUAL", order: cleanOrder };
    };

    const handleSchedule = () => {
        if (!scheduledTime) return;
        const orderOptions = getDraftOrder();
        if (!orderOptions) return;
        draftAction.mutate({ type: "schedule", time: scheduledTime, ...orderOptions });
    };

    const handleConfirmedAction = () => {
        if (!pendingAction) return;
        if (pendingAction === "open") {
            const orderOptions = getDraftOrder();
            if (!orderOptions) return;
            draftAction.mutate({ type: pendingAction, ...orderOptions });
            return;
        }
        draftAction.mutate({ type: pendingAction });
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(league.leagueCode);
            setCopied(true);
            setCopyError("");
        } catch {
            setCopyError("The league code could not be copied. Please copy it manually.");
        }
    };

    const rawDate = config?.scheduledTime || config?.scheduled_time;
    const hasScheduledDraft = Boolean(rawDate && !config.processed);

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 px-3 py-5 text-app-foreground sm:px-6 sm:py-9 lg:py-12">
            <section className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel sm:rounded-3xl">
                <div className="h-1.5 bg-component-gradient" aria-hidden="true" />
                <div className="relative grid gap-5 p-4 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)] lg:items-center">
                    <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-app-accent-surface blur-3xl" aria-hidden="true" />
                    <div className="relative flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground shadow-sm sm:size-13 sm:rounded-2xl">
                            <Clock3 aria-hidden="true" className="size-5 sm:size-6" />
                        </span>
                        <div className="min-w-0">
                            <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-app-border bg-app-surface-muted px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-app-muted sm:text-[0.68rem]">
                                <ShieldCheck aria-hidden="true" size={12} />
                                Draft lobby
                            </div>
                            <h1 className="text-xl font-black tracking-tight text-app-foreground sm:text-3xl">
                                {supplementalDraft ? "Supplemental Draft Room" : "Draft Room"}
                            </h1>
                            <p className="mt-1 max-w-xl text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                                {supplementalDraft
                                    ? "Prepare the next two-round draft for newly arrived players."
                                    : "Bring every manager together, schedule the draft and get ready for the first pick."}
                            </p>
                        </div>
                    </div>

                    <DraftStatusCard
                        hasScheduledDraft={hasScheduledDraft}
                        rawDate={rawDate}
                        onDraftTimeElapsed={onDraftTimeElapsed}
                    />
                </div>
            </section>

            {draftAction.error && (
                <p className="mx-auto max-w-3xl rounded-2xl border border-app-danger-border bg-app-danger-surface p-4 text-sm font-semibold text-app-danger-foreground" role="alert">
                    {draftAction.error.message}
                </p>
            )}

            {league?.leagueCode && (
                <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                            <Users aria-hidden="true" size={19} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-app-muted">League code</p>
                            <div className="mt-0.5 flex min-w-0 items-center gap-2">
                                <strong className="truncate text-lg font-black tracking-[0.08em] text-app-foreground sm:text-xl">{league.leagueCode}</strong>
                                <span className="whitespace-nowrap text-xs font-semibold text-app-muted">
                                    {league.participantCount}/{league.maxParticipants} joined
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        className="w-full border-app-border bg-app-surface-muted text-app-foreground hover:bg-app-accent-hover sm:w-auto"
                        onClick={handleCopyCode}
                    >
                        {copied ? <Check aria-hidden="true" size={17} /> : <Clipboard aria-hidden="true" size={17} />}
                        {copied ? "Copied" : "Copy code"}
                    </Button>
                    {copyError && <p className="text-xs text-app-danger-foreground" role="alert">{copyError}</p>}
                </section>
            )}

            {league?.participantCount < league?.maxParticipants && (
                <p className="mx-auto flex max-w-3xl items-start gap-2 rounded-2xl border border-app-accent-border bg-app-accent-surface px-4 py-3 text-xs leading-5 text-app-accent-foreground sm:text-sm">
                    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    The draft can start only after every configured manager has joined the league.
                </p>
            )}

            {isAdmin ? (
                <AdminControls
                    supplementalDraft={supplementalDraft}
                    hasScheduledDraft={hasScheduledDraft}
                    scheduledTime={scheduledTime}
                    setScheduledTime={setScheduledTime}
                    orderSource={orderSource}
                    setOrderSource={setOrderSource}
                    manualPicks={manualPicks}
                    setManualOrder={setManualOrder}
                    setOrderError={setOrderError}
                    users={users}
                    orderError={orderError}
                    draftAction={draftAction}
                    onSchedule={handleSchedule}
                    onPendingAction={setPendingAction}
                />
            ) : (
                <section className="mx-auto w-full max-w-3xl rounded-2xl border border-app-border bg-app-surface px-4 py-4 shadow-sm sm:px-5">
                    <div className="flex items-start gap-3">
                        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-app-accent" />
                        <div className="text-left">
                            <h2 className="text-sm font-extrabold text-app-foreground">Be ready before the draft</h2>
                            <p className="mt-1 text-xs leading-5 text-app-muted sm:text-sm">
                                Please join 10 minutes early. {supplementalDraft
                                    ? "Every manager receives two picks and may pass or replace a squad player with a newly arrived player."
                                    : "The first order is drawn randomly, followed by snake rounds."}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            <ConfirmationDialog
                pendingAction={pendingAction}
                onOpenChange={(open) => !open && setPendingAction(null)}
                onConfirm={handleConfirmedAction}
                isPending={draftAction.isPending}
                supplementalDraft={supplementalDraft}
            />
        </main>
    );
}

function DraftStatusCard({ hasScheduledDraft, rawDate, onDraftTimeElapsed }) {
    if (!hasScheduledDraft) {
        return (
            <div className="relative rounded-xl border border-dashed border-app-border bg-app-surface-muted p-4 sm:rounded-2xl sm:p-5">
                <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-app-surface text-app-muted ring-1 ring-app-border">
                        <CalendarClock aria-hidden="true" size={18} />
                    </span>
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-app-muted">Draft status</p>
                        <p className="mt-0.5 text-sm font-black text-app-foreground sm:text-base">Not scheduled yet</p>
                    </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-app-muted">The league manager can choose a date or open the room manually.</p>
            </div>
        );
    }

    return (
        <div className="relative rounded-xl border border-app-border bg-app-surface-elevated p-4 shadow-sm sm:rounded-2xl sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-component-gradient text-brand-ink">
                    <CalendarClock aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0">
                    <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-app-muted">Scheduled draft</p>
                    <p className="truncate text-sm font-black text-app-foreground sm:text-base">
                        {formatAppDateTime(rawDate) || "Invalid date"}
                    </p>
                </div>
            </div>
            <div className="mt-3 border-t border-app-border pt-3">
                <p className="mb-1.5 text-[0.65rem] font-bold text-app-muted">Draft starts in</p>
                <DraftCountdown value={rawDate} onElapsed={onDraftTimeElapsed} variant="units" />
            </div>
        </div>
    );
}

function AdminControls({
    supplementalDraft,
    hasScheduledDraft,
    scheduledTime,
    setScheduledTime,
    orderSource,
    setOrderSource,
    manualPicks,
    setManualOrder,
    setOrderError,
    users,
    orderError,
    draftAction,
    onSchedule,
    onPendingAction,
}) {
    return (
        <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel sm:rounded-3xl">
            <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-6 sm:py-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                    <Settings2 aria-hidden="true" size={19} />
                </span>
                <div>
                    <h2 className="text-base font-black text-app-foreground sm:text-xl">League controls</h2>
                    <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Schedule the room, configure its order or open it immediately.</p>
                </div>
            </header>

            <div className="space-y-5 p-4 sm:p-6">
                {supplementalDraft && (
                    <label className="block" htmlFor="supplemental-order-source">
                        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.1em] text-app-muted">Draft order</span>
                        <select
                            id="supplemental-order-source"
                            value={orderSource}
                            onChange={(event) => {
                                setOrderSource(event.target.value);
                                setOrderError("");
                            }}
                            className="h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-sm font-semibold text-app-foreground outline-none transition focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface"
                        >
                            <option value="TRANSFER_ORDER">Use upcoming transfer-window order</option>
                            <option value="MANUAL">Set order manually</option>
                        </select>
                    </label>
                )}

                {supplementalDraft && orderSource === "MANUAL" && (
                    <div className="max-h-80 space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-app-border bg-app-surface-muted p-3">
                        <div className="mb-3 flex items-center gap-2 px-1 text-xs font-extrabold uppercase tracking-[0.1em] text-app-muted">
                            <ArrowDownUp aria-hidden="true" size={15} /> Manual pick order
                        </div>
                        {manualPicks.map((selectedUserId, index) => (
                            <label key={index} className="flex items-center gap-3 rounded-xl border border-app-border bg-app-surface p-2.5">
                                <span className="w-10 shrink-0 text-center text-xs font-black text-app-accent-foreground">#{index + 1}</span>
                                <select
                                    value={selectedUserId}
                                    onChange={(event) => {
                                        const nextOrder = [...manualPicks];
                                        nextOrder[index] = event.target.value;
                                        setManualOrder(nextOrder);
                                        setOrderError("");
                                    }}
                                    className="h-10 min-w-0 flex-1 rounded-lg border border-app-border bg-app-surface-elevated px-2.5 text-xs font-semibold text-app-foreground outline-none focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface sm:text-sm"
                                >
                                    <option value="">Select manager</option>
                                    {users.map(manager => (
                                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                )}

                {orderError && (
                    <p className="rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-xs font-semibold text-app-danger-foreground sm:text-sm" role="alert">
                        {orderError}
                    </p>
                )}

                {!hasScheduledDraft ? (
                    <form
                        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSchedule();
                        }}
                    >
                        <label className="min-w-0" htmlFor="draft-scheduled-time">
                            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-app-muted">
                                <CalendarDays aria-hidden="true" size={15} />
                                Draft date and time
                            </span>
                            <span className="relative block">
                                <CalendarDays aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-accent" />
                                {!scheduledTime && (
                                    <span className="pointer-events-none absolute top-1/2 left-10 -translate-y-1/2 text-sm font-semibold text-app-muted" aria-hidden="true">
                                        26.1.25
                                    </span>
                                )}
                                <input
                                    id="draft-scheduled-time"
                                    type="datetime-local"
                                    value={scheduledTime}
                                    onChange={(event) => setScheduledTime(event.target.value)}
                                    className={`h-11 w-full min-w-0 cursor-pointer rounded-xl border border-app-border bg-app-surface-elevated pr-3 pl-10 text-sm font-semibold outline-none [color-scheme:light] transition hover:border-app-accent-border focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface dark:[color-scheme:dark] ${scheduledTime ? "text-app-foreground" : "text-transparent"}`}
                                />
                            </span>
                        </label>
                        <Button type="submit" disabled={draftAction.isPending || !scheduledTime}>
                            <Save aria-hidden="true" size={17} />
                            Schedule draft
                        </Button>
                    </form>
                ) : (
                    <Button
                        variant="danger"
                        className="w-full"
                        onClick={() => onPendingAction("delete")}
                        disabled={draftAction.isPending}
                    >
                        <Trash2 aria-hidden="true" size={17} />
                        Cancel scheduled draft
                    </Button>
                )}

                <Button
                    variant="success"
                    className="w-full"
                    onClick={() => onPendingAction("open")}
                    disabled={draftAction.isPending}
                >
                    <Play aria-hidden="true" size={17} fill="currentColor" />
                    Open draft now
                </Button>
            </div>
        </section>
    );
}

function ConfirmationDialog({ pendingAction, onOpenChange, onConfirm, isPending, supplementalDraft }) {
    const isOpening = pendingAction === "open";

    return (
        <Dialog.Root open={Boolean(pendingAction)} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm" />
                <Dialog.Content className="fixed bottom-0 left-1/2 z-[5001] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-t-3xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none sm:top-1/2 sm:bottom-auto sm:w-[min(calc(100vw-1.5rem),27rem)] sm:-translate-y-1/2 sm:rounded-3xl">
                    <div className="h-1.5 bg-component-gradient" aria-hidden="true" />
                    <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-app-muted hover:bg-app-accent-hover hover:text-app-foreground" aria-label="Close confirmation">
                                <X aria-hidden="true" size={20} />
                            </Button>
                        </Dialog.Close>
                        <span className={`grid size-10 place-items-center rounded-xl ring-1 sm:size-12 sm:rounded-2xl ${isOpening ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-300" : "bg-app-danger-surface text-app-danger-foreground ring-app-danger-border"}`}>
                            {isOpening ? <Play aria-hidden="true" size={20} fill="currentColor" /> : <Trash2 aria-hidden="true" size={20} />}
                        </span>
                        <Dialog.Title className="mt-4 pr-10 text-lg font-black sm:mt-5 sm:text-2xl">
                            {isOpening ? "Open the draft now?" : "Cancel the scheduled draft?"}
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                            {isOpening
                                ? supplementalDraft
                                    ? "This starts the two-round supplemental draft immediately for every league manager."
                                    : "This starts the initial snake draft immediately for every league manager."
                                : "The current date and countdown will be removed for every league manager."}
                        </Dialog.Description>
                        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
                            <Dialog.Close asChild>
                                <Button variant="secondary" className="border-app-border bg-app-surface-muted text-app-foreground hover:bg-app-accent-hover" disabled={isPending}>Back</Button>
                            </Dialog.Close>
                            <Button
                                variant={isOpening ? "success" : "danger"}
                                onClick={onConfirm}
                                disabled={isPending}
                            >
                                {isPending ? "Saving…" : "Confirm"}
                            </Button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default DraftLobby;

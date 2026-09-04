"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../../../Context/AuthContext";
import {
    useAcceptTradeOffer,
    useCancelTradeOffer,
    useCreateTradeOffer,
    useRejectTradeOffer,
    useTradeContext,
    useTradeOffers,
} from "../../../features/trades/useTrades";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";
import SelectField from "../../../shared/ui/SelectField";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Clock3, Plus, Trash2 } from "../../../shared/ui/icons";
import PlayerKit from "../../General/PlayerKit";

const STATUS_STYLES = {
    PENDING: "border-amber-400/35 bg-amber-400/10 text-amber-700 dark:text-amber-200",
    ACCEPTED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
    REJECTED: "border-red-400/35 bg-red-400/10 text-red-700 dark:text-red-200",
    CANCELLED: "border-app-border bg-app-surface-muted text-app-muted",
    INVALIDATED: "border-app-border bg-app-surface-muted text-app-muted",
};

function errorMessage(error) {
    return error?.message || "Something went wrong. Please try again.";
}

function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function managerLabel(manager) {
    return manager.teamName ? `${manager.teamName} · ${manager.userName}` : manager.userName;
}

function playerLabel(player) {
    return `${player.name} · ${player.position}`;
}

function PlayerPill({ player, tone = "out" }) {
    return (
        <div className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 ${tone === "in" ? "border-emerald-400/30 bg-emerald-400/8" : "border-fuchsia-400/25 bg-fuchsia-400/8"}`}>
            <PlayerKit
                teamId={player.teamId}
                type={player.position === "GK" ? "gk" : "field"}
                className="block size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-app-foreground">{player.name}</p>
                <p className="text-[0.65rem] font-black uppercase tracking-wider text-app-muted">{player.position}</p>
            </div>
        </div>
    );
}

function TradePairs({ items }) {
    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={`${item.offeredPlayer.id}-${item.requestedPlayer.id}`} className="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-2">
                    <PlayerPill player={item.offeredPlayer} />
                    <span className="grid size-8 place-items-center rounded-full border border-app-border bg-app-surface-elevated text-app-accent-foreground" aria-label={`Swap ${index + 1}`}>
                        <ArrowLeftRight className="size-3.5" aria-hidden="true" />
                    </span>
                    <PlayerPill player={item.requestedPlayer} tone="in" />
                </div>
            ))}
        </div>
    );
}

function OfferCard({ offer, direction, onAction }) {
    const other = direction === "incoming" ? offer.proposer : offer.recipient;
    const pendingAction = onAction.pendingId === offer.id;
    return (
        <article className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated shadow-sm">
            <header className="flex items-start justify-between gap-3 border-b border-app-border bg-app-surface-muted/55 px-4 py-3">
                <div className="min-w-0">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-app-muted">
                        {direction === "incoming" ? "Offer from" : "Offer to"}
                    </p>
                    <h3 className="truncate text-base font-extrabold text-app-foreground">{managerLabel(other)}</h3>
                    <p className="mt-0.5 text-xs text-app-muted">{formatDate(offer.createdAt)}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider ${STATUS_STYLES[offer.status] || STATUS_STYLES.INVALIDATED}`}>
                    {offer.status.toLowerCase().replace("_", " ")}
                </span>
            </header>
            <div className="space-y-3 p-4">
                <div className="grid grid-cols-[1fr_2rem_1fr] gap-2 text-center text-[0.62rem] font-black uppercase tracking-wider text-app-muted">
                    <span>{direction === "incoming" ? "They give" : "You give"}</span><span />
                    <span>{direction === "incoming" ? "You give" : "You receive"}</span>
                </div>
                <TradePairs items={offer.items} />
                {offer.message && <p className="rounded-xl border-l-2 border-brand-cyan bg-app-accent-surface px-3 py-2 text-sm text-app-foreground">“{offer.message}”</p>}
            </div>
            {(offer.canAccept || offer.canReject || offer.canCancel) && (
                <footer className="flex gap-2 border-t border-app-border px-4 py-3">
                    {offer.canReject && <Button size="sm" variant="danger" className="flex-1" disabled={pendingAction} onClick={() => onAction.reject(offer)}>Decline</Button>}
                    {offer.canCancel && <Button size="sm" variant="outline" className="flex-1" disabled={pendingAction} onClick={() => onAction.cancel(offer)}>Cancel offer</Button>}
                    {offer.canAccept && <Button size="sm" variant="success" className="flex-1" disabled={pendingAction || !onAction.available} onClick={() => onAction.confirm(offer)}>{onAction.available ? "Review & accept" : "Trading paused"}</Button>}
                </footer>
            )}
        </article>
    );
}

function OffersSection({ title, subtitle, offers, direction, actions }) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-xl font-black text-app-foreground">{title}</h2>
                <p className="text-sm text-app-muted">{subtitle}</p>
            </div>
            {offers.length ? offers.map((offer) => <OfferCard key={offer.id} offer={offer} direction={direction} onAction={actions} />) : (
                <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted/40 px-5 py-8 text-center">
                    <ArrowLeftRight className="mx-auto size-6 text-app-muted" aria-hidden="true" />
                    <p className="mt-2 text-sm font-bold text-app-muted">No {direction} trade offers yet.</p>
                </div>
            )}
        </section>
    );
}

function TradeBuilder({ context, open, onOpenChange, onSubmit, saving }) {
    const [recipientId, setRecipientId] = useState("");
    const [pairs, setPairs] = useState([{ offeredPlayerId: "", requestedPlayerId: "" }]);
    const [message, setMessage] = useState("");
    const current = context.managers.find((manager) => manager.userId === context.currentUserId);
    const recipient = context.managers.find((manager) => String(manager.userId) === String(recipientId));

    function reset() {
        setRecipientId("");
        setPairs([{ offeredPlayerId: "", requestedPlayerId: "" }]);
        setMessage("");
    }

    function updatePair(index, field, value) {
        setPairs((items) => items.map((item, itemIndex) => itemIndex === index ? {
            ...item,
            [field]: value,
            ...(field === "offeredPlayerId" ? { requestedPlayerId: "" } : {}),
        } : item));
    }

    const complete = Boolean(recipient && pairs.length && pairs.every((pair) => pair.offeredPlayerId && pair.requestedPlayerId));

    async function submit() {
        if (!complete) return;
        try {
            await onSubmit({
                recipientUserId: Number(recipientId),
                items: pairs.map((pair) => ({ offeredPlayerId: Number(pair.offeredPlayerId), requestedPlayerId: Number(pair.requestedPlayerId) })),
                message: message.trim() || null,
            });
            toast.success("Trade offer sent");
            reset();
            onOpenChange(false);
        } catch (error) {
            toast.error(errorMessage(error));
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !saving) reset(); onOpenChange(next); }}>
            <ResponsiveDialogSurface className="flex max-h-[94dvh] flex-col sm:w-[min(calc(100vw-2rem),46rem)]">
                <header className="relative shrink-0 border-b border-app-border bg-component-gradient px-5 py-5 text-brand-ink">
                    <Dialog.Title className="pr-10 text-xl font-black">Build a trade offer</Dialog.Title>
                    <Dialog.Description className="mt-1 pr-10 text-sm font-semibold text-brand-ink/70">Every swap must match positions. The full deal is accepted or rejected together.</Dialog.Description>
                    <Dialog.Close asChild><CloseButton className="absolute right-3 top-3" disabled={saving} /></Dialog.Close>
                </header>
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                    <label className="block space-y-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-app-muted">Trade with</span>
                        <SelectField
                            value={recipientId}
                            onValueChange={(value) => { setRecipientId(value); setPairs([{ offeredPlayerId: "", requestedPlayerId: "" }]); }}
                            placeholder="Choose a league manager"
                            options={context.managers.filter((manager) => manager.userId !== context.currentUserId).map((manager) => ({ value: manager.userId, label: managerLabel(manager) }))}
                        />
                    </label>

                    {recipient && pairs.map((pair, index) => {
                        const offered = current?.players.find((player) => String(player.id) === String(pair.offeredPlayerId));
                        const usedOffered = new Set(pairs.filter((_, i) => i !== index).map((item) => String(item.offeredPlayerId)));
                        const usedRequested = new Set(pairs.filter((_, i) => i !== index).map((item) => String(item.requestedPlayerId)));
                        return (
                            <fieldset key={index} className="rounded-2xl border border-app-border bg-app-surface-muted/45 p-3 sm:p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <legend className="text-sm font-black text-app-foreground">Swap {index + 1}</legend>
                                    {pairs.length > 1 && <Button size="icon" variant="ghost" className="size-8 text-red-500" onClick={() => setPairs((items) => items.filter((_, i) => i !== index))} aria-label={`Remove swap ${index + 1}`}><Trash2 className="size-4" /></Button>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                                    <label className="space-y-1.5">
                                        <span className="text-[0.65rem] font-black uppercase tracking-wider text-app-muted">You give</span>
                                        <SelectField value={pair.offeredPlayerId} onValueChange={(value) => updatePair(index, "offeredPlayerId", value)} placeholder="Your player" options={(current?.players || []).map((player) => ({ value: player.id, label: playerLabel(player), disabled: usedOffered.has(String(player.id)) }))} />
                                    </label>
                                    <span className="mx-auto grid size-9 place-items-center rounded-full border border-app-accent-border bg-app-accent-surface text-app-accent-foreground"><ArrowLeftRight className="size-4" /></span>
                                    <label className="space-y-1.5">
                                        <span className="text-[0.65rem] font-black uppercase tracking-wider text-app-muted">You receive</span>
                                        <SelectField value={pair.requestedPlayerId} onValueChange={(value) => updatePair(index, "requestedPlayerId", value)} disabled={!offered} placeholder={offered ? `${offered.position} player` : "Choose yours first"} options={recipient.players.filter((player) => player.position === offered?.position).map((player) => ({ value: player.id, label: playerLabel(player), disabled: usedRequested.has(String(player.id)) }))} />
                                    </label>
                                </div>
                            </fieldset>
                        );
                    })}

                    {recipient && pairs.length < 15 && <Button variant="outline" className="w-full border-dashed" onClick={() => setPairs((items) => [...items, { offeredPlayerId: "", requestedPlayerId: "" }])}><Plus className="size-4" /> Add another position swap</Button>}

                    <label className="block space-y-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-app-muted">Message <span className="font-semibold normal-case tracking-normal">(optional)</span></span>
                        <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 500))} rows={3} placeholder="Add a note to your offer…" className="w-full resize-none rounded-xl border border-app-border bg-app-surface-elevated px-3.5 py-3 text-sm text-app-foreground outline-none transition focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-border/30" />
                        <span className="block text-right text-[0.65rem] text-app-muted">{message.length}/500</span>
                    </label>
                </div>
                <footer className="flex shrink-0 gap-2 border-t border-app-border bg-app-surface px-4 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:justify-end sm:px-6">
                    <Dialog.Close asChild><Button variant="secondary" className="flex-1 sm:flex-none" disabled={saving}>Cancel</Button></Dialog.Close>
                    <Button className="flex-1 sm:flex-none" disabled={!complete || saving} onClick={submit}>{saving ? "Sending…" : "Send offer"}</Button>
                </footer>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

function AcceptDialog({ offer, onClose, onAccept, saving }) {
    if (!offer) return null;
    return (
        <Dialog.Root open onOpenChange={(open) => !open && !saving && onClose()}>
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-2rem),34rem)]">
                <header className="relative border-b border-app-border bg-component-gradient px-5 py-5 text-brand-ink">
                    <Dialog.Title className="pr-10 text-xl font-black">Accept this trade?</Dialog.Title>
                    <Dialog.Description className="mt-1 pr-8 text-sm font-semibold text-brand-ink/70">All {offer.items.length} swap{offer.items.length === 1 ? "" : "s"} happen immediately and together.</Dialog.Description>
                    <Dialog.Close asChild><CloseButton className="absolute right-3 top-3" /></Dialog.Close>
                </header>
                <div className="space-y-3 p-4 sm:p-6"><TradePairs items={offer.items} /><p className="flex gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-800 dark:text-amber-100"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> Your saved squad slots and captain assignments move safely with the replacement players.</p></div>
                <footer className="flex gap-2 border-t border-app-border p-4 sm:justify-end"><Dialog.Close asChild><Button variant="secondary" className="flex-1 sm:flex-none" disabled={saving}>Go back</Button></Dialog.Close><Button variant="success" className="flex-1 sm:flex-none" disabled={saving} onClick={onAccept}>{saving ? "Completing…" : "Accept trade"}</Button></footer>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

export default function TradesPage() {
    const { user } = useAuth();
    const leagueId = user?.leagueId;
    const contextQuery = useTradeContext(leagueId);
    const offersQuery = useTradeOffers(leagueId);
    const createMutation = useCreateTradeOffer(leagueId);
    const acceptMutation = useAcceptTradeOffer(leagueId);
    const rejectMutation = useRejectTradeOffer(leagueId);
    const cancelMutation = useCancelTradeOffer(leagueId);
    const [builderOpen, setBuilderOpen] = useState(false);
    const [acceptingOffer, setAcceptingOffer] = useState(null);
    const context = contextQuery.data;
    const offers = offersQuery.data || { incoming: [], outgoing: [] };
    const pendingId = acceptMutation.variables || rejectMutation.variables || cancelMutation.variables;

    const pendingCount = [...offers.incoming, ...offers.outgoing].filter((offer) => offer.status === "PENDING").length;
    const action = async (mutation, offer, success) => {
        try { await mutation.mutateAsync(offer.id); toast.success(success); } catch (error) { toast.error(errorMessage(error)); }
    };
    const actions = {
        pendingId,
        available: Boolean(context?.available),
        confirm: setAcceptingOffer,
        reject: (offer) => action(rejectMutation, offer, "Trade offer declined"),
        cancel: (offer) => action(cancelMutation, offer, "Trade offer cancelled"),
    };

    if (contextQuery.isLoading || offersQuery.isLoading) return <div className="mx-auto max-w-6xl px-4 py-12 text-center text-app-muted">Loading trades…</div>;
    if (contextQuery.isError || offersQuery.isError) return <div className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-2xl border border-app-danger-border bg-app-danger-surface p-5 text-app-danger-foreground">{errorMessage(contextQuery.error || offersQuery.error)}</div></div>;

    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-app-accent-border bg-[radial-gradient(circle_at_top_right,rgba(24,218,236,.2),transparent_38%),linear-gradient(135deg,var(--app-surface-elevated),var(--app-surface-muted))] p-5 shadow-sm sm:p-7">
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-app-accent-foreground">Player market</p>
                        <h1 className="mt-1 text-3xl font-black text-app-foreground sm:text-4xl">Trades</h1>
                        <p className="mt-2 text-sm leading-6 text-app-muted sm:text-base">Swap same-position players directly with another manager. Bundle multiple swaps into one all-or-nothing deal.</p>
                    </div>
                    <Button size="lg" disabled={!context?.available} onClick={() => setBuilderOpen(true)}><Plus className="size-4" /> Create offer</Button>
                </div>
            </section>

            <section className={`flex items-start gap-3 rounded-2xl border p-4 ${context?.available ? "border-app-positive-border bg-app-positive-surface text-app-positive-foreground" : "border-amber-400/35 bg-amber-400/10 text-amber-800 dark:text-amber-100"}`}>
                {context?.available ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> : <Clock3 className="mt-0.5 size-5 shrink-0" />}
                <div><p className="font-extrabold">{context?.available ? "Trade market is open" : "Trade offers are paused"}</p><p className="mt-0.5 text-sm opacity-85">{context?.available ? `You can create and accept offers now${pendingCount ? ` · ${pendingCount} pending` : ""}.` : context?.blockedReason}</p></div>
            </section>

            <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
                <OffersSection title="Incoming offers" subtitle="Deals waiting for your decision." offers={offers.incoming} direction="incoming" actions={actions} />
                <OffersSection title="Sent offers" subtitle="Track or cancel the offers you created." offers={offers.outgoing} direction="outgoing" actions={actions} />
            </div>

            {context && <TradeBuilder context={context} open={builderOpen} onOpenChange={setBuilderOpen} onSubmit={(payload) => createMutation.mutateAsync(payload)} saving={createMutation.isPending} />}
            <AcceptDialog offer={acceptingOffer} saving={acceptMutation.isPending} onClose={() => setAcceptingOffer(null)} onAccept={async () => { try { await acceptMutation.mutateAsync(acceptingOffer.id); toast.success("Trade completed"); setAcceptingOffer(null); } catch (error) { toast.error(errorMessage(error)); } }} />
        </main>
    );
}

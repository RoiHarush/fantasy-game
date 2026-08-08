import Link from "next/link";
import { useDraftConfig } from "../../../features/draft/useDraft";
import DraftCountdown from "../DraftRoomTab/DraftCountdown";

export default function PreDraftStatus({ league }) {
    const leagueId = league?.id ?? league?.leagueId;
    const configQuery = useDraftConfig(leagueId, { retry: false });
    const config = configQuery.data;

    const scheduledTime = config?.scheduledTime || config?.scheduled_time;

    return (
        <section className="mx-auto my-8 w-[calc(100%_-_1.5rem)] max-w-3xl rounded-2xl border border-app-border bg-app-surface p-5 text-app-foreground shadow-panel transition-colors sm:my-12 sm:p-8">
            <p className="font-bold text-violet-600 dark:text-violet-300">League setup</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{league.name}</h1>
            <p className="mt-2 text-app-muted">
                {league.participantCount} of {league.maxParticipants} managers have joined.
            </p>
            <div className="my-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center dark:border-violet-800/70 dark:bg-violet-950/30">
                <p className="text-sm font-semibold text-app-muted">Initial draft countdown</p>
                {configQuery.isPending ? (
                    <p role="status" className="mt-3 text-app-muted">Loading draft schedule…</p>
                ) : configQuery.error ? (
                    <p role="alert" className="mt-3 text-red-600 dark:text-red-300">The draft schedule is temporarily unavailable.</p>
                ) : (
                    <strong className="mt-2 block text-2xl font-bold sm:text-3xl"><DraftCountdown value={scheduledTime} /></strong>
                )}
            </div>
            <p className="text-sm leading-6 text-app-muted sm:text-base">
                The game screens will unlock automatically after every manager has drafted a complete 15-player squad.
            </p>
            <Link
                href="/draft-room"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-brand-ink px-5 py-2.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple dark:bg-brand-purple dark:hover:bg-violet-500"
            >
                Open draft lobby
            </Link>
        </section>
    );
}

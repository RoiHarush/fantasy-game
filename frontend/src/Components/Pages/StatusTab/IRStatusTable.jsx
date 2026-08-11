import { HeartPulse } from "lucide-react";

import { useIrStatuses } from "../../../features/status/useStatusData";

function IRStatusTable({ previewStatuses }) {
    const preview = Array.isArray(previewStatuses);
    const irStatusesQuery = useIrStatuses(!preview);
    const irStatuses = preview ? previewStatuses : irStatusesQuery.data ?? [];
    const pending = !preview && irStatusesQuery.isPending;
    const error = !preview && irStatusesQuery.error;
    const activeIrCount = irStatuses.filter((status) => status.hasIr).length;

    return (
        <section className="mt-5 w-full overflow-hidden rounded-2xl border border-app-accent-border bg-app-surface shadow-panel transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-component-gradient px-4 py-4 text-brand-on-gradient sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-on-gradient/15 text-brand-on-gradient ring-1 ring-brand-on-gradient/30 shadow-sm backdrop-blur-sm">
                        <HeartPulse aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-brand-on-gradient sm:text-lg">Injured Reserve</h3>
                        <p className="text-xs text-brand-on-gradient/75 sm:text-sm">League IR slots at a glance</p>
                    </div>
                </div>

                {!pending && !error && (
                    <span className="rounded-full border border-brand-on-gradient/30 bg-brand-on-gradient/15 px-3 py-1 text-xs font-semibold text-brand-on-gradient shadow-sm backdrop-blur-sm">
                        {activeIrCount} active
                    </span>
                )}
            </div>

            <div className="p-3 sm:p-4">
                {pending && <p role="status" className="px-1 py-3 text-app-muted">Loading IR status…</p>}
                {error && <p role="alert" className="px-1 py-3 text-red-600 dark:text-red-300">IR status is temporarily unavailable.</p>}
                {!pending && !error && irStatuses.length === 0 && (
                    <p className="px-1 py-3 text-app-muted">No managers currently have a player in IR.</p>
                )}

                {irStatuses.length > 0 && (
                    <>
                        <div className="hidden overflow-hidden rounded-xl border border-app-accent-border sm:block">
                            <table className="w-full table-fixed border-collapse text-sm">
                                <thead className="bg-app-accent-surface text-[0.7rem] tracking-[0.08em] text-app-accent-foreground uppercase">
                                    <tr>
                                        <th className="w-[30%] px-4 py-3 text-left font-semibold">Manager</th>
                                        <th className="w-[35%] px-4 py-3 text-left font-semibold">Fantasy team</th>
                                        <th className="w-[35%] px-4 py-3 text-left font-semibold">IR player</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {irStatuses.map((status) => (
                                        <tr key={status.userId} className="border-t border-app-accent-border transition-colors first:border-t-0 hover:bg-app-accent-hover">
                                            <td className="px-4 py-3 font-semibold text-app-foreground">{status.userName}</td>
                                            <td className="px-4 py-3 text-app-muted">{status.teamName}</td>
                                            <td className="px-4 py-3">
                                                <IrPlayerStatus status={status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-2 sm:hidden">
                            {irStatuses.map((status) => (
                                <article key={status.userId} className="rounded-xl border border-app-accent-border bg-app-accent-surface p-3">
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-app-foreground">{status.userName}</p>
                                            <p className="truncate text-xs text-app-muted">{status.teamName}</p>
                                        </div>
                                        <IrPlayerStatus status={status} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>

        </section>
    );
}

function IrPlayerStatus({ status }) {
    if (!status.hasIr) {
        return (
            <span className="inline-flex whitespace-nowrap rounded-full bg-app-accent-surface px-2.5 py-1 text-xs font-medium text-app-accent-foreground ring-1 ring-inset ring-app-accent-border">
                Empty slot
            </span>
        );
    }

    return (
        <span className="inline-flex max-w-full truncate rounded-full bg-app-danger-surface px-2.5 py-1 text-xs font-semibold text-app-danger-foreground ring-1 ring-inset ring-app-danger-border">
            {status.irPlayerName}
        </span>
    );
}

export default IRStatusTable;

import { HeartPulse } from "@/src/shared/ui/icons";

import { useIrStatuses } from "../../../features/status/useStatusData";

function IRStatusTable({ previewStatuses }) {
    const preview = Array.isArray(previewStatuses);
    const irStatusesQuery = useIrStatuses(!preview);
    const irStatuses = preview ? previewStatuses : irStatusesQuery.data ?? [];
    const pending = !preview && irStatusesQuery.isPending;
    const error = !preview && irStatusesQuery.error;
    const activeIrCount = irStatuses.filter((status) => status.hasIr).length;

    return (
        <section className="relative mt-14 w-full border-y-2 border-app-border transition-colors before:absolute before:-top-0.5 before:left-0 before:h-0.5 before:w-24 before:bg-component-gradient">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-1 py-4 sm:px-2">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center text-app-accent-foreground">
                        <HeartPulse aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-app-accent-foreground">Current state</p>
                        <h3 className="mt-0.5 text-base font-bold text-app-foreground sm:text-lg">Current IR slots</h3>
                        <p className="text-xs text-app-muted sm:text-sm">Who is held in IR right now</p>
                    </div>
                </div>

                {!pending && !error && (
                    <span className="text-xs font-bold text-app-accent-foreground">
                        {activeIrCount} active
                    </span>
                )}
            </div>

            <div>
                {pending && <p role="status" className="px-1 py-3 text-app-muted">Loading IR status…</p>}
                {error && <p role="alert" className="px-1 py-3 text-red-600 dark:text-red-300">IR status is temporarily unavailable.</p>}
                {!pending && !error && irStatuses.length === 0 && (
                    <p className="px-1 py-3 text-app-muted">No managers currently have a player in IR.</p>
                )}

                {irStatuses.length > 0 && (
                    <>
                        <div className="hidden sm:block">
                            <table className="w-full table-fixed border-collapse text-sm">
                                <thead className="border-b border-app-border text-[0.7rem] tracking-[0.08em] text-app-muted uppercase">
                                    <tr>
                                        <th className="w-[30%] px-4 py-3 text-left font-semibold">Manager</th>
                                        <th className="w-[35%] px-4 py-3 text-left font-semibold">Fantasy team</th>
                                        <th className="w-[35%] px-4 py-3 text-left font-semibold">IR player</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {irStatuses.map((status) => (
                                        <tr key={status.userId} className="border-t border-app-border transition-colors first:border-t-0 hover:bg-app-accent-hover">
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

                        <div className="divide-y divide-app-border sm:hidden">
                            {irStatuses.map((status) => (
                                <div key={status.userId} className="px-1 py-3">
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-app-foreground">{status.userName}</p>
                                            <p className="truncate text-xs text-app-muted">{status.teamName}</p>
                                        </div>
                                        <IrPlayerStatus status={status} />
                                    </div>
                                </div>
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
            <span className="inline-flex whitespace-nowrap text-xs font-semibold text-app-muted">
                Empty slot
            </span>
        );
    }

    return (
        <span className="inline-flex max-w-full truncate text-xs font-bold text-app-danger-foreground">
            {status.irPlayerName}
        </span>
    );
}

export default IRStatusTable;

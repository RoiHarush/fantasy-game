import * as Dialog from "@radix-ui/react-dialog";

import { usePointsHistory } from "../../features/points/usePointSummaries";
import CloseButton from "../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../shared/ui/ResponsiveDialog";

function HistoryModal({ userId, onClose }) {
    const historyQuery = usePointsHistory(userId);
    const history = historyQuery.data ?? [];

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="flex max-h-[86dvh] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:w-[min(calc(100vw-2rem),37.5rem)] sm:p-6">
                <div className="mb-3 flex items-center justify-between border-b border-app-border pb-3">
                    <Dialog.Title className="text-xl font-black text-app-foreground sm:text-2xl">Gameweek History</Dialog.Title>
                    <Dialog.Close asChild>
                        <CloseButton aria-label="Close gameweek history" />
                    </Dialog.Close>
                </div>

                <div className="min-w-0 overflow-x-auto">
                    {historyQuery.isPending ? (
                        <p className="py-8 text-center text-app-muted">Loading history...</p>
                    ) : historyQuery.error ? (
                        <p className="py-8 text-center text-red-600 dark:text-red-300" role="alert">{historyQuery.error.message}</p>
                    ) : (
                        <table className="mt-1 w-full min-w-[26rem] border-collapse">
                            <thead>
                                <tr>
                                    <th className={HEADER_CELL}>Round</th>
                                    <th className={HEADER_CELL}>Points</th>
                                    <th className={HEADER_CELL}>Total Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((gw) => (
                                    <tr key={gw.gameweek}>
                                        <td className={BODY_CELL}>Gameweek {gw.gameweek}</td>
                                        <td className={`${BODY_CELL} font-extrabold text-app-accent-foreground`}>{gw.points}</td>

                                        <td className={`${BODY_CELL} font-extrabold text-app-accent-foreground`}>{gw.totalPoints}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

const HEADER_CELL = "border-b border-app-border bg-app-surface-muted px-2.5 py-3 text-left text-xs font-extrabold uppercase text-app-muted";
const BODY_CELL = "border-b border-app-border px-2.5 py-3 text-sm font-medium text-app-foreground";

export default HistoryModal;

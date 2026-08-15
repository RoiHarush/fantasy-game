"use client";

import { useMemo, useState } from "react";

import {
    useOpenTransferWindow,
    useSaveTransferAttendance,
    useTransferAttendance,
    useTransferOrder,
} from "../../../features/transfer-window/useTransferWindow";
import { findActiveGameweek, gameweekLabel } from "../../../features/gameweeks/availability";
import { isSameTransferId } from "../../../features/transfer-window/model";
import ClosedWindowView from "./ClosedWindowView";
import CompletedTransferWindowView from "./CompletedTransferWindowView";
import OpenTransferWindowDialog from "./OpenTransferWindowDialog";
import TurnOrderModal from "./TurnOrderModal";

function ClosedWindow({ user, users, nextGameweek, gameweeks = [], currentGameweek = null }) {
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const orderQuery = useTransferOrder(user?.leagueId, nextGameweek?.id);
    const attendanceQuery = useTransferAttendance(
        user?.leagueId,
        nextGameweek?.id,
        user?.id,
    );
    const saveAttendance = useSaveTransferAttendance(
        user?.leagueId,
        nextGameweek?.id,
        user?.id,
    );
    const openWindow = useOpenTransferWindow(user?.leagueId, nextGameweek?.id, {
        onSuccess: () => setIsConfirmOpen(false),
    });

    const transferOrder = useMemo(() => (orderQuery.data ?? []).map((id, index) => {
        const manager = users.find((item) => String(item.id) === String(id));
        const automaticUserIds = attendanceQuery.data?.automaticUserIds ?? [];

        return {
            id: `${index + 1}-${id}`,
            pickNumber: index + 1,
            managerName: manager?.name ?? manager?.fantasyTeamName ?? `User ${id}`,
            isCurrentUser: isSameTransferId(id, user?.id),
            automatic: automaticUserIds.some((automaticUserId) => isSameTransferId(automaticUserId, id)),
        };
    }), [attendanceQuery.data?.automaticUserIds, orderQuery.data, user?.id, users]);

    const automaticAttendance = Boolean(attendanceQuery.data?.automatic);
    const attendanceError = attendanceQuery.error ?? saveAttendance.error;
    const activeGameweek = findActiveGameweek(gameweeks, currentGameweek);
    const openBlockedReason = activeGameweek
        ? `Transfers cannot open while ${gameweekLabel(activeGameweek)} is active.`
        : "";

    if (attendanceQuery.data?.windowStatus === "CLOSED") {
        return <CompletedTransferWindowView gameweekId={nextGameweek?.id} />;
    }

    return (
        <>
            <ClosedWindowView
                gameweekId={nextGameweek?.id}
                transferOpenTime={nextGameweek?.transferOpenTime}
                transferOrder={transferOrder}
                orderPending={orderQuery.isPending}
                orderError={orderQuery.error}
                automaticAttendance={automaticAttendance}
                attendancePending={attendanceQuery.isPending || saveAttendance.isPending}
                attendanceError={attendanceError}
                isLeagueAdmin={Boolean(user?.leagueAdmin)}
                openBlockedReason={openBlockedReason}
                onAttendanceChange={() => saveAttendance.mutate(!automaticAttendance)}
                onManageOrder={() => setIsOrderModalOpen(true)}
                onOpenWindow={() => {
                    if (!openBlockedReason) setIsConfirmOpen(true);
                }}
            />

            {isOrderModalOpen && (
                <TurnOrderModal
                    onClose={() => setIsOrderModalOpen(false)}
                    usersList={users}
                />
            )}

            <OpenTransferWindowDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={() => {
                    if (!openBlockedReason) openWindow.mutate();
                }}
                pending={openWindow.isPending}
                error={openWindow.error}
            />
        </>
    );
}

export default ClosedWindow;

import { useState } from "react";

import { useGameweek } from "../../features/gameweeks/useGameweek";
import {
    useUserGameweekPoints,
    useUserTotalPoints,
} from "../../features/points/usePointSummaries";
import HistoryModal from "../General/HistoryModal";
import PointsSummaryCard from "./PointsSummaryCard";

function PointsSummaryBlock({ user, previewPoints }) {
    const [showHistory, setShowHistory] = useState(false);
    const { currentGameweek } = useGameweek();
    const preview = previewPoints != null;
    const pointsQuery = useUserGameweekPoints(user?.id, currentGameweek?.id, !preview);
    const totalQuery = useUserTotalPoints(user?.id, !preview);
    const gameweekPoints = preview ? previewPoints.gameweekPoints : pointsQuery.data;
    const totalPoints = preview ? previewPoints.totalPoints : totalQuery.data;
    const pointsPending = !preview && pointsQuery.isPending;
    const totalPending = !preview && totalQuery.isPending;
    const error = !preview && (pointsQuery.error || totalQuery.error);

    if (!user) return null;

    return (
        <>
            <PointsSummaryCard
                user={user}
                gameweekPoints={gameweekPoints}
                totalPoints={totalPoints}
                pointsPending={pointsPending}
                totalPending={totalPending}
                error={error}
                onOpenHistory={() => setShowHistory(true)}
            />
            {showHistory && <HistoryModal userId={user.id} onClose={() => setShowHistory(false)} />}
        </>
    );
}

export default PointsSummaryBlock;

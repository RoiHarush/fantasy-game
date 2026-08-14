"use client";

import LoadingPage from "./Components/General/LoadingPage";
import { useSystemStatus } from "./Context/SystemStatusContext";

const GameweekUpdatingGuard = ({ children }) => {
    const { isSystemLocked } = useSystemStatus();

    if (isSystemLocked) {
        return (
            <LoadingPage
                eyebrow="Gameweek rollover"
                title="Season update in progress"
                description="Scores, squads and league standings are being finalized. The app will unlock automatically when the update is complete."
            />
        );
    }

    return <>{children}</>;
};

export default GameweekUpdatingGuard;

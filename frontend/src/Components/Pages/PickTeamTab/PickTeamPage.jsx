"use client";

import { useCallback, useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useSaveTeam } from "../../../features/pick-team/usePickTeamActions";
import { usePickTeamData } from "../../../features/pick-team/usePickTeamData";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import PickTeam from "./PickTeam";

function PickTeamEditor({ user, nextGameweek, gameweeks, initialSquad, initialChips, playerData, refreshPlayerData }) {
    const [squad, setSquad] = useState(initialSquad);
    const [chips, setChips] = useState(initialChips);
    const [isDirty, setIsDirty] = useState(false);
    const saveMutation = useSaveTeam(user.id, nextGameweek.id, (updatedSquad) => {
            setSquad(updatedSquad);
            setIsDirty(false);
    });

    const saveTeam = useCallback(async () => {
        if (!squad) return false;
        try {
            await saveMutation.mutateAsync(squad);
            return true;
        } catch (error) {
            console.error("Failed to save team:", error);
            return false;
        }
    }, [saveMutation, squad]);

    return (
        <PageLayout
            left={
                <PickTeam
                    user={user}
                    nextGameweek={nextGameweek}
                    gameweeks={gameweeks}
                    squad={squad}
                    setSquad={setSquad}
                    chips={chips}
                    setChips={setChips}
                    playerData={playerData}
                    saveTeam={saveTeam}
                    isDirty={isDirty}
                    setIsDirty={setIsDirty}
                    refreshPlayerData={refreshPlayerData}
                />
            }
            right={<UserSidebar user={user} />}
        />
    );
}

function PickTeamPage() {
    const { user } = useAuth();
    const { nextGameweek, gameweeks } = useGameweek();
    const data = usePickTeamData(user?.id, nextGameweek?.id);

    if (!nextGameweek || data.isPending) return <LoadingPage />;
    if (data.error) return <div>Error: {data.error.message}</div>;

    return (
        <PickTeamEditor
            key={`${user.id}-${nextGameweek.id}`}
            user={user}
            nextGameweek={nextGameweek}
            gameweeks={gameweeks}
            initialSquad={data.squad.data}
            initialChips={data.chips.data ?? { remaining: {}, active: {} }}
            playerData={data.playerData.data ?? []}
            refreshPlayerData={data.playerData.refetch}
        />
    );
}

export default PickTeamPage;

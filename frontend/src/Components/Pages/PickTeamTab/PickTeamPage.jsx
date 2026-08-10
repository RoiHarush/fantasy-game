"use client";

import { useState } from "react";

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

    function saveTeam() {
        if (!squad) return Promise.resolve(null);
        return saveMutation.mutateAsync(squad);
    }

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
                    savePending={saveMutation.isPending}
                    saveSucceeded={saveMutation.isSuccess}
                    saveError={saveMutation.error}
                    isDirty={isDirty}
                    setIsDirty={setIsDirty}
                    refreshPlayerData={refreshPlayerData}
                />
            }
            right={<UserSidebar user={user} editable />}
        />
    );
}

function PickTeamPage() {
    const { user } = useAuth();
    const gameweekState = useGameweek();
    const data = usePickTeamData(user?.id, gameweekState.nextGameweek?.id);

    if (gameweekState.loading) return <LoadingPage />;
    if (gameweekState.error) return <p role="alert">Error loading gameweeks: {gameweekState.error}</p>;
    if (!gameweekState.nextGameweek) {
        return <p role="status">There is no upcoming gameweek to prepare a squad for.</p>;
    }
    if (data.isPending) return <LoadingPage />;
    if (data.error) return <p role="alert">Error loading your squad: {data.error.message}</p>;
    if (!data.squad.data) return <p role="status">Your squad has not been created yet.</p>;

    return (
        <PickTeamEditor
            key={`${user.id}-${gameweekState.nextGameweek.id}`}
            user={user}
            nextGameweek={gameweekState.nextGameweek}
            gameweeks={gameweekState.gameweeks}
            initialSquad={data.squad.data}
            initialChips={data.chips.data ?? { remaining: {}, active: {} }}
            playerData={data.playerData.data ?? []}
            refreshPlayerData={data.playerData.refetch}
        />
    );
}

export default PickTeamPage;

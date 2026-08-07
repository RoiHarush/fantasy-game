"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { usePickTeamData } from "../../../features/pick-team/usePickTeamData";
import { queryKeys } from "../../../lib/query/keys";
import { saveTeamRequest } from "../../../services/pickTeamService";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import PickTeam from "./PickTeam";

function buildSaveTeamDto(squad) {
    return {
        startingLineup: squad.startingLineup,
        bench: squad.bench,
        formation: {
            GK: squad.startingLineup.GK?.length || 0,
            DEF: squad.startingLineup.DEF?.length || 0,
            MID: squad.startingLineup.MID?.length || 0,
            FWD: squad.startingLineup.FWD?.length || 0,
        },
        captainId: squad.captainId || null,
        viceCaptainId: squad.viceCaptainId || null,
        irId: squad.irId || null,
        firstPickId: squad.firstPickId || null,
    };
}

function PickTeamEditor({ user, nextGameweek, gameweeks, initialSquad, initialChips, playerData, refreshPlayerData }) {
    const queryClient = useQueryClient();
    const [squad, setSquad] = useState(initialSquad);
    const [chips, setChips] = useState(initialChips);
    const [isDirty, setIsDirty] = useState(false);
    const saveMutation = useMutation({
        mutationFn: (dto) => saveTeamRequest(user.id, dto),
        onSuccess: (updatedSquad) => {
            setSquad(updatedSquad);
            setIsDirty(false);
            queryClient.setQueryData(queryKeys.squad(user.id, nextGameweek.id), updatedSquad);
        },
    });

    const saveTeam = useCallback(async () => {
        if (!squad) return false;
        try {
            await saveMutation.mutateAsync(buildSaveTeamDto(squad));
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

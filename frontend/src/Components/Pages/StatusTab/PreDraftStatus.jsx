import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "../../../Context/AuthContext";
import { queryKeys } from "../../../lib/query/keys";
import { AdminService } from "../../../services/adminService";
import DraftCountdown from "../DraftRoomTab/DraftCountdown";

export default function PreDraftStatus({ league }) {
    const { user } = useAuth();
    const configQuery = useQuery({
        queryKey: queryKeys.draftConfig(user?.leagueId),
        queryFn: () => AdminService.getDraftConfig().catch(() => null),
        enabled: Boolean(user?.leagueId),
    });
    const config = configQuery.data;

    const scheduledTime = config?.scheduledTime || config?.scheduled_time;

    return (
        <section style={{ maxWidth: 760, margin: "3rem auto", padding: "2rem", background: "white", borderRadius: 18 }}>
            <p style={{ color: "#6554c0", fontWeight: 700 }}>League setup</p>
            <h1>{league.name}</h1>
            <p>
                {league.participantCount} of {league.maxParticipants} managers have joined.
            </p>
            <div style={{ padding: "1.5rem", margin: "1.5rem 0", borderRadius: 14, background: "#f4f1ff", textAlign: "center" }}>
                <p style={{ marginTop: 0 }}>Initial draft countdown</p>
                <strong style={{ fontSize: "2rem" }}><DraftCountdown value={scheduledTime} /></strong>
            </div>
            <p>
                The game screens will unlock automatically after every manager has drafted a complete 15-player squad.
            </p>
            <Link href="/draft-room">Open draft lobby</Link>
        </section>
    );
}

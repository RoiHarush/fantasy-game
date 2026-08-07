"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequireLeague, RequireActiveLeague } from "../../../../src/RouteGuards";
import GameweekUpdatingGuard from "../../../../src/GameweekUpdatingGuard";
import PointsPage from "../../../../src/Components/Pages/PointsTab/PointsPage";
import { fetchUserById } from "../../../../src/services/usersService";

function OtherUserPointsWrapper() {
    const params = useParams();
    const userId = params?.userId;
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadUser() {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchUserById(userId);

                if (!cancelled) {
                    setOtherUser(data);
                }
            } catch (err) {
                console.error("Fetch error:", err.message);
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadUser();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;
    if (!otherUser) return <div>User not found</div>;

    return <PointsPage displayedUser={otherUser} />;
}

export default function PointsUserRoute() {
    return (
        <RequireLeague>
            <RequireActiveLeague>
                <GameweekUpdatingGuard>
                    <OtherUserPointsWrapper />
                </GameweekUpdatingGuard>
            </RequireActiveLeague>
        </RequireLeague>
    );
}

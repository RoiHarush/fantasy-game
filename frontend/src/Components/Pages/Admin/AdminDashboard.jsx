import React from "react";
import { useAuth } from "../../../Context/AuthContext";

export default function AdminDashboard() {
    const { user } = useAuth();

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                Welcome {user ? user.name : 'admin'}!
            </h1>
            <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                This is the control panel of the game.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
                Please selecet one to the option to manage the system.
            </p>
        </div>
    );
}
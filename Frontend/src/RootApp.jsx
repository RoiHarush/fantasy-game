import App from "./App";
import { WatchlistProvider } from "./Context/WatchlistContext";
import { useState, useEffect } from "react";
import { FixturesProvider } from "./Context/FixturesContext";

function RootApp() {
    const [loggedUser, setLoggedUser] = useState(null);

    useEffect(() => {
        const savedUser = sessionStorage.getItem("loggedUser");
        const savedToken = sessionStorage.getItem("token");
        if (savedUser && savedToken) {
            setLoggedUser(JSON.parse(savedUser));
        }
    }, []);

    return (
        <FixturesProvider>
            <WatchlistProvider user={loggedUser}>
                <App
                    loggedUser={loggedUser}
                    onLogin={(u) => setLoggedUser(u)}
                />
            </WatchlistProvider>
        </FixturesProvider>
    );
}

export default RootApp;
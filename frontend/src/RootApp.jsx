import App from "./App";
import { WatchlistProvider } from "./Context/WatchlistContext";
import { FixturesProvider } from "./Context/FixturesContext";
import { useAuth } from "./Context/AuthContext";

function RootApp() {
    const { user } = useAuth();

    return (
        <FixturesProvider>
            <WatchlistProvider user={user}>
                <App />
            </WatchlistProvider>
        </FixturesProvider>
    );
}

export default RootApp;
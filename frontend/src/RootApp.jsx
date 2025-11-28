import App from "./App";
import { FixturesProvider } from "./Context/FixturesContext";

function RootApp() {

    return (
        <FixturesProvider>
            <App />
        </FixturesProvider>
    );
}

export default RootApp;
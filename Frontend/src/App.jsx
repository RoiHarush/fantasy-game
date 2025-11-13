import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Header from "./Header";
import HeaderCollage from "./HeaderCollage";
import StatusPage from "./Components/Pages/StatusTab/StatusPage";
import PickTeamPage from "./Components/Pages/PickTeamTab/PickTeamPage";
import FixturesPage from "./Components/Pages/FixturesTab/FixturePage";
import LeaguePage from "./Components/Pages/LeagueTab/LeaguePage";
import PointsPage from "./Components/Pages/PointsTab/PointsPage";
import ScoutPage from "./Components/Pages/ScoutTab/ScoutPage";
import DraftRoom from "./Components/Pages/DraftRoomTab/DraftRoom";
import PageLayout from "./Components/PageLayout";
import Login from "./Components/Auth/Login";
import TransferWindowPage from "./Components/Pages/TransferWindowTab/TransferWindowPage";
import API_URL from "./config";
import { WatchlistProvider } from "./Context/WatchlistContext";

function App() {
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("loggedUser");
    const savedToken = sessionStorage.getItem("token");

    if (savedUser && savedToken) {
      setLoggedUser(JSON.parse(savedUser));
    }
  }, []);


  if (!loggedUser) {
    return <Login onLogin={(data) => setLoggedUser(data)} />;
  }

  return (
    <WatchlistProvider user={loggedUser}>
      <div>
        <HeaderCollage />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/status" replace />} />

            <Route
              path="/status"
              element={<StatusPage user={loggedUser} />}
            />

            <Route
              path="/points"
              element={<PointsPage user={loggedUser} />}
            />

            <Route
              path="/points/:userId"
              element={<OtherUserPointsWrapper />}
            />

            <Route
              path="/pick-team"
              element={<PickTeamPage user={loggedUser} />}
            />

            <Route
              path="/league"
              element={<LeaguePage user={loggedUser} />}
            />

            <Route
              path="/fixtures"
              element={<FixturesPage />}
            />

            <Route
              path="/scout"
              element={<ScoutPage user={loggedUser} />}
            />

            <Route
              path="/transfer-window"
              element={<TransferWindowPage user={loggedUser} />}
            />

            <Route
              path="/draft-room"
              element={
                <PageLayout
                  left={<DraftRoom initialUser={loggedUser} />}
                  right={<div>Sidebar for Draft Room</div>}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </WatchlistProvider>
  );
}

function OtherUserPointsWrapper() {
  const { userId } = useParams();
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then((data) => setOtherUser(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!otherUser) return <div>User not found</div>;

  return <PointsPage user={otherUser} />;
}

export default App;

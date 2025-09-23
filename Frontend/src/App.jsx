import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { mockUser1, users } from "./MockData/Users";
import { league } from "./MockData/League";
import Header from "./Header";
import HeaderCollage from "./HeaderCollage";
import Status from "./Components/Pages/Status";
import PickTeam from "./Components/Pages/PickTeam";
import Fixtures from "./Components/Pages/FixturesTab/Fixtures";
import LeagueTable from "./Components/Pages/LeagueTab/LeagueTable";
import Points from "./Components/Pages/Points";
import players from "./MockData/Players";
import Scout from "./Components/Pages/ScoutTab/Scout";
import DraftRoom from "./Components/Pages/DraftRoomTab/DraftRoom";
import PageLayout from "./PageLayout";
import Gameweeks from "./MockData/Gameweeks";
import { Heading2 } from "lucide-react";

function App() {
  const currentGameweek = Gameweeks.find(gw => gw.status === "LIVE");
  const nextGameweek = Gameweeks.find(gw => gw.status === "UPCOMING");

  return (
    <>
      <HeaderCollage />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/status" replace />} />

          <Route
            path="/status"
            element={
              <PageLayout
                left={<Status user={mockUser1} currentGameweek={currentGameweek} nextGameweek={nextGameweek} leagueName={league.name} />}
                right={<div>Sidebar for Status</div>}
              />
            }
          />

          <Route
            path="/points"
            element={
              <PageLayout
                left={<Points user={mockUser1} gameweek={currentGameweek} gameweeks={Gameweeks} />}
                right={<div>Sidebar for Points</div>}
              />
            }
          />

          <Route
            path="/points/:userId"
            element={
              <PageLayout
                left={<OtherUserPointsWrapper gameweek={currentGameweek} gameweeks={Gameweeks} />}
                right={<div>Sidebar for Other User</div>}
              />
            }
          />

          <Route
            path="/pick-team"
            element={
              <PageLayout
                left={<PickTeam user={mockUser1} gameweek={nextGameweek} gameweeks={Gameweeks} />}
                right={<div>Sidebar for Pick Team</div>}
              />
            }
          />

          <Route
            path="/league"
            element={
              <PageLayout
                left={<LeagueTable league={league} currentUser={mockUser1} />}
                right={<div>Sidebar for League</div>}
              />
            }
          />

          <Route
            path="/fixtures"
            element={
              <PageLayout
                left={<Fixtures gameweeks={Gameweeks} defaultGameweek={nextGameweek} />}
                right={<div>Sidebar for Fixtures</div>}
              />
            }
          />


          <Route
            path="/scout"
            element={
              <PageLayout
                left={<Scout players={players} initialUser={mockUser1} />}
                right={<div>Sidebar for Scout</div>}
              />
            }
          />

          <Route
            path="/draft-room"
            element={
              <PageLayout
                left={<DraftRoom players={players} initialUser={mockUser1} leagueName={league.name} />}
                right={<div>Sidebar for Draft Room</div>}
              />
            }
          />

          <Route
            path="/test"
            element={
              <PageLayout
                left={<h2>Test</h2>}
                right={<div>Sidebar for Test</div>}
              />
            }
          />
        </Routes>
      </main>
    </>
  );
}

function OtherUserPointsWrapper({ gameweek, gameweeks }) {
  const { userId } = useParams();
  const otherUser = users.find(u => u.id.toString() === userId);

  if (!otherUser) {
    return <div>User not found</div>;
  }

  return <Points user={otherUser} gameweek={gameweek} gameweeks={Gameweeks} />;
}

export default App;

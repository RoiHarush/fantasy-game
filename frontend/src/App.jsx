import { Routes, Route, Navigate, useParams, Outlet, Link } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";
import Header from "./Header";
import HeaderCollage from "./HeaderCollage";
import StatusPage from "./Components/Pages/StatusTab/StatusPage";
import PickTeamPage from "./Components/Pages/PickTeamTab/PickTeamPage";
import FixturesPage from "./Components/Pages/FixturesTab/FixturePage";
import LeaguePage from "./Components/Pages/LeagueTab/LeaguePage";
import PointsPage from "./Components/Pages/PointsTab/PointsPage";
import ScoutPage from "./Components/Pages/ScoutTab/ScoutPage";
import PageLayout from "./Components/PageLayout";
import Login from "./Components/Auth/Login";
import TransferWindowPage from "./Components/Pages/TransferWindowTab/TransferWindowPage";
import { useEffect, useState } from "react";
import LoadingPage from "./Components/General/LoadingPage";
import DraftRoomWrapper from "./Components/Pages/DraftRoomTab/DraftRoomWrapper";
import AdminDashboard from "./Components/Pages/superAdmin/AdminDashboard";
import AdminUsersPage from "./Components/Pages/superAdmin/AdminUserPage";
import AdminActionsPage from "./Components/Pages/superAdmin/AdminActionsPage";
import LeagueControlPage from "./Components/Pages/Admin/LeagueControlPage";
import SettingsPage from "./Components/Pages/SettingsTab/SettingsPage";
import GameweekUpdatingGuard from "./GameweekUpdatingGuard";
import { fetchUserById } from "./services/usersService";
import NotFoundPage from "./Components/Pages/NotFoundPage";
import Footer from "./Footer";


function MainAppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ROLE_SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div>
      <HeaderCollage />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function AdminAppLayout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ROLE_SUPER_ADMIN') {
    return <Navigate to="/status" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: '220px', background: '#1f2937', color: 'white', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>Admin Panel</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/admin/users" style={{ color: 'white', textDecoration: 'none' }}>User Managment</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/admin/actions" style={{ color: 'white', textDecoration: 'none' }}>System Actions</Link>
          </li>
          <li style={{ marginTop: '2rem' }}>
            <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Back To Game</Link>
          </li>
          <li style={{ marginTop: '0.5rem' }}>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0, cursor: 'pointer' }}>Logout</button>
          </li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: '2rem', background: '#f3f4f6' }}>
        <Outlet />
      </main>
    </div>
  );
}

const LeagueAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'ROLE_ADMIN' && user?.role !== 'ROLE_SUPER_ADMIN') {
    return <Navigate to="/status" replace />;
  }
  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div><LoadingPage /></div>;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MainAppLayout />}>
        <Route path="/" element={<Navigate to="/status" replace />} />
        <Route path="status" element={
          <GameweekUpdatingGuard>
            <StatusPage />
          </GameweekUpdatingGuard>
        } />
        <Route path="points" element={
          <GameweekUpdatingGuard>
            <PointsPage />
          </GameweekUpdatingGuard>
        } />
        <Route path="points/:userId" element={
          <GameweekUpdatingGuard>
            <OtherUserPointsWrapper />
          </GameweekUpdatingGuard>
        } />
        <Route path="pick-team" element={
          <GameweekUpdatingGuard>
            <PickTeamPage />
          </GameweekUpdatingGuard>
        } />
        <Route path="league" element={<LeaguePage />} />
        <Route path="fixtures" element={<FixturesPage />} />
        <Route path="scout" element={<ScoutPage />} />
        <Route path="transfer-window" element={
          <GameweekUpdatingGuard>
            <TransferWindowPage />
          </GameweekUpdatingGuard>
        } />
        <Route path="draft-room" element={<PageLayout left={<DraftRoomWrapper />} />} />

        <Route path="settings" element={<SettingsPage />} />

        <Route
          path="league-control"
          element={
            <LeagueAdminRoute>
              <LeagueControlPage />
            </LeagueAdminRoute>
          }
        />

      </Route>

      <Route path="/admin" element={<AdminAppLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="actions" element={<AdminActionsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function OtherUserPointsWrapper() {
  const { userId } = useParams();
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
    return () => (cancelled = true);
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!otherUser) return <div>User not found</div>;

  return <PointsPage displayedUser={otherUser} />;
}

export default App;
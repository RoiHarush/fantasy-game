import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Temporary migration boundary for components that predate React Compiler
    // rules. Remove these exceptions feature-by-feature as their effects move
    // to Query or derived render state.
    files: [
      "src/Components/**/*.{js,jsx}",
      "src/Context/**/*.{js,jsx}",
      "src/HeaderCollage.jsx",
      "src/Portal.jsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    files: [
      "src/Context/AuthContext.jsx",
      "src/Context/FixturesContext.jsx",
      "src/Context/GameweeksContext.jsx",
      "src/Context/PlayersContext.jsx",
      "src/Context/TeamsContext.jsx",
      "src/Context/WatchlistContext.jsx",
      "src/Components/Auth/Login.jsx",
      "src/Components/Pages/PointsTab/PointsPage.jsx",
      "src/Components/Pages/PickTeamTab/PickTeamPage.jsx",
      "src/Components/Pages/DraftRoomTab/DraftRoomPage.jsx",
      "src/Components/Pages/ScoutTab/ScoutPage.jsx",
      "src/Components/Pages/StatusTab/Status.jsx",
      "src/Components/Pages/StatusTab/StatusPage.jsx",
      "src/Components/Pages/TransferWindowTab/TransferWindowPage.jsx",
      "src/Components/Pages/TransferWindowTab/TransferWindow.jsx",
      "src/Components/Pages/TransferWindowTab/ClosedWindow.jsx",
      "src/Components/Pages/TransferWindowTab/TurnOrderModal.jsx",
      "src/Components/Pages/WaiversTab/WaiverPlannerPage.jsx",
      "src/Components/Pages/FixturesTab/FixturesTable.jsx",
      "src/Components/Pages/LeagueTab/LeaguePage.jsx",
      "src/Components/Pages/LeagueOnboarding/LeagueOnboardingPage.jsx",
      "src/Components/Pages/Admin/LeagueControlPage.jsx",
      "src/Components/Pages/Admin/AssistManager.jsx",
      "src/Components/Pages/Admin/PenaltyManager.jsx",
      "src/Components/Pages/Admin/LockedPlayersManager.jsx",
      "src/Components/Pages/SettingsTab/SettingsPage.jsx",
      "src/Components/Sidebar/PointsSummaryBlock.jsx",
      "src/Components/Sidebar/SquadPlayersTable.jsx",
      "src/Components/Sidebar/TeamOfTheWeekBlock.jsx",
      "src/Components/General/CompareModal.jsx",
      "src/Components/General/HistoryModal.jsx",
      "src/Components/General/PlayerInfoModal.jsx",
      "src/Components/General/PlayerMatchModal.jsx",
      "src/Components/Pages/StatusTab/IRStatusTable.jsx",
      "src/Components/Pages/StatusTab/PlayerOfTheWeekBlock.jsx",
      "src/Components/Pages/StatusTab/PreDraftStatus.jsx",
      "src/Components/Pages/StatusTab/TransferActivityList.jsx",
      "src/hooks/useAllTeamFixtures.js",
      "src/features/**/*.{js,jsx}",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/preserve-manual-memoization": "error",
    },
  },
  globalIgnores([".next/**", "dist/**", "out/**", "coverage/**", "next-env.d.ts"]),
]);

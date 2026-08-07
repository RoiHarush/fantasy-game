import LeagueOnboardingPage from "../../../src/Components/Pages/LeagueOnboarding/LeagueOnboardingPage";
import { requireUserWithoutLeague } from "../../../src/server/auth";

export default async function OnboardingPage() {
    await requireUserWithoutLeague();
    return <LeagueOnboardingPage />;
}

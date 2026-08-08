import LeagueTable from "../Pages/LeagueTab/LeagueTable";


function LeagueBlock({ currentUser, league }) {

    return (
        <section className="w-full overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm transition-colors">
            <div className="border-b border-black/5 bg-component-gradient px-4 py-3 text-base font-bold text-brand-ink">
                League Standings
            </div>
            <div className="px-3 py-2 sm:px-4">
                <LeagueTable league={league} currentUser={currentUser} compact={true} />
            </div>
        </section>
    );
}

export default LeagueBlock;

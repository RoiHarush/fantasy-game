import { formatAppDateTime } from "../../lib/dateTime";

function PickTeamBlock({ gameweek, kickoffTime }) {
    return (
        <section className="my-2.5 w-full overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--app-border)_75%,transparent)] bg-[color-mix(in_srgb,var(--app-surface-elevated)_94%,transparent)] text-center text-app-foreground md:my-5">
            <div className="mx-3 rounded-b-xl bg-[#2c0032] px-2.5 py-1 text-[0.85rem] font-bold text-cyan-300 md:py-1.5 md:text-[0.95rem]">
                {`Gameweek ${gameweek}`}
            </div>
            <div className="my-2.5 text-[1.1rem] font-bold text-app-foreground md:my-4 md:text-[1.8rem]">
                {formatAppDateTime(kickoffTime) ?? "TBA"}
            </div>
        </section>
    );
}

export default PickTeamBlock;

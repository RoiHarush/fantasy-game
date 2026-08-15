import Link from "next/link";
import { Pencil } from "@/src/shared/ui/icons";

import TeamIdentityImage from "../../shared/ui/TeamIdentityImage";

function UserClubBlock({ title = "My Club", logoPath, editable = false }) {
    return (
        <section className="w-full overflow-hidden rounded-xl border border-app-border bg-app-surface text-center shadow-panel">
            <header className="flex min-w-0 items-center justify-between gap-3 bg-component-gradient px-3.5 py-3 text-left text-brand-ink">
                <h2 className="min-w-0 truncate text-base font-black sm:text-lg">{title}</h2>
                {editable && (
                    <Link
                        href="/team"
                        className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand-ink/20 bg-white/20 text-brand-ink transition hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                        aria-label="Edit team name and logo"
                        title="Edit team"
                    >
                        <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                )}
            </header>
            <div className="flex min-h-52 items-center justify-center bg-app-surface-elevated px-4 py-4 sm:min-h-60 sm:px-5">
                <TeamIdentityImage
                    src={logoPath}
                    alt={`${title} logo`}
                    className="w-full max-w-44 sm:max-w-52"
                />
            </div>
        </section>
    );
}

export default UserClubBlock;

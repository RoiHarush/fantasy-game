import Link from "next/link";
import { Pencil } from "@/src/shared/ui/icons";

import ImageWithFallback from "../../shared/ui/ImageWithFallback";

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
            <div className="flex min-h-44 items-center justify-center bg-app-surface-elevated px-5 py-6 sm:min-h-48">
                <ImageWithFallback
                    src={logoPath}
                    fallbackSrc="/UI/team-placeholder.svg"
                    alt={`${title} logo`}
                    width={140}
                    height={140}
                    unoptimized
                    className="size-32 object-contain drop-shadow-[0_4px_8px_rgb(0_0_0/0.15)] sm:size-36"
                />
            </div>
        </section>
    );
}

export default UserClubBlock;

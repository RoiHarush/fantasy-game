"use client";

import Image from "next/image";

import { useTeams } from "../../features/teams/useTeams";
import ImageWithFallback from "../../shared/ui/ImageWithFallback";
import ThemeToggle from "../Theme/ThemeToggle";

const CAROUSEL_ROW_COUNT = 8;
const BADGES_PER_ROW = 10;

function ClubBadgeCarousel({ teams, isPending }) {
    const rows = Array.from({ length: CAROUSEL_ROW_COUNT }, (_, rowIndex) => (
        Array.from({ length: BADGES_PER_ROW }, (_, badgeIndex) => (
            teams.length > 0 ? teams[(badgeIndex + rowIndex * 3) % teams.length] : null
        ))
    ));

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {rows.map((rowTeams, rowIndex) => (
                <div
                    key={rowIndex}
                    className="absolute left-0 flex h-16 w-full items-center overflow-hidden sm:h-20"
                    style={{ top: `${rowIndex * 12.25}%` }}
                >
                    <div
                        className="flex w-max will-change-transform [animation:login-club-marquee_var(--login-marquee-duration)_linear_infinite] [animation-direction:var(--login-marquee-direction)] motion-reduce:animate-none"
                        style={{
                            "--login-marquee-duration": `${94 + rowIndex * 7}s`,
                            "--login-marquee-direction": rowIndex % 2 === 0 ? "normal" : "reverse",
                        }}
                    >
                        {[0, 1].map((segmentIndex) => (
                            <div key={segmentIndex} className="flex shrink-0 items-center gap-10 pr-10 sm:gap-16 sm:pr-16">
                                {rowTeams.map((team, badgeIndex) => (
                                    team && !isPending ? (
                                        <ImageWithFallback
                                            key={`${team.id}-${badgeIndex}`}
                                            src={team.badgeUrl}
                                            fallbackSrc="/UI/club-placeholder.svg"
                                            alt=""
                                            width={64}
                                            height={64}
                                            sizes="(max-width: 639px) 46px, 60px"
                                            className="size-12 shrink-0 object-contain opacity-35 drop-shadow-[0_4px_7px_rgba(27,16,53,0.22)] sm:size-15 dark:opacity-30"
                                        />
                                    ) : (
                                        <span key={`placeholder-${badgeIndex}`} className="size-12 shrink-0 rounded-full bg-white/12 sm:size-15" />
                                    )
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AuthBrandIntro({ eyebrow, title, description }) {
    return (
        <div className="text-center text-white [text-shadow:0_4px_18px_rgba(27,16,53,0.28)]">
            <div className="mx-auto flex w-fit items-center gap-3">
                <Image
                    src="/UI/premier-league-logo.svg"
                    alt="Premier League lion"
                    width={112}
                    height={112}
                    priority
                    className="size-20 object-contain drop-shadow-[0_7px_12px_rgba(27,16,53,0.3)] sm:size-24"
                />
                <span className="rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-[0.64rem] font-black uppercase tracking-[0.16em] backdrop-blur-md">
                    The fun version
                </span>
            </div>
            {eyebrow}
            <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-white/80 sm:text-base">{description}</p>
        </div>
    );
}

export default function AuthPageShell({ children }) {
    const teamsQuery = useTeams({ allowUnauthenticated: true });

    return (
        <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-brand-gradient px-4 py-5 text-app-foreground sm:px-6 sm:py-7">
            <ClubBadgeCarousel teams={teamsQuery.teams} isPending={teamsQuery.isPending} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(27,16,53,0.08)_55%,rgba(27,16,53,0.2)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(9,11,18,0.12)_0,rgba(9,11,18,0.38)_62%,rgba(9,11,18,0.62)_100%)]" aria-hidden="true" />
            <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6"><ThemeToggle /></div>
            <main className="relative z-10 flex flex-1 items-center justify-center py-12 sm:py-14">{children}</main>
            <footer className="relative z-10 text-center text-[0.68rem] font-semibold tracking-wide text-white/65 sm:text-xs">
                Educational project · Not affiliated with the Premier League
            </footer>
        </div>
    );
}

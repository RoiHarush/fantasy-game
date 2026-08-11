import ImageWithFallback from "../../../shared/ui/ImageWithFallback";
import { cn } from "../../../lib/cn";

function TeamLogo({ team, className }) {
    const badgeUrl = team?.badgeUrl || `/Logos/${team?.id ?? 0}_logo.svg`;

    return (
        <ImageWithFallback
            src={badgeUrl}
            fallbackSrc="/UI/club-placeholder.svg"
            alt={`${team?.name || "Unknown team"} logo`}
            width={48}
            height={48}
            className={cn("size-[30px] max-h-full max-w-full object-contain md:size-9", className)}
        />
    );
}

export default TeamLogo;

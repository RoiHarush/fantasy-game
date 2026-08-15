import { cn } from "../../lib/cn";
import ImageWithFallback from "./ImageWithFallback";

function TeamIdentityImage({ src, alt, className, sizes = "(max-width: 640px) 11rem, 13rem" }) {
    return (
        <div className={cn(
            "relative aspect-square overflow-hidden rounded-2xl border border-app-border bg-app-surface-muted shadow-sm",
            className,
        )}>
            <ImageWithFallback
                src={src}
                fallbackSrc="/UI/team-placeholder.svg"
                alt={alt}
                fill
                sizes={sizes}
                unoptimized
                className="object-cover object-center"
            />
        </div>
    );
}

export default TeamIdentityImage;

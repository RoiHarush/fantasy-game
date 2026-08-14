import { Eye } from "@/src/shared/ui/icons";
import { Button } from "../../shared/ui/Button";

function WatchButton({ isWatched, onToggle, disabled = false }) {
    const handleClick = (e) => {
        e.stopPropagation();
        onToggle();
    };

    return (
        <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleClick}
            disabled={disabled}
            aria-pressed={isWatched}
            className={`mx-auto inline-flex size-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent disabled:cursor-wait disabled:opacity-100 xl:h-9 xl:w-auto xl:px-2.5 ${isWatched
                ? "border-app-accent bg-app-accent-surface text-app-accent-foreground shadow-sm"
                : "border-app-border bg-app-surface text-app-muted hover:border-app-accent-border hover:bg-app-accent-hover hover:text-app-foreground"
            }`}
            title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
            <Eye className="size-4" />
            <span className="hidden xl:inline">Watch</span>
        </Button>
    );
}

export default WatchButton;


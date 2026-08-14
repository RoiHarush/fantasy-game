import { ArrowLeft, ArrowRight } from "../../../shared/ui/icons";
import { Button } from "../../../shared/ui/Button";

function GameweekController({ onPrev, onNext, canGoPrevious, canGoNext, gw }) {
    const navigationClassName = "border-0 bg-transparent font-semibold text-brand-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white pointer-fine:hover:text-white";

    return (
        <div className="relative z-[2] grid grid-cols-[5rem_minmax(0,1fr)_5rem] items-center px-0 py-2 text-center font-semibold text-brand-ink md:grid-cols-[7.5rem_minmax(0,1fr)_7.5rem]">
            {canGoPrevious ? (
                <Button type="button" variant="ghost" size="sm" onClick={onPrev} className={navigationClassName}>
                    <ArrowLeft className="mr-1 inline size-3.5" aria-hidden="true" /> Previous
                </Button>
            ) : <span aria-hidden="true" />}
            <div className="font-bold">Gameweek {gw}</div>
            {canGoNext ? (
                <Button type="button" variant="ghost" size="sm" onClick={onNext} className={navigationClassName}>
                    Next <ArrowRight className="ml-1 inline size-3.5" aria-hidden="true" />
                </Button>
            ) : <span aria-hidden="true" />}
        </div>
    );
}

export default GameweekController;

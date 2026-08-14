import { cn } from "../../lib/cn";
import { Button } from "../../shared/ui/Button";

function Switcher({ active, options, onChange, labels = {} }) {
    return (
        <div className="mx-auto flex w-full max-w-full rounded-[9px] border border-app-border bg-app-surface-muted p-1 min-[481px]:w-fit">
            {options.map((option) => {
                const label = labels[option];
                return (
                    <Button
                    type="button"
                    variant="ghost"
                    key={option}
                    onClick={() => onChange(option)}
                    aria-pressed={active === option}
                    className={cn(
                        "min-w-0 flex-1 cursor-pointer whitespace-nowrap rounded-[7px] border-0 bg-transparent px-3 py-[7px] font-bold text-app-muted transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent pointer-fine:hover:text-app-foreground min-[481px]:px-6",
                        active === option && "bg-app-surface-elevated text-app-foreground shadow-[0_2px_8px_color-mix(in_srgb,var(--app-foreground)_10%,transparent)]",
                    )}
                    >
                        {label ? (
                            <>
                                <span className="sm:hidden">{label.mobile}</span>
                                <span className="hidden sm:inline">{label.desktop}</span>
                            </>
                        ) : option}
                    </Button>
                );
            })}
        </div>
    );
}

export default Switcher;

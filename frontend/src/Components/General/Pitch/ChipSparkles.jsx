import { cn } from "../../../lib/cn";

const captainParticles = [
    ["8%", "14%", "0s", "-12px", "-18px", "-124deg"],
    ["84%", "7%", "0.35s", "12px", "-17px", "-55deg"],
    ["96%", "42%", "0.7s", "18px", "-4px", "-13deg"],
    ["76%", "82%", "1.05s", "12px", "17px", "55deg"],
    ["18%", "88%", "1.4s", "-11px", "18px", "121deg"],
    ["-2%", "54%", "1.75s", "-18px", "2px", "174deg"],
];

function ChipSparkles() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1 -inset-y-2 z-0 motion-reduce:hidden"
        >
            {captainParticles.map(([left, top, delay, sparkX, sparkY, angle], index) => (
                <span
                    key={`${left}-${top}`}
                    className="absolute size-0 [animation:chip-spark_2.4s_ease-out_infinite]"
                    style={{
                        left,
                        top,
                        animationDelay: delay,
                        "--spark-x": sparkX,
                        "--spark-y": sparkY,
                    }}
                >
                    <span
                        className={cn(
                            "absolute top-0 right-0 block h-[3px] w-[18px] origin-right rounded-full bg-gradient-to-r from-transparent blur-[0.15px]",
                            index % 2 === 0
                                ? "via-violet-300/90 to-violet-100 shadow-[0_0_8px_rgba(196,181,253,1)]"
                                : "via-fuchsia-300/90 to-fuchsia-100 shadow-[0_0_8px_rgba(240,171,252,1)]",
                        )}
                        style={{ transform: `rotate(${angle})` }}
                    />
                    <span
                        className={cn(
                            "absolute -top-0.5 -right-0.5 size-1.5 rounded-full shadow-[0_0_7px_currentColor]",
                            index % 2 === 0 ? "bg-violet-100 text-violet-200" : "bg-fuchsia-100 text-fuchsia-200",
                        )}
                    />
                </span>
            ))}
        </span>
    );
}

export default ChipSparkles;

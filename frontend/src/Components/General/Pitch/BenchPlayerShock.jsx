import { BENCH_BOOST_CYCLE_SECONDS } from "./benchBoostTiming";

const PATTERN_COUNT = 4;
const PATTERN_DURATION = `${BENCH_BOOST_CYCLE_SECONDS * PATTERN_COUNT}s`;
const PATTERN_KEY_TIMES = "0;0.25;0.5;0.75;1";

function createRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;

    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function round(value) {
    return Number(value.toFixed(1));
}

function pointBetween(start, end, progress, random, spread) {
    return {
        x: round(start.x + (end.x - start.x) * progress + (random() - 0.5) * spread),
        y: round(start.y + (end.y - start.y) * progress + (random() - 0.5) * spread),
    };
}

function buildJaggedPath(start, end, random, spread = 4) {
    const firstBend = pointBetween(start, end, 0.34, random, spread);
    const secondBend = pointBetween(start, end, 0.68, random, spread);

    return `M ${start.x} ${start.y} L ${firstBend.x} ${firstBend.y} L ${secondBend.x} ${secondBend.y} L ${end.x} ${end.y}`;
}

function buildPattern(playerIndex, patternIndex) {
    const random = createRandom((playerIndex + 1) * 1009 + (patternIndex + 1) * 9176);
    const source = { x: round(48 + random() * 4), y: 1 };
    const fork = { x: round(47 + random() * 6), y: round(15 + random() * 5) };

    // The two invisible impact targets always land on opposite halves of the shirt.
    const leftTarget = { x: round(40 + random() * 7), y: round(39 + random() * 10) };
    const rightTarget = { x: round(53 + random() * 7), y: round(39 + random() * 10) };
    const leftBranchStart = pointBetween(fork, leftTarget, 0.58, random, 1.5);
    const rightBranchStart = pointBetween(fork, rightTarget, 0.58, random, 1.5);
    const leftBranchEnd = {
        x: round(leftBranchStart.x - (4 + random() * 4)),
        y: round(leftBranchStart.y + 3 + random() * 5),
    };
    const rightBranchEnd = {
        x: round(rightBranchStart.x + 4 + random() * 4),
        y: round(rightBranchStart.y + 3 + random() * 5),
    };

    return {
        paths: [
            buildJaggedPath(source, fork, random, 3.4),
            buildJaggedPath(fork, leftTarget, random, 4.2),
            buildJaggedPath(fork, rightTarget, random, 4.2),
            buildJaggedPath(leftBranchStart, leftBranchEnd, random, 2.8),
            buildJaggedPath(rightBranchStart, rightBranchEnd, random, 2.8),
        ],
        leftTarget,
        rightTarget,
    };
}

function animatedValues(patterns, selector) {
    const values = patterns.map(selector);
    return [...values, values[0]].join(";");
}

function AnimatedBoltPaths({ patterns, className }) {
    return (
        <g className={className}>
            {patterns[0].paths.map((initialPath, pathIndex) => (
                <path key={pathIndex} d={initialPath}>
                    <animate
                        attributeName="d"
                        dur={PATTERN_DURATION}
                        repeatCount="indefinite"
                        calcMode="discrete"
                        keyTimes={PATTERN_KEY_TIMES}
                        values={animatedValues(patterns, (pattern) => pattern.paths[pathIndex])}
                    />
                </path>
            ))}
        </g>
    );
}

function ImpactPoint({ patterns, side }) {
    const targetKey = side === "left" ? "leftTarget" : "rightTarget";
    const initialTarget = patterns[0][targetKey];

    return (
        <circle
            className="bench-shock-impact-point"
            cx={initialTarget.x}
            cy={initialTarget.y}
            r="2.3"
        >
            <animate
                attributeName="cx"
                dur={PATTERN_DURATION}
                repeatCount="indefinite"
                calcMode="discrete"
                keyTimes={PATTERN_KEY_TIMES}
                values={animatedValues(patterns, (pattern) => pattern[targetKey].x)}
            />
            <animate
                attributeName="cy"
                dur={PATTERN_DURATION}
                repeatCount="indefinite"
                calcMode="discrete"
                keyTimes={PATTERN_KEY_TIMES}
                values={animatedValues(patterns, (pattern) => pattern[targetKey].y)}
            />
        </circle>
    );
}

function BenchPlayerShock({ index }) {
    const patterns = Array.from(
        { length: PATTERN_COUNT },
        (_, patternIndex) => buildPattern(index, patternIndex),
    );

    return (
        <svg
            aria-hidden="true"
            className="bench-player-shock pointer-events-none absolute inset-x-0 -top-[2%] z-[3] h-[66%] w-full overflow-visible motion-reduce:hidden"
            viewBox="0 0 100 58"
            preserveAspectRatio="none"
        >
            <ImpactPoint patterns={patterns} side="left" />
            <ImpactPoint patterns={patterns} side="right" />
            <AnimatedBoltPaths patterns={patterns} className="bench-shock-glow" />
            <AnimatedBoltPaths patterns={patterns} className="bench-shock-core" />
        </svg>
    );
}

export default BenchPlayerShock;

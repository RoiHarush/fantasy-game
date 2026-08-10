import { useId } from "react";

const BORDER_PATH = "M 5 2 H 95 Q 98 2 98 5 V 95 Q 98 98 95 98 H 5 Q 2 98 2 95 V 5 Q 2 2 5 2 Z";

function BenchBoostEffect() {
    const filterId = `bench-electric-${useId().replaceAll(":", "")}`;

    return (
        <svg
            aria-hidden="true"
            className="bench-electric-cycle pointer-events-none absolute inset-0 z-[2] size-full overflow-visible motion-reduce:hidden"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                <filter id={filterId} x="-18%" y="-18%" width="136%" height="136%" colorInterpolationFilters="sRGB">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.04 0.18"
                        numOctaves="3"
                        seed="7"
                        result="electricNoise"
                    >
                        <animate
                            attributeName="baseFrequency"
                            dur="0.16s"
                            repeatCount="indefinite"
                            values="0.04 0.18;0.065 0.26;0.03 0.14;0.055 0.22;0.04 0.18"
                        />
                    </feTurbulence>
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="electricNoise"
                        scale="5.5"
                        xChannelSelector="R"
                        yChannelSelector="B"
                        result="displacedLine"
                    />
                    <feGaussianBlur in="displacedLine" stdDeviation="2.8" result="electricGlow" />
                    <feMerge>
                        <feMergeNode in="electricGlow" />
                        <feMergeNode in="displacedLine" />
                    </feMerge>
                </filter>
            </defs>

            <path
                d={BORDER_PATH}
                pathLength="100"
                fill="none"
                stroke="rgb(6 182 212)"
                strokeWidth="5.8"
                strokeDasharray="24 76"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter={`url(#${filterId})`}
                className="bench-electric-line bench-electric-glow"
            />
            <path
                d={BORDER_PATH}
                pathLength="100"
                fill="none"
                stroke="rgb(34 211 238)"
                strokeWidth="3.2"
                strokeDasharray="18 82"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter={`url(#${filterId})`}
                className="bench-electric-line bench-electric-core"
            />
            <path
                d={BORDER_PATH}
                pathLength="100"
                fill="none"
                stroke="rgb(236 254 255)"
                strokeWidth="1.35"
                strokeDasharray="7 93"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter={`url(#${filterId})`}
                className="bench-electric-line bench-electric-flash"
            />
        </svg>
    );
}

export default BenchBoostEffect;

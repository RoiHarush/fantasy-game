import { useId } from "react";

const BORDER_PATH = "M 5 2 H 95 Q 98 2 98 5 V 95 Q 98 98 95 98 H 5 Q 2 98 2 95 V 5 Q 2 2 5 2 Z";

function BenchBoostEffect() {
    const filterId = `bench-bolt-${useId().replaceAll(":", "")}`;

    return (
        <svg
            aria-hidden="true"
            className="bench-electric-cycle pointer-events-none absolute inset-0 z-[2] size-full overflow-visible motion-reduce:hidden"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                <filter id={filterId} x="-24%" y="-24%" width="148%" height="148%" colorInterpolationFilters="sRGB">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.15 0.58"
                        numOctaves="3"
                        seed="11"
                        result="electricNoise"
                    >
                        <animate
                            attributeName="baseFrequency"
                            dur="0.11s"
                            repeatCount="indefinite"
                            values="0.15 0.58;0.19 0.72;0.13 0.64;0.21 0.76;0.15 0.58"
                        />
                    </feTurbulence>
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="electricNoise"
                        scale="2.8"
                        xChannelSelector="R"
                        yChannelSelector="B"
                        result="displacedBolt"
                    />

                    <feGaussianBlur in="displacedBolt" stdDeviation="3.1" result="wideBlur" />
                    <feFlood floodColor="rgb(34 211 238)" floodOpacity="0.48" result="wideGlowColor" />
                    <feComposite in="wideGlowColor" in2="wideBlur" operator="in" result="wideGlow" />

                    <feGaussianBlur in="displacedBolt" stdDeviation="0.75" result="tightBlur" />
                    <feFlood floodColor="rgb(103 232 249)" floodOpacity="0.9" result="tightGlowColor" />
                    <feComposite in="tightGlowColor" in2="tightBlur" operator="in" result="tightGlow" />

                    <feMerge>
                        <feMergeNode in="wideGlow" />
                        <feMergeNode in="tightGlow" />
                        <feMergeNode in="displacedBolt" />
                    </feMerge>
                </filter>
            </defs>

            <path
                d={BORDER_PATH}
                pathLength="100"
                fill="none"
                stroke="rgb(236 254 255)"
                strokeWidth="1.2"
                strokeDasharray="12 88"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter={`url(#${filterId})`}
                className="bench-electric-bolt"
            />
        </svg>
    );
}

export default BenchBoostEffect;

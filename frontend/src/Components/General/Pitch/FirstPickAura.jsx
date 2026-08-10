const auraParticles = [
    ["13%", "0s", "3px", "h-4"],
    ["27%", "0.55s", "-2px", "h-6"],
    ["44%", "1.1s", "2px", "h-5"],
    ["61%", "1.65s", "-3px", "h-7"],
    ["77%", "2.2s", "2px", "h-4"],
    ["89%", "2.75s", "-2px", "h-5"],
];

function FirstPickAura() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[12%] -top-[18%] -bottom-[2%] z-0 overflow-visible motion-reduce:hidden"
        >
            <span className="absolute inset-x-[8%] top-[8%] -bottom-[5%] rounded-[50%] bg-red-500/30 blur-md [animation:first-pick-aura-pulse_2.8s_ease-in-out_infinite]" />
            <span className="absolute inset-x-[24%] top-[2%] -bottom-[8%] rounded-[50%] bg-rose-300/25 blur-sm [animation:first-pick-aura-pulse_2.1s_ease-in-out_infinite_reverse]" />
            {auraParticles.map(([left, delay, drift, height]) => (
                <span
                    key={`${left}-${delay}`}
                    className={`absolute bottom-0 w-0.5 ${height} rounded-full bg-gradient-to-t from-red-600/0 via-red-300 to-rose-50/0 [animation:first-pick-aura-rise_3.3s_ease-out_infinite] [filter:drop-shadow(0_0_4px_rgb(239_68_68/1))_drop-shadow(0_0_7px_rgb(251_113_133/0.75))]`}
                    style={{ left, animationDelay: delay, "--aura-drift": drift }}
                />
            ))}
        </span>
    );
}

export default FirstPickAura;

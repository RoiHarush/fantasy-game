const particles = [
    ["18%", "0s", "-3px"],
    ["50%", "1.6s", "3px"],
    ["82%", "3.2s", "-2px"],
];

function TripleCaptainEffect() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] top-0 bottom-0 z-[2] overflow-visible motion-reduce:hidden"
        >
            {particles.map(([left, delay, drift]) => (
                <span
                    key={`${left}-${delay}`}
                    className="absolute bottom-[4%] text-[9px] font-black tracking-[-0.08em] text-cyan-100 [animation:triple-captain-rise_4.8s_linear_infinite] [filter:drop-shadow(0_0_4px_rgb(34_211_238/0.95))_drop-shadow(0_0_7px_rgb(168_85_247/0.75))] max-md:text-[6px]"
                    style={{ left, animationDelay: delay, "--x3-drift": drift }}
                >
                    ×3
                </span>
            ))}
        </span>
    );
}

export default TripleCaptainEffect;

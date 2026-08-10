function IrContainment({ children }) {
    return (
        <span className="relative isolate grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-400/35 bg-slate-950/10 max-md:h-14 max-md:w-12">
            <span className="relative z-0">{children}</span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1] bg-[repeating-linear-gradient(90deg,transparent_0_7px,rgb(71_85_105/0.72)_7px_9px)] shadow-[inset_0_0_10px_rgb(15_23_42/0.42)]"
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1.5 z-[2] h-px bg-slate-300/75" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-1.5 z-[2] h-px bg-slate-300/75" />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 z-[3] w-1/3 skew-x-[-18deg] bg-white/25 blur-sm [animation:ir-containment-scan_4s_ease-in-out_infinite] motion-reduce:hidden"
            />
        </span>
    );
}

export default IrContainment;

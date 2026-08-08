import Image from "next/image";

import { cn } from "../../lib/cn";

function ColumnsBlock({ title, children, columns = 1 }) {
    return (
        <section className="relative my-3 w-full overflow-hidden rounded-xl bg-brand-ink text-white shadow-sm md:my-5 dark:bg-[#24122f]">
            <div className="mx-2 rounded-b-xl bg-linear-to-r from-brand-green to-brand-cyan px-3 py-1.5 text-center text-sm font-bold text-brand-ink sm:text-base">
                {title}
            </div>
            <div
                className={cn(
                    "relative z-1 text-center",
                    columns === 1
                        ? "p-4 sm:p-5"
                        : "grid grid-cols-1 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:justify-center [&>div]:p-4 md:grid-cols-2 md:[&>div]:p-5 md:[&>div+div]:border-l md:[&>div+div]:border-white/15",
                )}
            >
                {children}
            </div>
            <Image
                src="/UI/pattern-1_small.png"
                alt=""
                width={120}
                height={120}
                className="pointer-events-none absolute -bottom-1 -left-2 h-auto w-10 opacity-40 sm:w-16 sm:opacity-60"
            />
        </section>
    );
}

export default ColumnsBlock;


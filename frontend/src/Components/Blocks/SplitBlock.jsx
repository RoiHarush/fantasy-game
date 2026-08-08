import Image from "next/image";

function SplitBlock({ items, footer = null }) {
    return (
        <div className="my-3 w-full md:my-5">
            <div className="grid w-full grid-cols-1 overflow-hidden rounded-xl bg-brand-ink text-white shadow-sm md:grid-cols-2 dark:bg-[#24122f]">
                {items.map((item) => (
                    <section
                        key={item.id ?? item.title}
                        className="relative flex min-w-0 flex-col border-b border-white/10 text-center last:border-b-0 md:border-b-0 md:not-last:border-r md:not-last:border-white/15"
                    >
                        <div className="mx-3 rounded-b-xl bg-linear-to-r from-brand-green to-brand-cyan px-3 py-1.5 text-sm font-bold text-brand-ink sm:text-base">
                            {item.title}
                        </div>
                        <div className="relative z-1 p-4 text-base sm:text-lg">{item.content}</div>
                        <Image
                            src="/UI/pattern-1_small.png"
                            alt=""
                            width={120}
                            height={120}
                            className="pointer-events-none absolute -bottom-1 -left-2 h-auto w-10 opacity-40 sm:w-16 sm:opacity-60 md:[section:nth-child(2)_&]:hidden"
                        />
                    </section>
                ))}
            </div>
            {footer && <div className="mt-3">{footer}</div>}
        </div>
    );
}

export default SplitBlock;


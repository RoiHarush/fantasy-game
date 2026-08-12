import Image from "next/image";

function Block({ title, children }) {
    return (
        <section className="relative my-3 w-full overflow-hidden rounded-xl bg-[#2a0030] text-white md:my-5 dark:bg-[#24122f]">
            <div className="mx-2 rounded-b-xl bg-linear-to-r from-brand-green to-brand-cyan px-2.5 py-1.5 text-center text-[0.95rem] font-bold text-black">
                {title}
            </div>
            <div className="relative z-1 p-4 text-center md:p-5">{children}</div>
            <Image
                src="/UI/pattern-1_small.png"
                alt=""
                aria-hidden="true"
                width={70}
                height={70}
                className="pointer-events-none absolute bottom-0 -left-2.5 h-auto w-10 opacity-40 md:w-[clamp(50px,15vw,70px)] md:opacity-60"
            />
        </section>
    );
}

export default Block;

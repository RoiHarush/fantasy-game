import Image from "next/image";
import Link from "next/link";

import { ArrowLeft } from "@/src/shared/ui/icons";
import { Button } from "@/src/shared/ui/Button";

export default function NotFoundPage() {
    return (
        <main className="relative isolate grid min-h-[100dvh] overflow-hidden bg-app-background px-5 py-12 text-app-foreground sm:px-8 lg:px-12">
            <div className="pointer-events-none absolute -left-28 top-12 -z-10 size-80 rounded-full bg-brand-purple/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-24 bottom-8 -z-10 size-96 rounded-full bg-brand-cyan/12 blur-3xl" aria-hidden="true" />

            <section className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
                <div className="order-2 text-center lg:order-1 lg:text-left">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-app-positive-foreground">VAR check complete</p>
                    <p className="mt-2 bg-component-gradient bg-clip-text text-[clamp(5.5rem,18vw,10rem)] font-black leading-none tracking-[-0.08em] text-transparent" aria-hidden="true">
                        404
                    </p>
                    <div className="mt-3">
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Caught offside!</h1>
                        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-app-muted lg:mx-0 lg:text-lg">
                            You&apos;ve drifted beyond the last defender. The page you&apos;re looking for is no longer in play.
                        </p>
                    </div>
                    <Button asChild size="lg" className="mt-7 rounded-xl px-7">
                        <Link href="/">
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back to the pitch
                        </Link>
                    </Button>
                </div>

                <div className="order-1 flex min-h-64 items-center justify-center lg:order-2 lg:min-h-[30rem]" aria-hidden="true">
                    <Image
                        src="/UI/offside-404.png"
                        alt=""
                        width={512}
                        height={512}
                        priority
                        className="h-auto w-full max-w-[19rem] drop-shadow-[0_24px_45px_rgba(128,78,185,0.22)] sm:max-w-[25rem] lg:max-w-[30rem]"
                    />
                </div>
            </section>
        </main>
    );
}

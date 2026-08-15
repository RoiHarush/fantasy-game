"use client";

import Image from "next/image";
import Link from "next/link";

import { ArrowLeft, RotateCcw } from "./icons";
import { Button } from "./Button";

export default function RouteError({ reset }) {
    return (
        <main className="relative isolate grid min-h-[100dvh] overflow-hidden bg-app-background px-5 py-12 text-app-foreground sm:px-8 lg:px-12" role="alert">
            <div className="pointer-events-none absolute -left-24 bottom-0 -z-10 size-96 rounded-full bg-brand-cyan/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-24 top-12 -z-10 size-80 rounded-full bg-red-500/10 blur-3xl" aria-hidden="true" />

            <section className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-10 lg:gap-16">
                <div className="flex min-h-72 items-end justify-center md:min-h-[34rem] md:justify-end" aria-hidden="true">
                    <Image
                        src="/UI/cry-500.png"
                        alt=""
                        width={1024}
                        height={1536}
                        priority
                        className="h-auto max-h-[68dvh] w-auto max-w-full object-contain drop-shadow-[0_28px_55px_rgba(0,0,0,0.28)] md:max-h-[78dvh]"
                    />
                </div>

                <div className="text-center md:text-left">
                    <p className="text-[clamp(6rem,20vw,12rem)] font-black leading-[0.78] tracking-[-0.08em] text-red-500 dark:text-red-400" aria-hidden="true">
                        500
                    </p>
                    <div className="mt-8">
                        <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                            Sorry, it&apos;s not you...
                            <span className="mt-1 block text-app-danger-foreground">It&apos;s us.</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-app-muted md:mx-0 lg:text-lg">
                            We&apos;re experiencing an internal server error. Please try again later.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                        <Button size="lg" onClick={reset} className="rounded-xl px-7">
                            <RotateCcw className="size-4" aria-hidden="true" />
                            Try again
                        </Button>
                        <Button asChild size="lg" variant="secondary" className="rounded-xl px-7">
                            <Link href="/">
                                <ArrowLeft className="size-4" aria-hidden="true" />
                                Back home
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

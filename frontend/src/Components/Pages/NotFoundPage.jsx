import Link from "next/link";

export default function NotFoundPage() {
    return (
        <main className="grid min-h-[80dvh] place-items-center px-4 py-12 text-center text-app-foreground">
            <section className="w-full max-w-lg rounded-3xl border border-app-border bg-app-surface px-6 py-10 shadow-panel sm:px-10 sm:py-12">
                <p className="bg-component-gradient bg-clip-text text-[clamp(4.5rem,18vw,7rem)] leading-none font-black tracking-[-0.08em] text-transparent" aria-hidden="true">404</p>
                <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Offside!</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-app-muted sm:text-base">
                    It looks like you&apos;ve wandered out of position. The page you are looking for
                    doesn&apos;t exist or has been transferred to another league.
                </p>
                <Link href="/" className="mt-7 inline-flex h-11 items-center justify-center rounded-control border border-app-positive-border bg-app-positive-surface px-5 text-sm font-bold text-app-positive-foreground transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan pointer-fine:hover:bg-app-positive-hover">
                    Return to Pitch
                </Link>
            </section>
        </main>
    );
}

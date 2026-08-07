"use client";

import { Button } from "./Button";

export default function RouteError({ error, reset }) {
    return (
        <section className="mx-auto flex min-h-72 max-w-xl flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Something went wrong</p>
            <h1 className="text-2xl font-bold text-slate-900">This screen could not be loaded</h1>
            <p className="text-slate-600">{error?.message || "Please try the request again."}</p>
            <Button onClick={reset}>Try again</Button>
        </section>
    );
}

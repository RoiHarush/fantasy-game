"use client";

import { Cookie, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const COOKIE_PREFERENCE_KEY = "fantasy-cookie-preference-v1";
const COOKIE_TOAST_ID = "fantasy-cookie-consent";

function savePreference(preference) {
    window.localStorage.setItem(COOKIE_PREFERENCE_KEY, preference);
    toast.dismiss(COOKIE_TOAST_ID);
}

function CookieConsentContent() {
    return (
        <section
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
            className="w-[min(42rem,calc(100vw-2rem))] rounded-2xl border border-app-border bg-app-surface p-4 text-app-foreground shadow-2xl transition-colors sm:p-5"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" aria-hidden="true">
                    <Cookie size={21} />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 id="cookie-consent-title" className="text-base font-bold sm:text-lg">
                        Your cookie preferences
                    </h2>
                    <p id="cookie-consent-description" className="mt-1 text-sm leading-6 text-app-muted">
                        We use essential cookies to keep you signed in and protect account actions. We do not currently use analytics or advertising cookies.
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    className="min-h-11 rounded-xl border border-app-border px-4 py-2 text-sm font-semibold transition hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                    onClick={() => savePreference("essential")}
                >
                    Essential only
                </button>
                <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                    onClick={() => savePreference("accepted")}
                >
                    <ShieldCheck size={17} aria-hidden="true" />
                    Accept
                </button>
            </div>
        </section>
    );
}

export default function CookieConsentToast() {
    useEffect(() => {
        if (window.localStorage.getItem(COOKIE_PREFERENCE_KEY)) return undefined;

        toast.custom(() => <CookieConsentContent />, {
            id: COOKIE_TOAST_ID,
            duration: Infinity,
            dismissible: false,
        });

        return undefined;
    }, []);

    return null;
}

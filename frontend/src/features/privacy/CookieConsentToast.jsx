"use client";

import { ShieldCheck } from "@/src/shared/ui/icons";
import Image from "next/image";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../../shared/ui/Button";

export const COOKIE_PREFERENCE_KEY = "fantasy-cookie-preference-v1";
const COOKIE_TOAST_ID = "fantasy-cookie-consent";

function savePreference(preference) {
    window.localStorage.setItem(COOKIE_PREFERENCE_KEY, preference);
    toast.dismiss(COOKIE_TOAST_ID);
}

export function CookieConsentContent({ onPreference = savePreference }) {
    return (
        <section
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
            className="w-[min(43rem,calc(100vw-1.25rem))] overflow-hidden rounded-3xl border border-app-border bg-app-surface text-app-foreground shadow-2xl transition-colors"
        >
            <div className="h-1.5 bg-component-gradient" aria-hidden="true" />
            <div className="grid grid-cols-[5.75rem_1fr] items-end gap-2 p-3.5 sm:grid-cols-[7rem_1fr] sm:gap-4 sm:p-5">
                <div className="relative h-24 self-end sm:h-28" aria-hidden="true">
                    <Image
                        src="/UI/baby-eat-cookie.png"
                        alt=""
                        fill
                        sizes="112px"
                        className="object-contain object-bottom drop-shadow-[0_8px_12px_rgb(15_23_42/0.2)]"
                    />
                </div>
                <div className="min-w-0 self-center">
                    <h2 id="cookie-consent-title" className="text-base font-bold sm:text-lg">
                        Your cookie preferences
                    </h2>
                    <p id="cookie-consent-description" className="mt-1 text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                        We use essential cookies to keep you signed in and protect account actions. We do not currently use analytics or advertising cookies.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="min-h-10 rounded-xl px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
                            onClick={() => onPreference("essential")}
                        >
                            Essential only
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            className="min-h-10 rounded-xl px-2.5 py-2 text-xs font-black sm:px-4 sm:text-sm"
                            onClick={() => onPreference("accepted")}
                        >
                            <ShieldCheck size={16} aria-hidden="true" />
                            Accept
                        </Button>
                    </div>
                </div>
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

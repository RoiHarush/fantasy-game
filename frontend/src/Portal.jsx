"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

export default function Portal({ children }) {
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    if (!mounted) return null;

    return createPortal(children, document.getElementById("modal-root") || document.body);
}

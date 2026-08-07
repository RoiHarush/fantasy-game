"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }) {
    const [mountNode, setMountNode] = useState(null);

    useEffect(() => {
        const root = document.getElementById("modal-root") || document.body;
        setMountNode(root);
        return () => setMountNode(null);
    }, []);

    if (!mountNode) return null;

    return createPortal(children, mountNode);
}

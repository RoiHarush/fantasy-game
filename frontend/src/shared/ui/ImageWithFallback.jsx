"use client";

import Image from "next/image";
import { useState } from "react";

function ImageWithFallback({ src, fallbackSrc, onError, alt, unoptimized = true, ...props }) {
    const sourceKey = `${src || ""}|${fallbackSrc}`;
    return (
        <FallbackImage
            key={sourceKey}
            src={src}
            fallbackSrc={fallbackSrc}
            onError={onError}
            alt={alt}
            unoptimized={unoptimized}
            {...props}
        />
    );
}

function FallbackImage({ src, fallbackSrc, onError, alt, ...props }) {
    const [failed, setFailed] = useState(false);
    const resolvedSource = failed || !src ? fallbackSrc : src;

    return (
        <Image
            {...props}
            src={resolvedSource}
            alt={alt}
            onError={(event) => {
                onError?.(event);
                if (!failed && resolvedSource !== fallbackSrc) setFailed(true);
            }}
        />
    );
}

export default ImageWithFallback;

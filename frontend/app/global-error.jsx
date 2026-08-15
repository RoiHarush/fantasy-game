"use client";

import RouteError from "../src/shared/ui/RouteError";

export default function GlobalError(props) {
    return (
        <html lang="en">
            <body>
                <RouteError {...props} />
            </body>
        </html>
    );
}

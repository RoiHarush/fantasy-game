import { describe, expect, it } from "vitest";

import { getObserverScreenHref } from "./observerModel";

describe("observer navigation", () => {
    it("keeps manager navigation inside the read-only league route", () => {
        expect(getObserverScreenHref(4, 17, "points")).toBe("/observe/4/17/points");
    });

    it("rejects screens that are not supported by observer mode", () => {
        expect(() => getObserverScreenHref(4, 17, "admin"))
            .toThrow("Unsupported observer screen: admin");
    });
});

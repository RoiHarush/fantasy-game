import { describe, expect, it } from "vitest";

import { carouselGameweeks, initialCarouselStart } from "./PlayerOfTheWeekBlock";

describe("Player of the Week carousel", () => {
    it("starts with GW1 and future placeholders during the opening gameweek", () => {
        expect(initialCarouselStart(1, 3)).toBe(0);
    });

    it("keeps GW2 centered between GW1 and the GW3 placeholder", () => {
        expect(initialCarouselStart(2, 3)).toBe(0);
    });

    it("keeps the current gameweek at the right from GW3 onward", () => {
        expect(initialCarouselStart(3, 3)).toBe(0);
        expect(initialCarouselStart(4, 3)).toBe(1);
        expect(initialCarouselStart(20, 3)).toBe(17);
    });

    it("opens GW38 with the two prior gameweeks while navigation remains circular", () => {
        expect(initialCarouselStart(38, 3)).toBe(35);
        expect(carouselGameweeks(37, 3)).toEqual([38, 1, 2]);
        expect(carouselGameweeks(36, 3)).toEqual([37, 38, 1]);
    });
});

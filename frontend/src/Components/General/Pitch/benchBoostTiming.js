export const BENCH_BOOST_CYCLE_SECONDS = 4.6;

export function getBenchImpactDelay(index, playerCount) {
    if (playerCount <= 0) return 0;

    return Number((BENCH_BOOST_CYCLE_SECONDS * index / playerCount).toFixed(3));
}

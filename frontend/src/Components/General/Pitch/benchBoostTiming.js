export const BENCH_BOOST_CYCLE_SECONDS = 4.6;

const BOLT_TRAVEL_FRACTION = 0.27;
const TOP_EDGE_START_X = 5;
const TOP_EDGE_LENGTH = 90;
const APPROXIMATE_BORDER_LENGTH = 372;

export function getBenchImpactDelay(index, playerCount) {
    if (playerCount <= 0) return 0;

    const playerCenterX = TOP_EDGE_START_X
        + TOP_EDGE_LENGTH * ((index + 0.5) / playerCount);
    const normalizedPathPosition = (playerCenterX - TOP_EDGE_START_X)
        / APPROXIMATE_BORDER_LENGTH;
    const boltTravelSeconds = BENCH_BOOST_CYCLE_SECONDS * BOLT_TRAVEL_FRACTION;

    return Number((normalizedPathPosition * boltTravelSeconds).toFixed(3));
}

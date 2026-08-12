function PointsBlock({ points }) {
    return (
        <section className="mx-auto mb-2.5 flex w-[140px] flex-col items-center justify-center rounded-xl bg-[#2c0032] p-2.5 text-center text-white md:mx-0 md:mb-0 md:w-[150px] md:rounded-lg md:p-4">
            <div className="mb-1 text-[0.85rem] font-normal opacity-90 md:mb-1.5 md:text-sm">Points</div>
            <div className="text-[1.6rem] font-bold leading-none text-cyan-300 md:text-[1.8rem]">{points}</div>
        </section>
    );
}

export default PointsBlock;

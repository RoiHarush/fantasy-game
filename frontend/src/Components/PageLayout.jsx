function PageLayout({ left, right }) {
    return (
        <div className="mx-auto grid w-full max-w-[90rem] min-w-0 grid-cols-1 items-start gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(18rem,0.8fr)] lg:gap-7 lg:px-8 xl:gap-9">
            <div className="flex min-w-0 w-full flex-col gap-5">{left}</div>
            <div className="flex min-w-0 w-full flex-col">{right}</div>
        </div>
    );
}

export default PageLayout;


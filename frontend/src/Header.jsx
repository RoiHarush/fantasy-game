import Image from "next/image";

import NavButtons from "./NavButtons";
import ThemeToggle from "./Components/Theme/ThemeToggle";

function Header({ navigationProps = undefined }) {
    return (
        <header className="relative z-40 w-full bg-brand-gradient text-white">
            <div className="relative flex min-h-17 w-full items-center overflow-hidden px-3 py-2 sm:min-h-20 sm:px-5 lg:min-h-23">
                <div className="relative z-10 flex min-w-0 w-full items-center gap-2.5 sm:gap-4">
                    <Image
                        src="/UI/draft-logo.svg"
                        alt="Fantasy Draft Logo"
                        width={300}
                        height={40}
                        priority
                        className="h-7 w-auto max-w-[min(13rem,calc(100vw-6.5rem))] shrink-0 object-contain sm:h-9 sm:max-w-[17rem] lg:h-10"
                    />
                    <span className="hidden whitespace-nowrap text-sm font-light text-white/85 sm:inline lg:text-[1.05rem]">(The Fun Version)</span>
                    <ThemeToggle />
                </div>
                <Image
                    src="/UI/pattern-1_header.png"
                    alt=""
                    width={480}
                    height={140}
                    priority
                    className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto max-w-[65%] object-contain object-right opacity-35 sm:opacity-50 lg:opacity-60"
                />
            </div>
            <NavButtons {...navigationProps} />
        </header>
    );
}

export default Header;


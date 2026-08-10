import { notFound } from "next/navigation";

import Footer from "../../src/Footer";
import Header from "../../src/Header";
import HeaderCollage from "../../src/HeaderCollage";
import UiLabPage from "../../src/Components/Pages/UiLab/UiLabPage";
import { TeamsProvider } from "../../src/Context/TeamsContext";

export default function UiLabRoute() {
    if (process.env.NODE_ENV !== "development") notFound();

    return (
        <TeamsProvider>
            <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip">
                <HeaderCollage />
                <Header />
                <div className="min-w-0 flex-1"><UiLabPage /></div>
                <Footer />
            </div>
        </TeamsProvider>
    );
}

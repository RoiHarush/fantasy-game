import Header from "../../src/Header";
import HeaderCollage from "../../src/HeaderCollage";
import Footer from "../../src/Footer";
import { TeamsProvider } from "../../src/Context/TeamsContext";
import { requireSiteUser } from "../../src/server/auth";

export default async function SiteLayout({ children }) {
    await requireSiteUser();

    return (
        <TeamsProvider>
            <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip">
                <HeaderCollage />
                <Header />
                <main className="min-w-0 flex-1">{children}</main>
                <Footer />
            </div>
        </TeamsProvider>
    );
}

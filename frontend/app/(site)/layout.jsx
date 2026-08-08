import Header from "../../src/Header";
import HeaderCollage from "../../src/HeaderCollage";
import Footer from "../../src/Footer";
import { TeamsProvider } from "../../src/Context/TeamsContext";
import { requireSiteUser } from "../../src/server/auth";

export default async function SiteLayout({ children }) {
    await requireSiteUser();

    return (
        <TeamsProvider>
            <div>
                <HeaderCollage />
                <Header />
                <main>{children}</main>
                <Footer />
            </div>
        </TeamsProvider>
    );
}

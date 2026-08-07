import Header from "../../src/Header";
import HeaderCollage from "../../src/HeaderCollage";
import Footer from "../../src/Footer";
import { requireSiteUser } from "../../src/server/auth";

export default async function SiteLayout({ children }) {
    await requireSiteUser();

    return (
        <div>
            <HeaderCollage />
            <Header />
            <main>{children}</main>
            <Footer />
        </div>
    );
}

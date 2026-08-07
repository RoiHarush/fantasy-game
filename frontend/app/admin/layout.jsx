import AdminShell from "../../src/Components/AdminShell";
import { requireSuperAdmin } from "../../src/server/auth";

export default async function AdminLayout({ children }) {
    await requireSuperAdmin();
    return <AdminShell>{children}</AdminShell>;
}

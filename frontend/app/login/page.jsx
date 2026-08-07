import { redirect } from "next/navigation";
import Login from "../../src/Components/Auth/Login";
import { getRootRedirectRoute } from "../../src/Utils/routing";
import { getCurrentUser } from "../../src/server/auth";

export default async function LoginPage() {
    const user = await getCurrentUser();
    if (user) redirect(getRootRedirectRoute(user));
    return <Login />;
}

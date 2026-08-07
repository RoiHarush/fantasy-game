import { redirect } from "next/navigation";
import { getRootRedirectRoute } from "../src/Utils/routing";
import { getCurrentUser } from "../src/server/auth";

export default async function HomePage() {
    const user = await getCurrentUser();
    redirect(getRootRedirectRoute(user));
}

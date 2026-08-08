import { redirect } from "next/navigation";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export default async function WaiversRoute() {
    await requireActiveLeagueUser();
    redirect("/scout");
}

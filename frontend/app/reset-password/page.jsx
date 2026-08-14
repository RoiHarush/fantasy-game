import ResetPassword from "../../src/Components/Auth/ResetPassword";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }) {
    const { token = "" } = await searchParams;
    return <ResetPassword token={token} />;
}

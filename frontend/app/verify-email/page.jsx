import VerifyEmail from "../../src/Components/Auth/VerifyEmail";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({ searchParams }) {
    const { token = "" } = await searchParams;
    return <VerifyEmail token={token} />;
}

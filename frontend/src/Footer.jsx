export default function Footer() {
    return (
        <footer className="mt-auto border-t border-app-border px-4 py-5 text-center text-xs text-app-muted transition-colors">
            <p>
                Fantasy Draft Project © {new Date().getFullYear()} By Roi Harush
            </p>
            <p className="mt-1 text-[0.7rem]">
                This is an educational project. Not affiliated with the Premier League.
            </p>
        </footer>
    );
}

export default function NewPlayerLabel({ className = "" }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center text-[0.5rem] font-black uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300 ${className}`}
            title="New arrival — reserved for the next supplemental draft"
            aria-label="New player reserved for the next supplemental draft"
        >
            New
        </span>
    );
}

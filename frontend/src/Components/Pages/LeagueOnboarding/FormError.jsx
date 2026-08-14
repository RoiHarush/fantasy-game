export default function FormError({ error }) {
    if (!error) return null;

    return (
        <p className="m-0 rounded-lg border border-app-danger-border bg-app-danger-surface px-3 py-2 text-sm font-semibold text-app-danger-foreground" role="alert">
            {error.message}
        </p>
    );
}

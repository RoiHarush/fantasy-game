import ChipConfirmDialog from "../ChipConfirmDialog";

function ConfirmFirstPickCaptainModal({ player, onConfirm, onCancel, isActive, pending = false }) {
    if (!player) return null;

    return (
        <ChipConfirmDialog
            title="First Pick Captain"
            icon="/Icons/fpcaptain-chip.svg"
            iconAlt="First Pick Captain chip"
            notice={`You can ${isActive ? "cancel" : "activate"} this chip anytime before the Gameweek deadline.`}
            confirmLabel={isActive ? "Cancel Chip" : "Play Chip"}
            destructive={isActive}
            pending={pending}
            onConfirm={onConfirm}
            onCancel={onCancel}
        >
            The points scored by your <strong className="text-[var(--app-foreground)]">first pick</strong>{" "}
            player (<strong className="text-[var(--app-foreground)]">{player.viewName}</strong>) will be doubled
            this Gameweek as your automatic captain.
        </ChipConfirmDialog>
    );
}

export default ConfirmFirstPickCaptainModal;

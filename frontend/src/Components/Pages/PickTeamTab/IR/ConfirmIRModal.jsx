import ChipConfirmDialog from "../ChipConfirmDialog";

function ConfirmIRModal({ confirmIRPlayer, onConfirm, onCancel, isActive, irPlayer, pending = false }) {
    if (!confirmIRPlayer) return null;

    return (
        <ChipConfirmDialog
            title="IR Chip"
            icon="/Icons/ir-chip.svg"
            iconAlt="IR chip"
            notice={isActive
                ? "Confirming this will release your IR player back to your squad."
                : "This action cannot be undone and will consume one IR chip."}
            confirmLabel={isActive ? "Confirm Release" : "Play IR Chip"}
            destructive={isActive}
            pending={pending}
            onConfirm={() => onConfirm(confirmIRPlayer)}
            onCancel={onCancel}
        >
            {isActive ? (
                <>
                    Are you sure you want to <strong className="text-[var(--app-foreground)]">remove {confirmIRPlayer.viewName}</strong>{" "}
                    from your squad in order to return{" "}
                    <strong className="text-[var(--app-foreground)]">{irPlayer?.viewName || "your IR player"}</strong> back to play?
                </>
            ) : (
                <>
                    <strong className="text-[var(--app-foreground)]">{confirmIRPlayer.viewName}</strong> will be moved to your IR slot.
                </>
            )}
        </ChipConfirmDialog>
    );
}

export default ConfirmIRModal;

import ChipConfirmDialog from "../ChipConfirmDialog";

function ConfirmGameweekChipModal({
    title,
    icon,
    description,
    active,
    pending = false,
    onConfirm,
    onCancel,
}) {
    return (
        <ChipConfirmDialog
            title={title}
            icon={icon}
            notice={`You can ${active ? "cancel" : "activate"} this chip anytime before the Gameweek deadline.`}
            confirmLabel={active ? "Cancel Chip" : "Play Chip"}
            destructive={active}
            pending={pending}
            onConfirm={onConfirm}
            onCancel={onCancel}
        >
            {description}
        </ChipConfirmDialog>
    );
}

export default ConfirmGameweekChipModal;

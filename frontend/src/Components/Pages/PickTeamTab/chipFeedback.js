import { toast } from "sonner";

export function showChipError(error, fallbackMessage) {
    toast.error(error?.message || fallbackMessage);
}

import { createPortal } from "react-dom";

export default function Portal({ children }) {
    const modalRoot = document.getElementById("modal-root") || document.body;
    return createPortal(children, modalRoot);
}

export function lockScroll() {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
}

export function unlockScroll() {
    document.body.style.overflow = "";
    document.body.style.touchAction = "auto";
}

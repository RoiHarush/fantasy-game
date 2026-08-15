const OUTPUT_SIZE = 720;

function loadImage(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image), { once: true });
        image.addEventListener("error", () => reject(new Error("The selected image could not be loaded.")), { once: true });
        image.src = source;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function createCroppedTeamLogo(source, cropPixels, originalName = "team-logo") {
    const image = await loadImage(source);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Image editing is not supported by this browser.");
    }

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
    );

    let blob = await canvasToBlob(canvas, "image/webp", 0.92);
    let extension = "webp";

    if (!blob) {
        blob = await canvasToBlob(canvas, "image/png");
        extension = "png";
    }

    if (!blob) {
        throw new Error("The cropped image could not be created.");
    }

    const baseName = originalName.replace(/\.[^.]+$/, "") || "team-logo";
    return new File([blob], `${baseName}.${extension}`, {
        type: blob.type,
        lastModified: Date.now(),
    });
}
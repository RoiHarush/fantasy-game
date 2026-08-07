"use client";

import Style from "./Styles/HeaderCollage.module.css";

const ALL_IMAGES = Array.from({ length: 13 }, (_, i) => `p${i + 1}.jpeg`);

function HeaderCollage() {
    const displayedImages = ALL_IMAGES.slice(0, 7);

    return (
        <div className={Style.collage}>
            {displayedImages.map((img, index) => (
                <img
                    key={index}
                    src={`/collage_pictures/${img}`}
                    alt={`moment${index + 1}`}
                />
            ))}
        </div>
    );
}

export default HeaderCollage;

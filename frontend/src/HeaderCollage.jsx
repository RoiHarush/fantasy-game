"use client";

import { useEffect, useState } from "react";
import Style from "./Styles/HeaderCollage.module.css";

const ALL_IMAGES = Array.from({ length: 13 }, (_, i) => `p${i + 1}.jpeg`);

function HeaderCollage() {
    const [randomImages, setRandomImages] = useState(ALL_IMAGES.slice(0, 7));

    useEffect(() => {
        const shuffled = [...ALL_IMAGES].sort(() => Math.random() - 0.5);
        setRandomImages(shuffled.slice(0, 7));
    }, []);

    return (
        <div className={Style.collage}>
            {randomImages.map((img, index) => (
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

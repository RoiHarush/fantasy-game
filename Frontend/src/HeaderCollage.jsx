import { useMemo } from "react";
import Style from "./Styles/HeaderCollage.module.css";

function HeaderCollage() {
    const allImages = Array.from({ length: 13 }, (_, i) => `p${i + 1}.jpeg`);

    const randomImages = useMemo(() => {
        const shuffled = [...allImages].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 7);
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

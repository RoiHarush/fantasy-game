import Image from "next/image";

import styles from "./Styles/HeaderCollage.module.css";

const ALL_IMAGES = Array.from({ length: 13 }, (_, i) => `p${i + 1}.jpeg`);

function HeaderCollage() {
    const displayedImages = ALL_IMAGES.slice(0, 7);

    return (
        <div className={styles.collage} aria-hidden="true">
            {displayedImages.map((img, index) => (
                <Image
                    key={img}
                    src={`/collage_pictures/${img}`}
                    alt=""
                    width={400}
                    height={300}
                    sizes="(min-width: 768px) 15vw, 0px"
                    priority={index < 4}
                />
            ))}
        </div>
    );
}

export default HeaderCollage;

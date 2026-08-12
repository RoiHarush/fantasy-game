import Image from "next/image";

const ALL_IMAGES = Array.from({ length: 13 }, (_, i) => `p${i + 1}.jpeg`);

function HeaderCollage() {
    const displayedImages = ALL_IMAGES.slice(0, 7);

    return (
        <div className="hidden h-[300px] w-full grid-cols-7 overflow-hidden md:grid" aria-hidden="true">
            {displayedImages.map((img, index) => (
                <Image
                    key={img}
                    src={`/collage_pictures/${img}`}
                    alt=""
                    width={400}
                    height={300}
                    sizes="(min-width: 768px) 15vw, 0px"
                    priority={index < 4}
                    className="h-full w-full object-cover"
                />
            ))}
        </div>
    );
}

export default HeaderCollage;

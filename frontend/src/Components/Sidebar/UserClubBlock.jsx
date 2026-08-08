import Image from "next/image";
import styles from "../../Styles/UserClubBlock.module.css";

function UserClubBlock({ title = "My Club", logoPath }) {
    return (
        <div className={styles.block}>
            <div className={styles.header}>{title}</div>
            <div className={styles.logoWrapper}>
                <Image
                    src={logoPath || "/UI/icon.png"}
                    alt={`${title} logo`}
                    width={140}
                    height={140}
                    className={styles.logo}
                />
            </div>
        </div>
    );
}

export default UserClubBlock;

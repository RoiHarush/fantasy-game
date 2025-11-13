import styles from "../../Styles/UserClubBlock.module.css";

function UserClubBlock({ title = "My Club", logoPath }) {
    return (
        <div className={styles.block}>
            <div className={styles.header}>{title}</div>
            <div className={styles.logoWrapper}>
                <img src={logoPath} alt="user club logo" className={styles.logo} />
            </div>
        </div>
    );
}

export default UserClubBlock;

import Image from "next/image";

import styles from "../../Styles/Block.module.css";

function ColumnsBlock({ title, children, columns = 1 }) {
    return (
        <div className={styles.block}>
            <div className={styles.blockHeader}>{title}</div>
            <div className={columns === 1 ? styles.blockContent : styles.blockColumns2}>{children}</div>
            <Image src="/UI/pattern-1_small.png" alt="" width={120} height={120} className={styles.blockImage} />
        </div>
    );
}

export default ColumnsBlock;


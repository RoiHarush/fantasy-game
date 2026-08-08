import Image from "next/image";

import styles from "../../Styles/Block.module.css";

function SplitBlock({ items }) {
    return (
        <div className={styles.splitBlock}>
            {items.map((item) => (
                <div key={item.id ?? item.title} className={styles.splitItem}>
                    <div className={styles.splitHeader}>{item.title}</div>
                    <div className={styles.splitContent}>{item.content}</div>
                    <Image src="/UI/pattern-1_small.png" alt="" width={120} height={120} className={styles.blockImage} />
                </div>
            ))}
        </div>
    );
}

export default SplitBlock;


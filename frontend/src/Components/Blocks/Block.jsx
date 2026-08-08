import Image from "next/image";
import Style from "../../Styles/Block.module.css";

function Block({ title, children }) {
    return (
        <div className={Style.block}>
            <div className={Style.blockHeader}>{title}</div>
            <div className={Style.blockContent}>{children}</div>
            <Image src="/UI/pattern-1_small.png" alt="" aria-hidden="true" width={70} height={70} className={Style.blockImage} />
        </div>
    );
}

export default Block

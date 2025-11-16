import Style from "../../Styles/Block.module.css";

function Block({ title, children }) {
    return (
        <div className={Style.block}>
            <div className={Style.blockHeader}>{title}</div>
            <div className={Style.blockContent}>{children}</div>
            <img src="/UI/pattern-1_small.png" alt="decoration" className={Style.blockImage} />
        </div>
    );
}

export default Block
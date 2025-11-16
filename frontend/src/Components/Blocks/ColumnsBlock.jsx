import Style from "../../Styles/Block.module.css";

function ColumnsBlock({ title, children, columns = 1 }) {
    return (
        <div className={Style.block}>
            <div className={Style.blockHeader}>{title}</div>
            <div className={columns === 1 ? Style.blockContent : Style.blockColumns2}>{children}</div>
            <img src="/UI/pattern-1_small.png" alt="decoration" className={Style.blockImage} />
        </div>
    );
}

export default ColumnsBlock;


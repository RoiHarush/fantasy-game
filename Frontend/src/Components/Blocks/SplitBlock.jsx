import Style from "../../Styles/Block.module.css";

function SplitBlock({ items }) {
    return (
        <div className={Style.splitBlock}>
            {items.map((item, idx) => (
                <div key={idx} className={Style.splitItem}>
                    <div className={Style.splitHeader}>{item.title}</div>
                    <div className={Style.splitContent}>{item.content}</div>
                    <img src="/UI/pattern-1_small.png" alt="decoration" className={Style.blockImage} />
                </div>
            ))}
        </div>
    );
}

export default SplitBlock;


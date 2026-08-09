import Style from "../../Styles/Switcher.module.css";

function Switcher({ active, options, onChange, labels = {} }) {
    return (
        <div className={Style.switcherContainer}>
            {options.map((option) => {
                const label = labels[option];
                return (
                    <button
                    type="button"
                    key={option}
                    onClick={() => onChange(option)}
                    aria-pressed={active === option}
                    className={`${Style.switcherButton} ${active === option ? Style.active : ""}`}
                    >
                        {label ? (
                            <>
                                <span className="sm:hidden">{label.mobile}</span>
                                <span className="hidden sm:inline">{label.desktop}</span>
                            </>
                        ) : option}
                    </button>
                );
            })}
        </div>
    );
}

export default Switcher;

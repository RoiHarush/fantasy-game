import Style from "../../Styles/Switcher.module.css";

function Switcher({ active, options, onChange }) {
    return (
        <div className={Style.switcherContainer}>
            {options.map((option) => (
                <button
                    type="button"
                    key={option}
                    onClick={() => onChange(option)}
                    aria-pressed={active === option}
                    className={`${Style.switcherButton} ${active === option ? Style.active : ""}`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

export default Switcher;

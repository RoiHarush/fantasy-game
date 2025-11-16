import Style from "../../Styles/Button.module.css"

function Buttons({ clicked, names, className }) {
    return (
        <div>
            {names.map((name) =>
                <button key={name} onClick={() => clicked(name)} className={`${Style.btn} ${className}`}>{name}</button>
            )}
        </div>
    )
}

export default Buttons
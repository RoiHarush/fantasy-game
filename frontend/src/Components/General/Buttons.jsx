import { Button } from "../../shared/ui/Button";

function Buttons({ clicked, names, className }) {
    return (
        <div>
            {names.map((name) => (
                <Button key={name} onClick={() => clicked(name)} className={className}>
                    {name}
                </Button>
            ))}
        </div>
    );
}

export default Buttons;

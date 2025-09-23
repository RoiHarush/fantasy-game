import PlayersWrapper from "../../General/PlayersWrapper";

function ScoutWrapper({ players, user, setUser }) {
    return (
        <PlayersWrapper
            players={players}
            user={user}
            setUser={setUser}
            mode="scout"
        />
    );
}

export default ScoutWrapper;

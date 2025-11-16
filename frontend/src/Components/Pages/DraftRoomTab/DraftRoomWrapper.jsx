import PlayersWrapper from "../../General/PlayersWrapper";

function DraftRoomWrapper({ players, user, setUser }) {
    return (
        <PlayersWrapper
            user={user}
            setUser={setUser}
            mode="draft"
        />
    );
}

export default DraftRoomWrapper;

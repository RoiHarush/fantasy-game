import { useNavigate } from "react-router-dom";
import Style from "../../../Styles/LeagueTable.module.css";

function TableUser({ user, currentUser }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (user.userId === currentUser.id) {
            navigate("/points");
        } else {
            navigate(`/points/${user.userId}`);
        }
    };

    return (
        <div className={Style.tableUser} onClick={handleClick}>
            <span className={Style.userName}>{user.username}</span>
            <span className={Style.userTeam}>{user.fantasyTeam}</span>
        </div>
    );
}

export default TableUser;

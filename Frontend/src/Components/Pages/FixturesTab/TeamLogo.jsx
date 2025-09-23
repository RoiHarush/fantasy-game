import Style from "../../../Styles/FixturesTable.module.css";

function TeamLogo({ teamId }) {
    return (
        <img
            src={`/Logos/${teamId}_logo.svg`}
            alt={`Team ${teamId} logo`}
            className={Style["team-logo"]}
        />
    )
}

export default TeamLogo
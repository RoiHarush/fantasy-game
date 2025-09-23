import fs from "fs";

async function buildPlayersFile() {
    const url = "https://fantasy.premierleague.com/api/bootstrap-static/";
    const res = await fetch(url);
    const data = await res.json();

    const positions = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

    const players = data.elements
        .filter((p) => p.can_select === true) // ✅ רק שחקנים זמינים
        .map((p) => ({
            id: p.id,
            firstName: p.first_name,
            lastName: p.second_name,
            viewName: p.web_name,
            position: positions[p.element_type],
            team: p.team, // id הרשמי של הקבוצה
            nextMatch: "",
            points: p.total_points,
            isCapttain: false,
            isInjured: false,
            available: true,
            ownerId: null,
        }));

    const output = `const players = ${JSON.stringify(players, null, 4)};\n\nexport default players;`;

    fs.mkdirSync("src/MockData", { recursive: true });
    fs.writeFileSync("src/MockData/Players.js", output, "utf8");

    console.log("✅ Players.js created with", players.length, "players!");
}

buildPlayersFile();


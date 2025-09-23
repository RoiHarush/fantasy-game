import fs from "fs";

async function buildGameWeeksFile() {
    const url = "https://fantasy.premierleague.com/api/bootstrap-static/";
    const res = await fetch(url);
    const data = await res.json();

    const events = data.events;

    const gameWeeks = events.map((gw) => ({
        id: gw.id,
        name: gw.name,
        firstKickoffTime: gw.deadline_time, // בפועל זה זמן תחילת המשחק הראשון
        status: gw.finished
            ? "FINISHED"
            : gw.is_current
                ? "LIVE"
                : "UPCOMING",
    }));

    // מייצרים תוכן לקובץ JSX
    const fileContent = `const Gameweeks = ${JSON.stringify(gameWeeks, null, 2)};\n\nexport default Gameweeks;`;

    // כותבים לקובץ בתוך /src/mockData/Gameweeks.jsx
    fs.writeFileSync("./src/mockData/Gameweeks.jsx", fileContent, "utf-8");

    console.log("✅ src/mockData/Gameweeks.jsx נבנה בהצלחה!");
}

buildGameWeeksFile();

import fs from "fs";

async function buildFixturesFile() {
    const url = "https://fantasy.premierleague.com/api/fixtures/";
    const res = await fetch(url);
    const data = await res.json();

    const fixtures = data.map((f) => ({
        id: f.id,
        event: f.event, // מספר מחזור
        kickoff_time: f.kickoff_time,
        homeTeamId: f.team_h,
        awayTeamId: f.team_a,
        homeScore: f.team_h_score,
        awayScore: f.team_a_score,
        finished: f.finished,
    }));

    const output = `const fixtures = ${JSON.stringify(fixtures, null, 4)};\n\nexport default fixtures;`;

    fs.mkdirSync("src/MockData", { recursive: true });
    fs.writeFileSync("src/MockData/fixtures.js", output, "utf8");

    console.log("✅ fixtures.js created with", fixtures.length, "fixtures!");
}

buildFixturesFile();

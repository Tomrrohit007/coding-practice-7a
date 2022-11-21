const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

intializeDBandServer();
const fromSnakeToCamel = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
    matchId: dbObj.match_id,
    match: dbObj.match,
    playerMatchId: dbObj.player_match_id,
    year: dbObj.year,
    score: dbObj.score,
    fours: dbObj.fours,
    sixes: dbObj.sixes,
  };
};

// GET API 1
app.get("/players/", async (request, response) => {
  const Query = `SELECT * FROM Player_details;`;
  const dbResponse = await db.all(Query);
  response.send(dbResponse.map((each) => fromSnakeToCamel(each)));
});
// GET API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const Query = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(Query);
  response.send(fromSnakeToCamel(dbResponse));
});

// PUT API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updateQuery = `UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
         WHERE 
            player_id = ${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

// GET API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const dbResponse = await db.get(Query);
  response.send(fromSnakeToCamel(dbResponse));
});

// GET API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const Query = `SELECT match_details.match_id, match_details.match, match_details.year FROM (match_details LEFT JOIN player_match_score ON match_details.match_id = player_match_score.match_id) AS T WHERE T.player_id = ${playerId};`;
  const dbResponse = await db.all(Query);
  response.send(dbResponse.map((each) => fromSnakeToCamel(each)));
});

// GET API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const Query = `SELECT player_details.player_id, player_details.player_name FROM (player_details LEFT JOIN player_match_score ON player_details.player_id = player_match_score.player_id) AS T WHERE T.match_id = ${matchId};`;
  const dbResponse = await db.all(Query);
  response.send(dbResponse.map((each) => fromSnakeToCamel(each)));
});

//GET API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const Query = `SELECT player_details.player_id as playerId, player_details.player_name as playerName, SUM(player_match_score.score) as totalScore, SUM(player_match_score.fours)as totalFours, SUM(player_match_score.sixes)as totalSixes FROM (player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id) AS T WHERE T.player_id = ${playerId} GROUP BY T.player_id;`;
  const dbResponse = await db.get(Query);
  response.send(dbResponse);
});

module.exports = app;

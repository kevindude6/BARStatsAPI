import { Prisma, PrismaClient } from "@prisma/client";
import { GetPlayersFromMatches } from "./helper.js";
import express from "express";

const app = express();
const port = 3000;

const prisma = new PrismaClient();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Yay");
});
app.get("/test", async (req, res) => {
  const replay = await prisma.replay.findFirst();
  res.json(replay);
});
app.get("/playerMatches", async (req, res) => {
  const player = await prisma.player.findFirst({ where: { lastKnownName: req.query.playerId } });
  if (player == null) {
    res.status(404).send("Player not found");
    return;
  }
  const matches = await prisma.replay.findMany({
    where: {
      OR: [
        {
          winningPlayers: {
            has: player.id,
          },
        },
        {
          losingPlayers: {
            has: player.id,
          },
        },
      ],
    },
  });
  const playerInfo = await GetPlayersFromMatches(prisma, matches, true);
  const out = {
    matches,
    playerInfo,
    targetPlayer: player,
  };
  res.json(out);
});
app.get("/stats", async (req, res) => {
  const playerId = req.query.playerId;
  if (playerId == null) {
    res.status(500).send("Requires player id");
    return;
  }
  const player = await prisma.player.findFirst({ where: { lastKnownName: playerId } });
  if (player == null) {
    res.status(404).send("Player not found");
    return;
  }
  const matches = await prisma.replay.findMany({
    where: {
      OR: [
        {
          winningPlayers: {
            has: player.id,
          },
        },
        {
          losingPlayers: {
            has: player.id,
          },
        },
      ],
    },
  });

  const outData = {};
  //GetPlayersFromMatches(prisma, matches);
  res.sendStatus(200);
});
app.get("/maps", async (req, res) => {
  const maps = await prisma.map.findMany({ orderBy: { fileName: "asc" } });
  res.json(maps);
});
app.get("/player", async (req, res) => {
  const player = await prisma.player.findFirst({ where: { lastKnownName: req.query.playerName } });
  res.json(player);
});
app.post("/startPositions", async (req, res) => {
  const mapIds = req.body.mapIds;
  const playerId = req.body.playerId;
  const startPositions = await prisma.startPosition.findMany({
    where: {
      playerId: playerId,
      mapId: {
        in: mapIds,
      },
    },
  });
  res.json(startPositions);
});
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

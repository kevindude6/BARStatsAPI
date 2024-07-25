import { Prisma, PrismaClient } from "@prisma/client";
import { GetPlayersFromMatches, DataProcessMatches, GetStartPositionsForPlayer } from "./helper.js";
import express from "express";

const app = express();
const port = 3000;

const prisma = new PrismaClient().$extends({
  result: {
    replay: {
      playerCount: {
        needs: { losingPlayers: true, winningPlayers: true },
        compute(replay) {
          return replay.losingPlayers.length + replay.winningPlayers.length;
        },
      },
    },
  },
});
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
    orderBy: {
      time: "asc",
    },
  });

  // Need to find the player start pos for each match
  const startPositions = await GetStartPositionsForPlayer(prisma, player.id);
  const startMap = {};
  // Build a dictionary for fast lookup
  for (const start of startPositions) {
    startMap[start.replayId] = start;
  }
  // Assign to each match
  for (const match of matches) {
    match.targetPlayerStart = startMap[match.id];
  }

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
app.post("/playerStats", async (req, res) => {
  const playerName = req.body.playerName;
  if (playerName == null) {
    res.status(404).send("Player required!");
    return;
  }
  const startTime = req.body.startTime == null ? new Date("2024-01-01") : new Date(req.body.startTime);
  const endTime = req.body.endTime == null ? new Date() : new Date(req.body.endTime);
  const minPlayers = req.body.minPlayers ?? 2;
  const maxPlayers = req.body.maxPlayers ?? 16;
  const selectedMaps = req.body.maps ?? "all";

  const player = await prisma.player.findFirst({ where: { lastKnownName: playerName } });

  let mapWhere = {};
  if (selectedMaps !== "all") {
    const mapIds = selectedMaps.map((m) => {
      return {
        mapId: m,
      };
    });
    mapWhere = { OR: [...mapIds] };
  }
  const matches = await prisma.replay.findMany({
    where: {
      AND: [
        {
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
        {
          time: { gte: startTime, lte: endTime },
        },
        mapWhere,
      ],
    },
  });

  const filtered = [];
  for (const match of matches) {
    if (match.playerCount >= minPlayers && match.playerCount <= maxPlayers) filtered.push(match);
  }

  DataProcessMatches(player.id, filtered);
  //console.log(filtered);
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
app.get("/allMatches", async (req, res) => {
  const limit = Number(req.query.limit);
  const offset = Number(req.query.offset);
  const replays = await prisma.replay.findMany({
    take: limit,
    skip: offset,
    orderBy: {
      time: "asc",
    },
  });
  res.status(200).json(replays);
});
app.get("/global", async (req, res) => {
  const mostRecent = await prisma.analysisData.findFirst({
    orderBy: {
      calculationTime: "desc",
    },
  });
  res.status(200).json(mostRecent);
});
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

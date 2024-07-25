import { DataFrame } from "danfojs";

export const GetPlayersFromMatches = async (prisma, matches, onlyName) => {
  const playerDict = {};
  let select = {};
  if (onlyName) {
    select = {
      select: {
        id: true,
        lastKnownName: true,
      },
    };
  }
  for (const match of matches) {
    for (const p of match.winningPlayers) {
      if (!(p in playerDict)) {
        playerDict[p] = p;
      }
    }
    for (const p of match.losingPlayers) {
      if (!(p in playerDict)) {
        playerDict[p] = p;
      }
    }
  }
  const players = await prisma.player.findMany({
    where: {
      id: {
        in: Object.values(playerDict),
      },
    },
    ...select,
  });
  return players;
};

export const GetPlayersFromGlobal = async (prisma, global) => {
  const playerDict = {};
  const addSection = (field) => {
    if (global[field]["ACTIVE-PLAYERS"] == null || global[field]["ACTIVE-PLAYERS"].top25 == null) return;
    for (const entry of global[field]["ACTIVE-PLAYERS"].top25) {
      if (!(entry[0] in playerDict)) {
        playerDict[entry[0]] = Number(entry[0]);
      }
    }
  };

  addSection("weekAll");
  addSection("monthAll");
  addSection("totalAll");
  addSection("weekSkilled");
  addSection("monthSkilled");
  addSection("totalSkilled");

  const players = await prisma.player.findMany({
    where: {
      id: {
        in: Object.values(playerDict),
      },
    },
    select: {
      id: true,
      lastKnownName: true,
    },
  });
  return players;
};

export const GetStartPositionsForPlayer = async (prisma, playerId) => {
  const startPositions = await prisma.startPosition.findMany({
    where: {
      playerId: playerId,
    },
  });
  return startPositions;
};

export const DataProcessMatches = (targetPlayerId, matches) => {
  const rows = matches.map((m) => {
    const pObj = m.players[targetPlayerId];
    const pGameId = pObj.gameId;
    return {
      win: pObj.win,
      faction: pObj.faction,
      cow: m.awards.cow.teamId === pGameId,
      sleep: m.awards.sleep.teamId === pGameId,
      econDestroyed: m.awards.econDestroyed[0].teamId === pGameId,
      unitsDestroyed: m.awards.fightingUnitsDestroyed[0].teamId === pGameId,
      damageTaken: m.awards.mostDamageTaken.teamId === pGameId,
      resourcesProduced: m.awards.mostResourcesProduced.teamId === pGameId,
      resourceEfficiency: m.awards.resourceEfficiency[0].teamId === pGameId,
      duration: m.duration,
      time: m.time,
      mapId: m.mapId,
      gameType: m.gameType,
    };
  });
  const dframe = new DataFrame(rows);
  console.log(dframe["win"].sum());
};

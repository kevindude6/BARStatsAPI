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

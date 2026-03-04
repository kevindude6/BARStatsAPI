# StatsAPI

**Role:** Backend API — serves all replay and player statistics to the frontend.

## What It Does
Express.js REST API sitting in front of the PostgreSQL database. Provides endpoints for player match history, statistics, global aggregate data, map lists, game balance tweaks, and fuzzy player name search.

## Tech Stack
- Node.js / JavaScript
- Express.js
- Prisma ORM + PostgreSQL
- `danfojs` — DataFrame-style data manipulation
- `dotenv`

## Entry Point
`index.js` — Express server on port 3000.

## Key Endpoints
| Endpoint | Description |
|---|---|
| `GET /playerMatches?playerId=` | All matches for a player with start positions |
| `POST /stats` | Player statistics |
| `GET /allMatches` | Paginated match list |
| `GET /global` | Global stats and cached analysis data |
| `GET /maps` | All maps |
| `GET /tweaks` | Game tweak definitions and units |
| `GET /namesearch?name=` | Fuzzy player name search |

## Database Schema (Prisma)
- `Player` — profiles with skill ratings (duel, FFA, team, small team)
- `Replay` — match records (players, awards, map, duration, outcome)
- `Map` — map metadata
- `StartPosition` — spawn coordinates per player per game
- `StartBox` — spawn zones per map
- `AnalysisData` — cached global statistics
- `TweakDefs` / `TweakUnits` — game balance change tracking

## Key Relationships
- Reads data written by **ReplayFetcher**
- Consumed by **RemixFrontChakra** (frontend) and **PlayerCardGenerator**

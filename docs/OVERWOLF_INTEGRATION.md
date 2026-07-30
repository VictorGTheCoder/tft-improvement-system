# Overwolf GEP integration scaffold

This branch prepares TFT Improvement System for OW-Electron and the Teamfight Tactics Game Events Provider (GEP).

It does **not** claim that live TFT events have already been validated. The real provider requires an approved and whitelisted Overwolf application. Until then, the mock provider can exercise the complete local capture pipeline.

## Architecture

```text
OW-Electron main process
  -> OverwolfProvider or MockProvider
  -> event normalization and allow-list filtering
  -> isolated capture engine
  -> local JSON file in Electron userData
  -> read-only diagnostics sent to the existing UI through IPC
```

The existing browser version remains unchanged. The Overwolf panel is injected only by the Electron preload script.

## Safety boundaries

The capture allow-list currently accepts only:

- `game_info.is_pbe`;
- local player `health`, `gold`, `xp`, `rank`, and `summoner_name`;
- `match_state`, `round_type`, `game_mode`, and `pseudo_match_id`;
- local `board_pieces`;
- local `bench_pieces`;
- `shop_pieces`;
- local player damage.

The integration intentionally does not request or store:

- augments;
- `match_stats.board_players`;
- opponent board or bench data;
- automated scouting data;
- live recommendations.

## Local mock development

Requirements:

- Windows;
- Node.js 18 or newer.

Install dependencies and run the app with simulated events:

```bash
npm install
npm run start:mock
```

Open the **Overwolf GEP** panel on the Today dashboard and select **Lancer une partie simulée**. The mock scenario creates snapshots for stages `3-2` and `4-1`, records a fourth-place finish, and closes the capture session.

Run tests with:

```bash
npm test
```

## Live development after approval

After Overwolf approves the app idea and enables TFT GEP for the application:

```bash
npm install
npm run start:overwolf-dev
```

The DEV command uses Overwolf's QA package environment. Confirm the environment and assigned app credentials with DevRel before relying on it.

At runtime, the provider:

1. waits for the `gep` package;
2. listens for a Riot game process;
3. calls `event.enable()`;
4. requests `game_info`, `me`, `match_info`, `store`, `board`, and `bench`;
5. rejects non-TFT sessions using `match_info.game_mode`;
6. stores only allow-listed local-player data.

## Data location

Live and mock captures are stored separately from the learning database:

```text
<Electron userData>/overwolf-capture-v1.json
```

This isolation is intentional. Captured sessions must be reviewed and validated before they are mapped into the existing match and decision database.

## Validation required with real games

Before merging captured data into reviews:

- query the supported TFT features with the live package;
- verify the exact payload shapes received by OW-Electron;
- test at least five complete matches;
- test an app launch during an active match;
- test TFT and normal League of Legends separation;
- test game and app privilege mismatches;
- test temporary GEP feature outages;
- verify that placement and match end are received when the player is eliminated;
- confirm that `board_pieces` and `bench_pieces` contain only the local player data expected by the app.

Tracking issue: #3.

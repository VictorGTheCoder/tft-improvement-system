# TFT Improvement System

Open-source, local-first training application for Teamfight Tactics players. It helps players capture decisions, run post-game reviews and convert recurring situations into spaced-repetition drills.

No account or remote server is required. Learning data stays on the user's device unless the user explicitly exports it.

## Browser version

- **Windows**: double-click `start.bat`.
- **macOS/Linux**: run `./start.sh`.
- **Without Python**: open `index.html` in a modern browser.

Default local address: `http://localhost:8765`.

## Training loop

1. Define one measurable skill for the block.
2. Capture an important decision after a match.
3. Send uncertain or costly cases to review.
4. Extract a conditional principle.
5. Create a drill and retest it later.

## Main features

- decision capture, editing and cascade deletion;
- structured context, alternatives, prediction and outcome;
- guided post-game reviews;
- spaced-repetition drills;
- measurable training goals;
- professional-player watchlist;
- decision search;
- JSON backup and CSV export;
- local data integrity diagnostics.

## Experimental Overwolf integration

The branch `agent/prepare-overwolf-gep-integration` adds an OW-Electron shell and prepares passive TFT data capture through the Overwolf Game Events Provider.

The integration includes:

- a real GEP provider that can be enabled after Overwolf approval;
- a mock provider for development without credentials;
- strict allow-list filtering for local-player data;
- isolated session and snapshot storage;
- a diagnostic panel inside the existing dashboard;
- automated tests for normalization and capture behavior.

It does not collect augments or opponent boards and does not provide live gameplay recommendations.

See [`docs/OVERWOLF_INTEGRATION.md`](docs/OVERWOLF_INTEGRATION.md) for setup and validation details.

## Tests

Browser data-engine tests:

```bash
node test-core.js
```

All tests, including the Overwolf capture tests:

```bash
npm install
npm test
```

## Backups

Browser data is stored in `localStorage`. Export a JSON backup regularly and before major application updates.

Overwolf capture diagnostics are stored separately in the Electron user-data directory. Captured events are not automatically inserted into the learning database until their reliability has been validated with real TFT matches.

## Competitive integrity

TFT Improvement System is designed for passive capture and post-game learning. It must not tell a player when to roll, level, buy, sell, pivot or reposition during a live match. It must not automate scouting or collect opponent board data.

## Riot Games disclaimer

TFT Improvement System isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

# TFT Improvement System

Open-source, local-first training application for Teamfight Tactics players. It helps players capture decisions, run post-game reviews and convert recurring situations into spaced-repetition drills.

No account or remote server is required. Learning data stays on the user's device unless the user explicitly exports it.

## Public product website

The repository includes a complete static website for Riot and Overwolf review:

- product presentation and user flow;
- working browser prototype;
- interactive simulated Overwolf capture;
- reviewer dossier;
- Privacy Policy;
- Terms of Service;
- competitive-integrity statement;
- support and deletion instructions.

The GitHub Pages workflow assembles the website from `site/` and publishes the browser prototype under `/app/`.

Expected public URL after Pages is enabled:

`https://victorgthecoder.github.io/tft-improvement-system/`

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

## Riot Production application

Overwolf Developer Relations requires Riot approval before whitelisting the TFT integration. The complete copy-ready Riot application dossier is in:

[`docs/RIOT_PRODUCTION_SUBMISSION.md`](docs/RIOT_PRODUCTION_SUBMISSION.md)

It includes:

- a description under 1,500 characters;
- a detailed product description;
- reviewer instructions;
- data handling and monetization answers;
- current Riot API and RSO status;
- competitive-integrity safeguards;
- domain verification instructions for `riot.txt`;
- the evidence to preserve for Overwolf.

The final reply template for Overwolf is in [`docs/OVERWOLF_RIOT_APPROVAL_REPLY.md`](docs/OVERWOLF_RIOT_APPROVAL_REPLY.md).

## Tests

Browser data-engine tests:

```bash
node test-core.js
```

All tests, including Overwolf capture and public-site validation:

```bash
npm install
npm test
```

Site-only validation:

```bash
npm run test:site
```

## Backups

Browser data is stored in `localStorage`. Export a JSON backup regularly and before major application updates.

Overwolf capture diagnostics are stored separately in the Electron user-data directory. Captured events are not automatically inserted into the learning database until their reliability has been validated with real TFT matches.

## Security and support

- Security reporting: [`SECURITY.md`](SECURITY.md)
- Public support: GitHub Issues
- License: MIT

Do not publish Riot credentials, API keys, Overwolf credentials, authentication tokens or unredacted private payloads in an issue.

## Competitive integrity

TFT Improvement System is designed for passive capture and post-game learning. It must not tell a player when to roll, level, buy, sell, pivot or reposition during a live match. It must not automate scouting or collect opponent board data.

## Riot Games disclaimer

TFT Improvement System isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

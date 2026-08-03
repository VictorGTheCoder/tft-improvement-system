# Riot Games Production application dossier

This document contains the copy-ready material for registering **TFT Improvement System** in the Riot Developer Portal, as requested by Overwolf Developer Relations.

## Submit only when these URLs are live

Expected GitHub Pages URLs after deployment:

- Product website: `https://victorgthecoder.github.io/tft-improvement-system/`
- Working browser prototype: `https://victorgthecoder.github.io/tft-improvement-system/app/`
- Simulated Overwolf flow: `https://victorgthecoder.github.io/tft-improvement-system/demo.html`
- Privacy Policy: `https://victorgthecoder.github.io/tft-improvement-system/privacy.html`
- Terms of Service: `https://victorgthecoder.github.io/tft-improvement-system/terms.html`
- Competitive integrity: `https://victorgthecoder.github.io/tft-improvement-system/compliance.html`
- Support: `https://victorgthecoder.github.io/tft-improvement-system/support.html`
- Source repository: `https://github.com/VictorGTheCoder/tft-improvement-system`

## Application type

Select **Production**.

Overwolf explicitly requested the Production application type. The application is intended for public distribution, not personal-only use.

## Product name

`TFT Improvement System`

## Game

`Teamfight Tactics`

## Product website

`https://victorgthecoder.github.io/tft-improvement-system/`

## Short product description

The text below is 1,388 characters and can be used where a description field has a 1,500-character limit.

> TFT Improvement System is a public, local-first training application for Teamfight Tactics players. It helps users improve over time through a decision journal, guided post-game reviews, measurable training objectives and spaced-repetition drills.
>
> The current browser prototype is fully testable without an account. A planned OW-Electron integration will passively collect supported data belonging to the local player, such as match and round transitions, stage, health, gold, level, experience, local board and bench, and final placement. Captured data will be stored locally and used only to prefill post-game context.
>
> The application will not provide dynamic recommendations during active gameplay, dictate when to roll, level, buy, sell, pivot or reposition, automate scouting, track opponents, collect opponent boards or benches, or use prohibited augment or Legend performance data.
>
> The product is intended for public distribution through the Overwolf ecosystem. Core training features will remain free. Planned monetization is limited to non-intrusive Overwolf-supported advertising outside active gameplay, with a possible optional ad-free subscription. The current prototype does not use the Riot API or Riot Sign On; this Production registration is requested because the product serves TFT players and Overwolf requires Riot approval before whitelisting the game integration.

## Detailed product description

Use this version when the form allows a longer explanation.

> TFT Improvement System is a public, local-first training and post-game review application for Teamfight Tactics players.
>
> The product focuses on long-term skill improvement rather than live composition recommendations. Players define a measurable training objective, capture an uncertain or costly decision, compare the information available at the time with the alternatives considered, complete a post-game review, extract a conditional learning principle and convert important situations into spaced-repetition drills.
>
> A functional browser prototype already supports training objectives, a decision journal, guided reviews, drills, a watchlist, local search, JSON backup, CSV export and data-integrity diagnostics. It can be tested publicly without an account.
>
> The planned OW-Electron integration uses the Overwolf Game Events Provider to passively collect supported information belonging only to the local player. The initial scope includes match and round transitions, stage, local health, gold, XP, level, placement, local board and bench, items, shop and combat results when supported. Captured information is stored locally in a separate file and is used only to prefill factual context for post-game review.
>
> The application does not provide dynamic recommendations during active gameplay. It does not tell a player when to roll, level, buy, sell, pivot or reposition. It does not automate scouting, track opponent actions, collect opponent boards or benches, display prohibited augment or Legend performance data, or attempt to bypass a player skill test.
>
> The product is intended for public distribution through the Overwolf ecosystem. Core training features will remain free. Planned monetization uses only non-intrusive Overwolf-supported advertising on desktop or post-game screens, with a possible optional ad-free subscription. No advertising is displayed during active gameplay.
>
> The current version does not call official Riot APIs and does not use Riot Sign On. This Production registration is requested because the product serves TFT players and Overwolf requires Riot approval before whitelisting the TFT integration. Any future use of Riot API data, Riot Sign On, remote storage or materially different features will be submitted as an update before release.

## Player benefit

> The application helps players improve in a measurable way by preserving the context of their own decisions, reducing hindsight bias, identifying recurring mistakes and retesting learned principles outside a live match. It does not solve the current game state for the player.

## Intended audience

> Teamfight Tactics players who want to improve through structured practice and post-game analysis, from regular ranked players to competitive players. The initial public release targets Windows users because the planned integration uses Overwolf.

## Current development status

> A functional browser prototype is publicly testable. The OW-Electron shell, mock provider, event normalizer, local capture engine, diagnostic panel and automated tests are implemented. Live Overwolf GEP validation is pending Overwolf whitelisting, which requires Riot approval first.

## User flow

> 1. The player opens the desktop application and selects one measurable training objective.
> 2. During a match, the planned Overwolf integration passively records allow-listed local-player context without displaying live recommendations.
> 3. After the match ends, the application offers a review prefilled with factual local context.
> 4. The player identifies the decision, alternatives, prediction, action and outcome.
> 5. The player extracts a conditional principle and may create a spaced-repetition drill.
> 6. Future sessions surface due drills and recurring decision patterns.

## Reviewer test instructions

> No account or installation is required for the public review flow.
>
> 1. Open the product website.
> 2. Select “Open the working prototype.”
> 3. Create a training objective on the Today screen.
> 4. Add a decision and mark it for review.
> 5. Complete the review and create a drill.
> 6. Return to the product website and open the simulated capture flow.
> 7. Start the synthetic match to inspect accepted local-player fields, important-stage snapshots, rejected prohibited fields and the post-game review transition.
> 8. Review the public Privacy Policy, Terms of Service and Competitive Integrity statement.

## Riot API usage

> The current product does not call the Riot Games API. It is being registered because it serves TFT players and integrates with TFT through Overwolf. No Riot API key is embedded in the source code or distributed client.

If the form requires an API selection, request only the minimum **Standard APIs** category and explain in the notes that no endpoint is currently used. Do not request Tournament API access.

## Riot Sign On

> Riot Sign On is not currently used or requested. The product does not retrieve official account or match-history data from Riot and does not require a Riot account login. Local-player context is captured on the user's device through the planned Overwolf integration. If official account data or Riot API match history is added later, the product will request the appropriate RSO approval before release.

## Data handling

> The product is local-first. Browser training records are stored in browser local storage. Experimental desktop capture is stored in a separate local JSON file. No central player database is currently operated. The public website has no intentional analytics scripts, tracking pixels or advertising. Users can export or delete their local data. Opponent boards, opponent benches, automated scouting data and prohibited augment data are excluded by design.

## Monetization

> Core training features will remain free. The planned Overwolf release will integrate non-intrusive Overwolf-supported advertising only on desktop or post-game screens, never during active gameplay. A possible optional Overwolf-supported subscription may remove advertising or add advanced historical reporting. No third-party advertising or payment system is planned for the initial release.

## Distribution

> Public distribution through the Overwolf App Store after Riot approval, Overwolf whitelisting, live-event validation and Overwolf QA. Source code is publicly available under the MIT License.

## Regions

> Global, subject to Overwolf availability and applicable Riot policies. The initial interface may be English and French.

## Competitive-integrity statement

> The application provides no dynamic live recommendations and does not dictate player decisions. It does not automate scouting, track opponent actions, collect opponent boards or benches, use prohibited augment or Legend performance data, automate inputs or bypass a short-term information-tracking skill test. Its live component is passive; analysis and learning actions occur after the match or outside active gameplay.

## Riot disclaimer

> TFT Improvement System isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## Domain verification after submission

Riot generates a unique verification string only after the Production application is submitted.

1. Copy the exact string from the Riot Developer Portal.
2. Create a root repository file named `riot.txt` containing only that string, with no spaces or extra lines.
3. Merge or push the change to the branch deployed by GitHub Pages.
4. Confirm that this URL displays only the token:
   `https://victorgthecoder.github.io/tft-improvement-system/riot.txt`
5. Enter the site URL in the Riot verification interface.
6. After verification succeeds, remove the public token if Riot's instructions permit it.

The Pages workflow automatically copies a root `riot.txt` file into the deployed site when it exists.

## Evidence to preserve for Overwolf

After Riot approves the product, capture one or more screenshots showing:

- the product name;
- the Riot application status as approved or acknowledged;
- the complete description submitted to Riot;
- the verified website/domain;
- any Riot message confirming the permitted use case.

Send those screenshots to the existing Overwolf DevRel email thread. Overwolf explicitly requested both the approval and the submitted app description.

## Final pre-submission checklist

- [ ] GitHub Pages deployment succeeded.
- [ ] Product website loads over HTTPS.
- [ ] Browser prototype loads from `/app/`.
- [ ] Simulated capture completes successfully.
- [ ] Privacy Policy is publicly accessible.
- [ ] Terms of Service are publicly accessible.
- [ ] Support page is publicly accessible.
- [ ] Competitive-integrity statement is publicly accessible.
- [ ] Riot disclaimer is visible.
- [ ] Repository is public and contains no secrets.
- [ ] Production application type is selected.
- [ ] Product description matches the deployed product.
- [ ] `riot.txt` is added only after Riot generates the verification string.
- [ ] Screenshots of the submitted description are saved for Overwolf.

Tracking issue: #5.

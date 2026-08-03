# Security Policy

## Supported versions

Only the latest commit on the active development branch and the latest published release are supported.

## Reporting a vulnerability

Do not publish credentials, tokens, personal data, unredacted Overwolf payloads or exploit details in a public GitHub issue.

If GitHub private vulnerability reporting is enabled for this repository, use it. Otherwise, open a minimal public issue titled `Security contact request` containing only:

- the affected component;
- a high-level impact description;
- a request for a private contact channel.

Do not include reproduction steps until a private channel is available.

## Priority

The following are treated as release-blocking:

- exposure of Riot, Overwolf or other credentials;
- remote code execution;
- unintended transmission of local player data;
- collection of opponent data outside the documented allow-list;
- storage of prohibited or unredacted event payloads;
- a feature that creates an unfair live gameplay advantage.

## Scope

The current prototype is local-first. GitHub Pages hosts only static product and legal pages plus a browser prototype. No server-side API or central player database is operated by the project.

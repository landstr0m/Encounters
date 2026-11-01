# Encounters

Encounters is a lightweight browser-based Dungeons & Dragons encounter tracker for running combat at the table. It helps you manage initiative order, monster and player stats, hit points, conditions, and encounter flow without requiring a server or a build step.

The app is a static web app: open it in a browser, add monsters or party members, and keep play data saved in the browser using local storage.

## Features

- Initiative tracking with round and turn flow
- Add monsters from the built-in SRD-compatible database
- Add custom party members and reusable saved characters
- Group monsters together for shared initiative and bulk management
- Track AC, HP, temp HP, conditions, and death saves
- Apply damage, healing, and temporary HP in bulk
- Remove, revive, and edit combatants directly from the tracker
- Show/hide condition and status details from player-facing table view
- Export and import encounter data as JSON
- Open a separate read-only table window for a second screen
- Import custom monster JSON files to extend or override the built-in library
- Offline-friendly service worker cache and installable PWA support

## Project structure

- `index.html` — main app UI, logic, and combat management
- `statuses.js` — condition and status definitions for the tracker UI
- `monsters.json` — built-in monster stat block data
- `manifest.webmanifest` — installable web app metadata
- `sw.js` — service worker for offline caching
- `fonts.css` — custom fonts used by the interface
- `icon-180.png` and `icon-512.png` — app icons
- `README.md` — project documentation

## How to run

Because this is a static web app, you can run it in either of these ways:

1. Open `index.html` directly in a browser, or
2. Serve the folder with a local static web server, for example:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## How to use

1. Open the app and choose Add to add monsters or party members.
2. Set initiative values for each creature or use a grouped roll for monster packs.
3. Start combat to advance turns round by round.
4. Use the action pad to apply damage, healing, temp HP, or conditions.
5. Use the drawer to inspect stat blocks, manage saved characters, or export/import encounter data.
6. Open the table view for a clean read-only display on a second monitor or shared screen.

## Recent app improvements

The tracker now includes a few quality-of-life features added throughout recent updates:

- monster grouping and bulk selection controls
- save/restore data handling for encounter state
- visibility options for effects and table-view info
- more flexible status handling and condition descriptions
- support for adding custom monster files as local libraries
- better control over player and monster management in the main encounter list

## Notes

- App data is stored in the browser using `localStorage`.
- The app is designed for desktop and mobile browser use during live gameplay.
- The bundled monster database and status rules are stored locally so the app can work without a server-side API.
- Custom monster files are kept on the current device and are merged with the built-in SRD data.

## License and data source

This project includes monster data and rules references based on the SRD 5.2 material, with the game data embedded in the app for offline use.

## Repository status

This project is a single-page app focused on fast, in-session D&D encounter management for a DM or GM running the table. It is intentionally lightweight, runs without a build step, and is designed to stay easy to open and use during play.

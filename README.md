# Encounters

Encounters is a lightweight browser-based Dungeons & Dragons encounter tracker built for running combat at the table. It helps you manage initiative order, monster and player stats, hit points, conditions, death saves, and turn flow without needing a separate app or backend.

The project is a static web app: open it in a browser, add monsters or party members, and it runs entirely on the client side with local browser storage for persistence.

## Features

- Initiative tracking with round and turn flow
- Add monsters from a built-in SRD-compatible monster database
- Add custom player characters and reused party members
- Track AC, HP, temp HP, status conditions, and death saves
- Apply damage, healing, and temporary hit points in bulk
- View monster stat blocks and abilities
- Export and import encounter data as JSON
- Optional table view for a read-only display on a second screen
- Offline-friendly service worker cache for quick reloads

## Project structure

- `index.html` — main application UI and logic
- `monsters.json` — monster stat block data used by the tracker
- `manifest.webmanifest` — PWA manifest for installability
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
2. Set initiative values for each creature.
3. Start combat to advance turns round by round.
4. Use the action panel to apply damage, healing, status effects, or death saves.
5. Use the drawer to inspect monster stat blocks or save/export the encounter.

## Notes

- App data is stored in the browser using `localStorage`.
- The app is designed for desktop or mobile browser use during gameplay.
- The bundled monster database is stored locally so the app can work without a server-side API.

## License and data source

This project includes monster data and rules references based on the SRD 5.2 material, with the game data embedded in the app for offline use.

## Suggested improvements

Possible future enhancements include:

- search/filter improvements for monsters and effects
- encounter templates and saved encounters
- DM/player split with permission settings
- editable monster notes and custom stat blocks
- mobile-first polish and accessibility refinements

## Repository status

This project is a single-page app focused on fast, in-session D&D encounter management for a DM or GM running the table. It is intentionally lightweight and does not require a build step or external backend.

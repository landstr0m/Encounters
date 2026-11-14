# Design decisions, and why

Written 14 Nov 2026 after a code review. Each point says what was chosen, why, and what the alternative costs. "Open" points need Andrew's decision.

## Changed in the review

**1. Several files, not one.** The app was one 320 KB `index.html`. It is now a page shell, `app.css`, and twelve scripts in `js/`.
- *Why:* a change to one feature now touches one small file, so the GitHub diff shows only that feature; finding code means opening the right file, not searching 3,000 lines; an AI session reads one file, not everything (fewer tokens).
- *What it costs:* files load in a fixed order (`PARTS` in `js/boot.js`) and each new file must be listed for offline use (`FILES` in `sw.js`).
- *Not done on purpose:* no build step, bundler or framework. They pay off with a team or thousands of users; here they would add things to install and break.

**2. One statement per line (Prettier).** The code was packed into lines of up to 2,000 characters.
- *Why:* Git compares line by line. With packed lines a one-word change shows as one huge changed line and cannot be reviewed; now it shows as one short line. A formatter also ends all style decisions: run `npx prettier --write .` and the layout is always the same.
- *What it costs:* files are about 30% larger on disk. Nothing at run time.

**3. Tests run on every push.** `.github/workflows/tests.yml` runs the browser tests, the data check and the format check.
- *Why:* a check that depends on someone remembering is skipped on the day it matters. A red cross on the commit is hard to miss.

**4. Tests no longer rewrite the app.** They used to edit `index.html` on the fly to reach inside. They now use a hook the test browser adds, so what is tested is exactly what is published.

**5. Honest start-up messages.** Any failure used to say "Could not load monsters.json". There are now three messages (data missing, a script missing, a bug while starting), so a problem at the table can be reported accurately.

## Open: needs a decision

**A. A push to `main` is live at once.** GitHub Pages publishes `main` directly, so a bad push reaches the iPad even if the tests fail.
- *Better:* let the Tests workflow publish the site only after the tests pass (Settings → Pages → Source: GitHub Actions). Needs a repository setting only Andrew can change.

**B. Everything is stored in the browser's `localStorage`.** Simple and offline, but limited to about 5 MB, tied to one browser on one device, and iOS may clear it for a site that is not on the Home Screen and unused for a week.
- *Today's answer:* Export before and after each session. *Later:* IndexedDB for the monster files (no size worry), and the planned cloud backup.

**C. The Discord webhook address is inside the backup file.** Anyone with that address can post to the channel, so do not share a backup file. *Later:* leave it out of the export unless ticked.

## Kept on purpose

- **Global state and HTML built from strings.** Frameworks (React, Vue) solve problems of large teams and very dynamic pages. Here a render function per area is easy to read and has no dependencies. The discipline it needs: every piece of outside text goes through `esc()` (names from Kanka, D&D Beyond and player links are outside text).
- **Monsters and rules 2024-first, with a switch for 2014 characters.** The difference between editions that the tracker can see is small (spell versions, half-caster slots), so a switch on the character is enough; a second full rule set would double the data to check.
- **One-step undo, one saved state, no accounts.** Each could be richer; each would also add ways to lose data mid-session.
- **Open data in the repository, your own data on your device.** The built-in monsters and spells are SRD content under CC-BY. Anything else is a file you add in the app; it is stored on the device and in your backups and never uploaded. The repository can stay public without a second thought, and each person brings their own material.
- **Data files with a tool that rebuilds them** (`tools/`), so nothing is edited by hand twice.

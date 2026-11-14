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

**6. A security policy on the page (14 Nov, before table test 2).** `index.html` now tells the browser which scripts may run and which hosts the page may talk to (Content-Security-Policy).
- *Why:* the app shows text from places it does not control (your files, Kanka, D&D Beyond, backups) and holds secrets (Discord webhook, Google API key). Escaping that text is the first lock; if one escape is ever missed, the policy is the second: the hidden script does not run, and it could not send anything to a host that is not listed.
- *Agreed by Andrew, 14 Nov.* What it costs: "Your files by link" used to accept any `https://` link. It now accepts Dropbox, Google Drive, GitHub raw / Gist and Supabase Storage only, and says so for any other host. Allowing every host would have left the "cannot send data elsewhere" half of the policy empty. A new host is two short edits (`connect-src` in `index.html`, `LINKHOSTS` in `js/boot.js`).
- *Listed ahead of use (Andrew's request, 14 Nov):* D&D Beyond, Kanka, Open5e, D&D 5e API, Dungeon Master's Vault, so a later in-app import needs no policy change. Cost: each listed host is one more place a missed escape could send data to (it would need the attacker's own account there, as with Discord). Small, and removable.
- *Limits:* inline `style="…"` is still allowed (the app uses it for bar widths and spacing; styles cannot run code). GitHub Pages cannot send the policy as a header, so it is a tag in the page: enough for this, but `frame-ancestors` (who may embed the page) is not available that way.

**7. Timed effects end by removing themselves.** An effect with "Rounds it lasts" is removed one round after its last turn, at its own initiative.
- *Why there:* its "1 round (until it acts again)" statuses end at that same moment, so nothing is left behind. Undo brings it back.
- *Open choice:* "Starts in round" is the round number shown in the top bar, not "N rounds from now". A waiting effect is hidden from players even if its name is set to visible (no spoilers). Say if either should be the other way.

## Decided 14 Nov 2026 (were open)

**A. The site is published only after the tests pass.** GitHub Pages used to publish `main` directly, so a bad push reached the iPad even with failing tests. The Tests workflow now has a `publish` step that runs only when every test passed; a failing change leaves the last good version online.
- *Needs once:* Settings → Pages → Source: **GitHub Actions** (only Andrew can change it).
- *What it costs:* a change is live about 3 minutes after the push (tests first), not after 1. The Kanka and D&D Beyond updates publish through the same workflow.

**B. Stay with `localStorage` until the size is a problem.** Simple and offline, but limited to about 5 MB, tied to one browser on one device, and iOS may clear it for a site that is not on the Home Screen and unused for a week.
- *Today:* Export before and after each session; "Loaded now" (Data → Sources) shows storage used; a failed save shows a warning.
- *When to move (see ROADMAP, Stage 3):* storage used passes about 3.5 MB, a save fails, or local monster images arrive.

**C. The Discord webhook link is not in the backup file.** Anyone with that link can post to the channel, and it takes a minute to paste again on a new device. Export leaves it out; Import never takes one from a file (older backups still contain it) and keeps the device's own.
- *Still in the backup, on purpose for now:* the Google API key and file links of linked files (when *your files* are ticked). The key only works for the Drive API from this website if restricted as the README says; say if these should be left out too.

## Kept on purpose

- **Global state and HTML built from strings.** Frameworks (React, Vue) solve problems of large teams and very dynamic pages. Here a render function per area is easy to read and has no dependencies. The discipline it needs: every piece of outside text goes through `esc()` (names from Kanka, D&D Beyond and player links are outside text).
- **Monsters and rules 2024-first, with a switch for 2014 characters.** The difference between editions that the tracker can see is small (spell versions, half-caster slots), so a switch on the character is enough; a second full rule set would double the data to check.
- **One-step undo, one saved state, no accounts.** Each could be richer; each would also add ways to lose data mid-session.
- **Open data in the repository, your own data on your device.** The built-in monsters and spells are SRD content under CC-BY. Anything else is a file you add in the app; it is stored on the device and in your backups and never uploaded. The repository can stay public without a second thought, and each person brings their own material.
- **Data files with a tool that rebuilds them** (`tools/`), so nothing is edited by hand twice.

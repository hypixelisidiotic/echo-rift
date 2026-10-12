# ECHO//RIFT: REQUIEM — Community Mod API v1.0

This release preserves the current game while adding an optional standalone mod API.

## What is in this package?

- `echo_rift_requiem.html` — latest game; now loads the independent `echo_rift_mod_api.js` file.
- `echo_rift_mod_api.js` — mod manager, browser storage, sandboxed JavaScript execution and API interface.
- `echo_rift_modding_guide.md` — all supported mod hooks, commands and examples.
- `example_requiem_mod.js` — test mod; adds the Neon Hunter variant and AQUA DRIVE upgrade.
- `website_loader/index.html` — updated GitHub loader for your Linode /game/ URL.

## Your specific hosting setup

Your server serves a Next.js homepage through Apache's reverse proxy and static game files under `/var/www/html/game/`. The Apache `/game` exclusion is already working. **Don't change Apache again.**

The existing loader downloaded only `echo_rift_requiem.html`. It must be upgraded ONCE to also download `echo_rift_mod_api.js`. The updated loader is already configured for:

- GitHub user: `hypixelisidiotic`
- GitHub repo: `echo-rift`
- Branch: `main`
- Public URL: `http://172.236.61.79/game/`

### Step 1 — GitHub (every game/API update)

Commit these files at the ROOT of your public `echo-rift` repository:

```text
echo_rift_requiem.html
echo_rift_mod_api.js
echo_rift_modding_guide.md
example_requiem_mod.js
```

The first two files are **required**; the documentation/example files are optional in the repository because the game's Mods panel can also download them.

### Step 2 — VPS (ONE TIME)

Back up the existing site loader:

```bash
cp /var/www/html/game/index.html "$HOME/requiem-before-mod-api-loader.html"
```

Upload `website_loader/index.html` from this release to:

```text
/var/www/html/game/index.html
```

Use FileZilla, SCP, or any file-copy method you prefer. **Do not upload the new game HTML as `index.html` on the VPS.** The VPS `index.html` is the loader; the game HTML and API should live in GitHub.

### Step 3 — Confirm

Open:

```text
http://172.236.61.79/game/?mods=1
```

The bottom-right corner of the REQUIEM main menu should show `◈ MODS`. Click it to install/enable a `.js` file, download the full documentation or download the example mod.

If the loader displays `TRANSMISSION INTERRUPTED`, verify both `echo_rift_requiem.html` and `echo_rift_mod_api.js` exist in the correct repo branch and load without a GitHub 404. Clear browser cache or use Ctrl+Shift+R after replacing `index.html` on the VPS.

### After the one-time VPS change

For future changes to either REQUIEM or the Mod API, push the appropriate file(s) to GitHub. The website's loader will fetch the latest files on page load. You do not need FileZilla for each game update. The loader runs the API as a script blob because GitHub's raw file endpoint does not reliably serve scripts with an executable JavaScript MIME type.

## Mod user experience

1. Click `◈ MODS` on the **main menu**.
2. Click `INSTALL .JS MODS` and select one or more `.js` files.
3. Click `ENABLE` next to a mod (importing is separate from enabling).
4. Start a run. Events and gameplay commands become active.
5. Click `DISABLE` or `REMOVE` to turn off a mod, from the main menu.

Browser storage retains installed mod files between visits. **For safety, they do not auto-execute on reload.** Enable the ones you want each session. Currently up to 8 mods, at most 240 KB each. Saving may be limited by browser storage restrictions or privacy mode.

Mods run in sandboxed iframes, not in the game page. This stops normal direct DOM/cookie/save access, but it cannot guarantee a malicious mod won't consume CPU or perform other disruptive behaviour. Mods are opt-in per user. Only install ones you trust.

## Compatibility and known limitations

- API v1 supports events, snapshots, visual/projectile effects, basic commands, custom enemy variants that reuse built-in AI, and declarative custom upgrade cards.
- New fully scripted enemy AI, custom sprite assets, new bosses, and arbitrary game-engine overrides are not yet supported. They would require new, reviewed API hooks.
- The existing game works if the separate API script fails to load, but the Mods panel will not appear. The **GitHub loader intentionally shows an error if a required API file is missing** so broken deployments do not look silently successful.
- Existing Wordle save data, the B key, admin shortcut, boss encounters and combat balance were left intact.
- Mod-added score is not guaranteed fair for leaderboard purposes.

## Test results in Chromium

- Main menu and mod panel (desktop and narrow/mobile viewport).
- Import two separate JS files, enable, disable, and restore installed files (disabled by default) from browser storage.
- State snapshot request, `run:start` event, spawn custom enemy, award score and change combat stats.
- Custom upgrade card rendering and effect application. Malicious HTML-style card names/descriptions did not execute code in the main page.
- Documentation download, Wordle B shortcut, GitHub-loader mock fetching both separate files.
- All four Warden phase checks and death transitions with the API present; no JavaScript page errors.

This release was not installed on your actual Linode; you must upload/push the described files.

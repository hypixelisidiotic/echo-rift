# ECHO//RIFT: REQUIEM — Community Modding API v2.0

## Quick start

**You already have the Apache `/game/` site working. Do not change Apache.**

Your working Linode GitHub loader already fetches **two separate files** from the root of the public `hypixelisidiotic/echo-rift` repository on `main`. Simply commit these two updated files together:

1. `echo_rift_requiem.html` — core gameplay, plus the v2 game-side hooks.
2. `echo_rift_mod_api.js` — separate sandbox, mod manager, UI, campaign and scripted-actor API.

The following additional files are optional on GitHub, but recommended for your modders:

3. `echo_rift_modding_guide.md` — complete v2 reference (also downloadable from MODS).
4. `example_requiem_mod.js` — the Eclipse Expedition reference mod (also downloadable from MODS).

Then visit **http://172.236.61.79/game/**, hard-refresh if necessary, open **MODS**, and import `example_requiem_mod.js`. Click **ENABLE**, close the MODS manager, then choose **✦ ECLIPSE EXPEDITION** on the main menu.

**If and only if your site still uses the old single-HTML GitHub loader** (no mod support), replace `/var/www/html/game/index.html` once with `website_loader/index.html` from this ZIP. Back up your existing loader first. That replacement is *not* necessary if v1 modding was already working on your website.

## What's actually new

- Mods register launch buttons directly in the main menu and receive `menu:click` events.
- Mods display arbitrary HTML/CSS/JS interfaces in their own opaque-origin sandbox frames. The game's UI and browser storage remain isolated.
- Mods define alternate **multi-act campaigns** with up to 48 named rooms, independent encounter schedules and a modded victory screen.
- Mods define **scripted actors**, including custom-boss-labelled enemies, with entirely custom movement and attacks. The engine still handles movement interpolation, projectiles, HP, hit detection and contact damage.
- Mods listen to `simulation:tick` and command movement/projectiles on their own actors; can react to keyboard inputs, create new abilities, add telegraphed hazards, render additional world graphics, boost stats, heal and teleport.
- Version 1 events, enemy variants, upgrade cards and existing mods are retained.

**Limits:** This is a permissive *extension interface*, not unlimited direct access to the host engine. Native collision geometry changes, custom engine shaders, additional downloadable assets, multiplayer backends, arbitrary rewrites of the four built-in acts, and arbitrary parent-page JavaScript injection are not supported. v2 is experimental; read the modding guide for exact permissions, limits and examples.

## Security and usage

Mods are installed and enabled manually by each visitor. Saved installed mods remain disabled after a refresh. Mod JavaScript runs inside `<iframe sandbox="allow-scripts">` with an opaque origin and restrictive CSP. Even with this isolation, mods can be disruptive or consume CPU: only install code you trust. Command validation and flood caps are applied, but no sandbox can guarantee protection against every browser vulnerability.

**Update process:** For future REQUIEM patches, commit the game HTML and/or separate API JS to GitHub; the compatible GitHub loader retrieves both on reload. You do not need to reopen FileZilla every time. Never upload the game directly over `/var/www/html/game/index.html` when that file is your GitHub loader.

## Browser verification performed

- Installed and enabled the new example mod using the MODS UI.
- Registered three original actor types, a new two-act campaign and a custom main-menu button.
- Opened and closed a custom iframe UI repeatedly without restarting the mod sandbox.
- Spawned and steered scripted actors, and exercised the custom Eclipse Crown boss label/bar.
- Tested the new Q-key Corona Pulse and restored keyboard focus after closing the UI.
- Advanced through four custom rooms and reached the custom expedition victory screen.
- Started a vanilla run after the custom expedition and verified normal campaign state.
- Ran all four original Warden phase/death transitions successfully.
- Exercised v1 mods, save/reload disabled state, docs download, Wordle, and the two-file GitHub loader.
- Checked the sample mod UI at desktop and narrow mobile viewport sizes.

These were automated Chromium checks, **not complete manual balance playtests** of the community campaign. The live Linode deployment has not been modified directly.

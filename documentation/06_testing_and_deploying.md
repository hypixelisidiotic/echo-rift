# 06 · Testing and deployment

REQUIEM developer manual · API 3.1 · generated against the supplied game build. Internal game functions are not stable public API.

## Test matrix

- Import, enable, disable, re-enable and uninstall each standard mod.
- Close/reopen a custom screen while a mod script is active.
- Launch a modded campaign, clear each room, lose a run, and win a run.
- Test high enemy counts and every health-triggered actor phase.
- Confirm modded HUD/buttons don't obscure the main menu on narrow phones.
- For Full Engine Mode, test initial launch, altered mechanics, keyboard focus, boss death and exit from the lab.
- Keep a clean run with **no mods** as a regression control.

## Distribution

The production website loader currently fetches **`echo_rift_requiem.html` and `echo_rift_mod_api.js`** from the GitHub repository. Keep those two files paired at compatible versions. The guide, examples and multi-file manual may also be published in the repository for modders; they are not necessary for engine startup.

### Security note

Opaque-origin iframe sandboxing makes the cloned instance separate from the original page, but *does not make arbitrary code safe*. Untrusted mods can still consume resources, make requests allowed by the browser policy, or exploit browser bugs. Don't represent the sandbox as a guarantee of safety.

### Compatibility

Use a semver-like version declaration for community mods, state the game build tested against, and avoid undocumented internals unless Full Engine Mode is explicitly required. Source-level patching is powerful but needs maintenance when game implementation changes.

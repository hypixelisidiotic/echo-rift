# Start here

REQUIEM developer manual · API 3.1 · generated against the supplied game build. Internal game functions are not stable public API.

**Two ways to build:** Use `RequiemMod` for a versioned plugin with independent persistence, input, UI and scripted actors; use **Full Engine Mode** for direct arbitrary engine patching. Full Engine Mode does not require API command registrations and has access to the cloned game state and code at runtime. Neither pathway guarantees compatibility across changes to internal engine names.

## Read in this order

1. `01_architecture.md` for the system map and loading pipeline.
2. `02_standard_api.md` for the full public method overview and examples.
3. `03_engine_patch_guide.md` to rewrite REQUIEM mechanics directly.
4. `04_vanilla_recipes.md` to reproduce attacks, actors, boss fights and menu features.
5. `05_function_index.md` for indexed internal function entry points and source lines.
6. `06_testing_and_deploying.md` for testing, publication and limits of isolation.

The game HTML, mod API and working example mods are included beside this manual in the release ZIP. Source lines refer to that version.

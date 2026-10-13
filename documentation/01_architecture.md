# 01 · Engine architecture

REQUIEM developer manual · API 3.1 · generated against the supplied game build. Internal game functions are not stable public API.

## Runtime and rendering

REQUIEM is a browser canvas game. The primary engine lives in the inline `<script>` in `echo_rift_requiem.html`, enclosed in an immediately invoked function expression (IIFE). Its functions share lexical access to game state, such as the player, enemy collections, bullets, hazards, menus, boss state, input maps, and rendering context. The mod system is a separate `echo_rift_mod_api.js` loaded by the game.

### Vanilla frame

1. Input listeners record held keys and pointer state.
2. A requestAnimationFrame loop advances simulation time.
3. Player physics, enemies, projectiles and hazards update.
4. Collision/damage rules resolve.
5. Room/act transitions and upgrade choices are triggered.
6. Drawing composites the arena, objects, warnings, bosses and HUD.

Names and callsites are catalogued in `05_function_index.md`. The full implementation is authoritative; do not assume a short conceptual explanation captures all special-case conditions.

### Mod isolation

**Standard mods** execute in their own `iframe` with `sandbox=allow-scripts`, a separate document and an opaque origin. Commands are sent through validated `postMessage` traffic and processed by the host's command handlers. Custom mod UI renders in the mod's frame. The host decides whether a command is valid.

**Full Engine Mode** clones the current HTML, strips the external mod manager, injects a selected patch before the closing engine IIFE, and launches the result in a separate sandboxed frame. Its `eval` executes in the cloned engine scope, so you can call or replace engine functions, read game variables and edit the cloned page. It is not restricted to the public `RequiemMod` command list. It is still a copy of the engine, not a modification to the already-running parent tab.

### Where features live

- **Main HTML**: CSS, menus, camera/canvas, controls, simulation, enemy AI, bosses, arena damage, upgrades, death sequences, generated audio and persistence.
- **Mod API file**: installation UI, mod storage bridge, normal API validation, custom actors and campaigns, full-engine instance launcher.
- **GitHub loader**: deployment entry point on Apache; fetches both files and renders the game. If you add more hard dependencies, update the loader accordingly.

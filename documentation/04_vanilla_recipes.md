# 04 · Recreating vanilla mechanics

REQUIEM developer manual · API 3.1 · generated against the supplied game build. Internal game functions are not stable public API.

These recipes identify the engine entry points to read and patch. Exact timings and visual geometry are specified by the source implementation; version-dependent values should be copied from that code when truly identical behaviour is required.

## Custom enemy

**Standard mod:** `defineActor`, layered `sprite.parts`, `simulation:tick`, `steerActor`, `fire`, `actor.set`, `actor.damage`, `actor.remove`. The host handles collision and damage.

**Full engine:** read the implementations of `spawnEnemy`, the enemy update routines, collision resolution, enemy and boss drawing. Replace or extend them and implement new properties, AI state machines and hitboxes.

## Vanilla boss attacks

**Standard mod:** use `defineActor({boss:true})`, `simulation:tick` and health-threshold branching. Combine `fire`, `hazard`, `ring` and `draw` to create aimed volleys, radial spreads, beams and traps.

**Full engine:** use the internal `custodianAttack`, `mirrorAttack`, `silenceAttack` and Null Choir attack functions as the reference. Override them, replace firing helpers or add independent scheduled attacks. The main boss rendering functions can also be replaced; do not confuse their visuals with projectile/hazard logic.

## Custom arena or geometry

**Standard mod:** transient `draw` primitives and `hazard` telegraphs, optionally coupled to custom timed scripts; alternate campaigns define room sequences.

**Full engine:** modify the arena bounds, canvas drawing and collision routines; create a different movement and physics engine if needed.

## New movement ability

**Standard mod:** listen for `input:press`, snapshot player location, call `player.impulse`, `teleport`, `player.shield` and particle effects. Implement cooldowns in local JS.

**Full engine:** patch the actual player physics and key handlers, including dash/resonance and cooldown rules. Use direct player fields where appropriate.

## Upgrade/card system

**Standard mod:** `defineUpgrade` with validated effects integrates into vanilla upgrade drafts.

**Full engine:** inspect the upgrade catalogue, draft selection, effects application and HUD text routines; add completely new categories/effect pipelines.

## UI, menus, progress

**Standard mod:** `menu.addButton` + `ui.open` creates a launch point and independent sandbox-owned DOM. Per-mod storage holds JSON settings.

**Full engine:** arbitrary UI via `document.createElement` in the cloned page; replace menu flow and campaign transitions directly. Progress in Full Engine Mode is transient by default.

## Sounds

**Standard mod:** `audio.tone` provides generated effects.

**Full engine:** inspect the engine's SFX function family and instantiate your own Web Audio graph. Browser autoplay/audio gesture restrictions still apply.

## Porting a modified source build to a patch

1. Diff the modified REQUIEM HTML against vanilla.
2. Identify modified function bodies and data tables.
3. For each changed function, write a reassignment or wrapper in the patch.
4. For changes to startup constants or hardwired callsites, apply an equivalent runtime transformation or implement a replacement subsystem.
5. Move custom DOM/CSS and assets into the patch where possible.
6. Run the patch in Full Engine Mode, compare attacks frame-by-frame, then test all transitions and difficulty levels.

This is not an automatic transpiler. Source-level changes made before initialisation sometimes require modifying the base game/loader or changing the cloning/injection architecture.

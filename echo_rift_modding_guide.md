# ECHO//RIFT: REQUIEM — Modding API

**Mod API version:** 1.0 (experimental)  
**Format:** a standalone `.js` file  
**Load:** main menu → **MODS** → **INSTALL .JS** → **ENABLE**  
**No external packages or build tools required.**

## Before you start

Mods are optional and never run automatically when the page loads. Installed source is stored locally in your browser; enable it again after refreshing. Save files, Wordle progress and the unmodified campaign all remain usable without mods. Remove or disable mods from the manager if a run behaves unexpectedly.

**Security model:** Mod code executes in a hidden, sandboxed iframe with a unique opaque origin. It cannot directly read the host game's DOM, cookies, localStorage, or internal game variables. It sees only the information provided in API events and state snapshots, and can issue only supported commands. The sandbox is not a guarantee against malicious scripts: malicious mods can consume CPU, and external messaging or network behaviour may differ between browsers. Only install files from people you trust. A mod that misbehaves can be disabled, but save changes it made to gameplay results are not automatically undone. Keep a copy of your game and source.

All APIs described below are available through the **`RequiemMod`** global *inside your mod file*. They are **not** attached to the game page's `window` and you cannot access the game engine's private variables directly.

## 1. Your first mod

Save the following as `first_mod.js`:

```js
RequiemMod.register({
  id: 'ham.first-mod',
  name: 'First Mod',
  version: '1.0.0',
  description: 'A small starter mod.'
});

RequiemMod.on('run:start', () => {
  RequiemMod.toast('FIRST MOD IS ACTIVE!', 3);
});

RequiemMod.on('enemy:kill', (enemy) => {
  // One extra point per enemy destroyed.
  RequiemMod.addScore(1);
});
```

Open REQUIEM's main menu. Click **MODS** in the bottom-right corner, import `first_mod.js`, click **ENABLE**, and start a run. The mod's name and status appear in the panel.

## 2. Lifecycle and events

| Event | When it fires | Event payload |
| --- | --- | --- |
| `mod:enabled` | This mod has started | `{}` |
| `run:start` | A new normal run begins | `{cycle, difficulty}` |
| `room:start` | An encounter starts or resumes | `{cycle, act, bossRoom}` |
| `room:clear` | Advance from a completed encounter | `{cycle, act}` |
| `enemy:spawn` | A hostile appears | `{id, type, baseType, x, y, hp}` |
| `enemy:kill` | A hostile is destroyed | `{id, type, baseType, x, y, value}` |
| `player:damage` | The player takes a successful hit | `{damage, health, maxHealth}` |
| `player:shoot` | Player fires a volley | `{x, y, angle}` |
| `upgrade:chosen` | An upgrade is installed | `{id, name}` |
| `boss:start` | A Warden fight begins | `{act, hp, maxHp}` |
| `boss:phase` | A Warden changes phase | `{act, phase, healthFraction}` |
| `boss:defeated` | A Warden is defeated | `{act}` |
| `run:end` | The run ends | `{won, score, cycle}` |
| `tick` | At most five times per second during combat | `{dt, elapsed, cycle}` |

Note: after selecting an upgrade, some encounters resume without a new `room:start` event. For room progression use `room:start`; for new run state use `run:start`.

Subscribe with:

```js
function onKill(enemy) { RequiemMod.toast('Destroyed ' + enemy.type, 1); }
RequiemMod.on('enemy:kill', onKill);
RequiemMod.once('boss:start', (boss) => RequiemMod.toast('WARDEN!', 2));
RequiemMod.off('enemy:kill', onKill);
```

Only JSON-compatible data is delivered; do not expect game objects, functions or mutable references. Event handlers should finish quickly to keep gameplay responsive.

## 3. Reading the game

`RequiemMod.getState()` returns a Promise with a read-only snapshot:

```js
RequiemMod.getState().then((s) => {
  // s.state: 'menu', 'playing', 'paused', etc.
  // s.cycle, s.act, s.difficulty, s.score, s.kills
  // s.width, s.height (game-world units)
  // s.player: {x, y, hp, maxHp, damage, speed, fireRate, res}
  // s.boss: null or {act, x, y, hp, maxHp, phase}
  // s.enemies: array of {id, type, baseType, x, y, hp, maxHp}
  console.log(s);
});
```

Snapshots describe the game when the request is handled, not necessarily the exact frame where you requested them. If you need periodic information, use `tick` with `getState()` sparingly.

## 4. Supported gameplay actions

Commands are **asynchronous fire-and-forget**, applied in the game loop when received. They are rate-limited and validated; excessive or invalid commands may be ignored.

```js
RequiemMod.toast('NEW SIGNAL', 2.5);         // short HUD notification
RequiemMod.addScore(100);                    // add nonnegative score
RequiemMod.heal(8);                          // heal up to max health
RequiemMod.spawnEnemy('charger');            // spawns at a safe arena edge
RequiemMod.spawnEnemy('wisp', {x:250, y:100}); // optional approximate position
RequiemMod.ring({x:250,y:200,color:'#ff77aa',radius:12,end:90,life:.45});
RequiemMod.fire({team:'hostile',x:200,y:100,angle:1.2,speed:230,count:3,spread:.2});
RequiemMod.fire({team:'player',x:200,y:100,angle:1.2,speed:640,damage:5});
RequiemMod.damageNearby({x:250,y:200,radius:110,damage:15});
RequiemMod.slowNearby({x:250,y:200,radius:140,seconds:2});
RequiemMod.boost({damage:1.1,speed:1.08,fireRate:0.95});
```

`boost` multipliers apply to current player stats: `damage > 1` increases damage, `speed > 1` increases movement speed, and `fireRate < 1` makes firing faster. These multipliers are deliberately clamped to prevent invalid physics. Player bonuses reset on a new run; reapply them on `run:start` if needed.

The `fire` command creates ordinary game projectiles using the supplied position (with bounded damage, count, speed, and radius); no bypass of invulnerability or collision rules is provided. `spawnEnemy` is limited to active gameplay and a total active hostile cap. Enemy types available by default: `wisp`, `shooter`, `charger`, `bulwark`, `splitter`, `sniper`, `weaver`, `spinner`, `corsair`, `obelisk`, `interceptor`, `needle`, `prism`, `vesper`.

## 5. Defining a custom enemy variant

You can register a unique enemy with different stats and sprite colour while reusing an existing built-in AI and underlying procedural hull. It can spawn explicitly or join normal room spawn pools. **Fully bespoke AI scripts, new shaders, sprite image imports and custom boss replacements are not supported in API v1.**

```js
RequiemMod.register({id:'ham.neon-hunter',name:'Neon Hunter',version:'1.0'});

RequiemMod.defineEnemy({
  id: 'hunter',                // ID local to THIS mod
  base: 'charger',            // built-in movement / attack AI
  name: 'Neon Hunter',
  color: '#8bffea',           // procedural hull tint
  hpScale: 1.35,             // 0.25..5
  speedScale: 1.20,          // 0.25..3
  radiusScale: 1.05,         // 0.6..1.8
  spawnChance: 0.07         // 0..0.25 chance in ordinary rooms
});

RequiemMod.on('run:start', () => {
  RequiemMod.toast('Neon Hunters have arrived', 3);
});

RequiemMod.on('enemy:kill', (e) => {
  if (e.type.endsWith(':hunter')) RequiemMod.addScore(15);
});
```

Call `RequiemMod.spawnEnemy('hunter')` to spawn your custom type. The public event `type` is namespaced as `<installed-mod-id>:hunter`, while `baseType` remains `charger`. Spawn pools still respect normal enemy population limits. In the Hostile Index, kills count towards the underlying built-in enemy rather than creating new codex records.

The game does not synchronize game scores, installed mods or metadata to a server. A modded score is not proof of unmodified play.

## 6. Adding custom upgrade cards

Mods can add upgrade cards directly into the ordinary Acts I–III draft pool. You supply metadata and bounded effects; the core game renders the card and applies the effects. Custom cards are deliberately omitted from the inherited-legacy upgrade pool for now, and do not appear during Act IV severance.

```js
RequiemMod.defineUpgrade({
  id: 'neon-accelerator',            // unique within this mod
  name: 'NEON ACCELERATOR',
  symbol: '✧',
  description: '+12% movement speed and +8% projectile damage.',
  tag: 'KINETIC',                   // BALLISTICS | KINETIC | CIRCUIT | TEMPORAL
  rarity: 'RARE',                   // COMMON | RARE | PROTOTYPE
  max: 2,                          // maximum ranks (1 to 3)
  effects: {
    damage: 1.08,                  // multiplier 0.7..1.5
    speed: 1.12,                   // multiplier 0.7..1.5
    fireRate: 1,                   // multiplier 0.7..1.5 (lower is faster)
    heal: 0                        // hull restored on pick (0 to 40)
  }
});

RequiemMod.on('upgrade:chosen', u => {
  // Community upgrade IDs are namespaced with an installation-specific ID.
  if (u.name === 'NEON ACCELERATOR') RequiemMod.toast('ACCELERATOR ENGAGED', 2);
});
```

Each card is only a single upgrade selection: effects are applied once per rank when chosen and automatically reset when a new pilot begins. Card names, symbols and descriptions are sanitized before being rendered. Because this is a sandboxed, declarative interface, cards cannot provide arbitrary synchronous `apply()` functions; for extra behaviour, listen to the existing `upgrade:chosen` event.

## 7. Example: a new difficulty mutator

```js
RequiemMod.register({
  id:'example.double-trouble', name:'Double Trouble', version:'1.0.0',
  description:'Every sixth normal kill spawns a charger.'
});
let normalKills = 0;
RequiemMod.on('run:start', () => { normalKills = 0; });
RequiemMod.on('enemy:kill', (e) => {
  if (e.baseType === 'charger') return;
  if (++normalKills % 6 === 0) {
    RequiemMod.spawnEnemy('charger', {x:e.x, y:e.y});
    RequiemMod.ring({x:e.x,y:e.y,color:'#ff7788',radius:10,end:85,life:.5});
  }
});
```

## 8. Common pitfalls

- **Nothing happens:** Importing a file does not mean it has been enabled; check the mod manager for its status. Mods enabled while on the main menu will receive future run events.
- **The mod shows an error:** Open browser developer tools. The mod manager shows script/load errors when the sandbox reports them.
- **Your mod references `window.player` or `document.getElementById('game')`:** The sandbox intentionally isolates that; use `getState()` and supported actions instead.
- **Your API commands do nothing on the main menu:** Gameplay commands work only during an active run; metadata registration is allowed before entering gameplay.
- **You refreshed and the mod is disabled:** Intentional. Saved mods require explicit enablement per page load.
- **Update the API version:** Use `RequiemMod.version` to check the supported major release. v1 does not promise undocumented internals will be stable.
- **Running with a GitHub loader:** Publish `echo_rift_requiem.html` AND `echo_rift_mod_api.js` at the repository root, and update the website's `index.html` GitHub loader to the compatible version once. The loader fetches both files. Local/offline builds require the files side by side. If the API file is absent, the main game should still run, but no mods button appears.

## 9. Source-file convention

```text
echo-rift/
├── echo_rift_requiem.html       # game and engine bridge
├── echo_rift_mod_api.js         # independent mod loader + sandbox + UI
├── echo_rift_modding_guide.md   # this document
└── example_requiem_mod.js       # optional reference mod
```

Install the GitHub-compatible loader on your Apache server at `/var/www/html/game/index.html` **only once**. It downloads the game and its API module from your public GitHub `main` branch with cache-busting. GitHub itself remains the source of truth for later patches.

## 10. Boundaries and compatibility

The API exists so modders can extend REQUIEM without changing its core source. It isn't a way to secretly install background scripts on other visitors: every player must import and explicitly enable mods in their own browser. A file selected on one machine doesn't automatically appear on another.

This is **v1.0**. The stable contract is the events, snapshots and commands described above. Other names in the game's source are private implementation details and may change. Contact the game maintainer when a new hook is needed.

# ECHO//RIFT: REQUIEM — Community Mod API 3.1

**Format:** plain `.js` file · **Entry:** main menu → MODS → INSTALL → ENABLE  
**Required host files:** `echo_rift_requiem.html` + `echo_rift_mod_api.js`  
**Full playable reference:** `example_requiem_mod.js` (two new acts with custom AI and a mod-owned menu)

## What changed in 2.0

Mods can now create their own **main-menu buttons**, open **fully custom HTML/CSS/JavaScript screens**, add **independent multi-act campaigns**, create **entirely script-driven enemies**, and implement **new mechanics** with sandbox-driven simulation ticks, steering, projectiles, hazards, teleportation and custom drawing. The original 4-act game is not replaced or rewritten; custom campaigns are selectable alternate runs.

This is a foundation for genuinely custom experiences, not unlimited access to the host engine. Entirely new physics/collision models, native audio streams, multiplayer servers, arbitrary custom shaders and unbounded access to the DOM/engine are *not* provided. No stable third-party API can promise literally any feature without exposing the whole host process. APIs here are intentionally separated and may be expanded in future releases.


## API 3.1 — Full Engine Mode (advanced, unrestricted *inside an isolated game*)

**This is the answer to wanting to rewrite REQUIEM rather than merely use hooks.** On the main menu, open **MODS → FULL ENGINE MODE → IMPORT .JS PATCH → LAUNCH MODDED GAME**. The lab loads a completely fresh, temporary copy of the REQUIEM engine in a browser iframe with `sandbox="allow-scripts"` (no `allow-same-origin`). Your patch is evaluated **directly inside the game engine's IIFE scope**, after the engine has initialized. This allows full control over its existing functions, variables, internal arrays, player and enemy rules, rendering functions, and cloned game DOM. You do not need to use `RequiemMod` for lab patches.

A lab patch can reassign functions, change constants *where mutable*, extend enemy AI, directly use the canvas and UI, replace boss patterns and make original game modes. It has roughly the same creative latitude as directly editing the source *at runtime*, without rewriting or distributing the original HTML. It is not a code-rewriting compiler: `const` bindings cannot be reassigned, and code executed before patch injection cannot be retroactively changed. For deeper replacements, intercept later calls, modify mutable tables/objects, or build your own runtime systems.

Example patch (`example_engine_lab_patch.js`):

```js
// These names are in the game's lexical engine scope, NOT on the website.
const vanillaSilence = silenceAttack;
silenceAttack = function (boss) {
  vanillaSilence(boss);  // preserve existing attacks
  // You can add entirely new patterns here using game functions, or
  // replace the function body and draw or fire anything you want.
};
// Alter cloned REQUIEM's DOM; the real host menu is unaffected.
const tag = document.createElement('div');
tag.textContent = 'CUSTOM ENGINE PATCH ACTIVE';
tag.style.cssText = 'position:fixed;left:15px;top:12px;color:#8fffe9;z-index:99';
document.body.append(tag);
```

**Security boundary:** the lab frame has a unique opaque origin. It cannot read the original site's localStorage, cookies, DOM, or the live REQUIEM game state. It cannot navigate the top-level page, submit forms, or open popups. The frame permits external HTTPS scripts, images, media, fonts, styles and fetches so mods can use asset pipelines and external services (subject to CORS). Inline JavaScript, dynamic compilation, blob workers and CSS are permitted within the isolated copy. Frame embedding and form submission remain blocked; the mod still cannot read or modify website-origin storage or DOM. Requests to third-party services can reveal the player’s IP address and request metadata. Browser sandbox/CSP defence is not a guarantee against exploits or CPU/memory exhaustion. Only run mods from people you trust; arbitrary code can intentionally break or freeze the *lab instance*. The lab does not have a save bridge to the main website and does not retain progress after you close it. The regular Mod API runs separately and continues to use its controlled postMessage bridge.

**Performance:** launching a lab runs a second complete game and temporarily uses extra memory/CPU. Close the lab to destroy its iframe. **Compatibility:** lab patches targeting specific engine internals may need changes when REQUIEM updates. Mods distributed for the public API are more version-stable.

### Why an isolated origin remains

The public website does not need accounts or a server database to have browser-local information. REQUIEM records progress and imported mods in browser storage, and a same-origin unrestricted script could access those values and make network requests. Full Engine Mode deliberately keeps the script in its own origin while giving it the entire *cloned* game engine. **This is not a content limitation**: mods can rewrite mechanics, replace menus, draw to canvas, use libraries, load external assets, and implement alternate games. The only excluded authority is control over the actual host page or its stored information.

## API 3.0 — New creative systems

**The previous API (custom HTML menus, multi-act expeditions, custom AI, custom sprite layers, scripted abilities) remains available.** Version 3.0 adds five new interfaces rather than granting mods unsafe access to the host's internal objects.

### Per-mod storage (persistent, namespaced)

```js
const setting = await RequiemMod.storage.get('my-setting'); // JSON value or null
const saved = await RequiemMod.storage.set('my-setting', { enabled: true, level: 4 }); // boolean
const keys = await RequiemMod.storage.keys(); // string[]
await RequiemMod.storage.remove('my-setting'); // boolean
```

Storage is namespaced to the *installed mod*, not to the mod's displayed name. Data persists across reloads and disable/enable; uninstall deletes that installation's data. Per mod: 64 keys maximum, keys of 1–64 ASCII alphanumeric/underscore/dot/colon/hyphen characters, each JSON value up to 8 KB serialized, 32 KB total serialized. Storage is subject to the browser's own localStorage limits. Calls return Promises. Unlike the iframe's own opaque-origin storage, the host stores JSON for the mod and does not expose other mods' keys.

### Custom in-game HUD readouts

```js
RequiemMod.hud.set('charges', {label:'MY ABILITY', value:'3 / 3', color:'#94e8ff'});
RequiemMod.hud.set('charges', {label:'MY ABILITY', value:'2 / 3', color:'#ffbb88'});
RequiemMod.hud.remove('charges');
```

HUD content is plain text, never HTML. Readouts are removed automatically on disable. Total across all mods: 24 readouts. Avoid updating unchanged values every simulation tick.

### Procedural sounds

```js
RequiemMod.audio.tone({frequency:660,endFrequency:330,duration:.2,volume:.05,wave:'triangle'});
```

Oscillator options: `frequency` 80–1800 Hz; `endFrequency` 70–1900 Hz; `duration` .025–.75 seconds; `volume` 0–.15; `wave`: sine, triangle, square, sawtooth. Sounds respect the game's audio settings and browser audio-unlock requirements. They are routed through the game's limiter; this is not file-based audio playback.

### Actor runtime control (only actors belonging to your own mod)

```js
RequiemMod.actor.set(actor.id, {x:400, y:220, speed:200, hp:35, color:'#eeaaff'});
RequiemMod.actor.damage(actor.id, 10);
RequiemMod.actor.remove(actor.id);
```

Only the calling mod's scripted actors can be changed; native enemies, Wardens, and another mod's actors are protected. Positions are clamped inside the playable arena. Speed 0–700; health 1–max health. `remove` removes a scripted actor directly and does not award a normal kill.

### New player mechanics

```js
RequiemMod.player.impulse(80,-25); // move player by bounded displacement
RequiemMod.player.shield(.6); // temporary invulnerability, up to 2s per call
```

Player displacement is clamped to screen bounds (±180 game units per axis, per call). Invulnerability uses the normal player hit system. Mods are rate-limited to 250 commands per second so these abilities should manage their own cooldowns. For production mods, clearly communicate what the ability does and avoid interfering with the player's normal input without warning.

### Transient polygon drawing

```js
RequiemMod.draw({kind:'polygon',x:300,y:200,sides:6,radius:45,angle:Math.PI/6,color:'#bbffaa',fill:false,life:.4,width:3});
```

Like circle, line, rectangle and text effects, polygon drawing is time-limited and validated by the host; this does *not* give direct access to the game's canvas context.

### What remains outside the public API

The API does **not** grant host DOM access, unrestricted main-engine JavaScript execution, arbitrary external fetches, custom native shaders, a new physics engine, server-side multiplayer, or arbitrary asset ingestion. These would require dedicated interfaces and security reviews. Sandboxing protects the website against many cross-origin abuses but does not make untrusted JavaScript completely harmless (e.g. CPU-intensive loops). Test mods and only enable code you trust.

## Minimal mod

```js
RequiemMod.register({id:'ham.my-mod', name:'My Mod',version:'2.0.0'});
RequiemMod.on('run:start',()=>RequiemMod.toast('Mod loaded!',2));
```

Installation is per visitor, via `.js` import. Installed mod code persists in localStorage on that browser; mods begin **disabled** after each refresh. The user has to opt in before code runs. Previous v1 mods using the existing `RequiemMod` calls still work.

## 1. Custom main-menu buttons

```js
RequiemMod.menu.addButton({id:'start',label:'★ MY CAMPAIGN',description:'NEW ACTS · ORIGINAL ENEMIES'});
RequiemMod.on('menu:click',({id})=>{
  if(id==='start')RequiemMod.ui.open({title:'MY CAMPAIGN'});
});
// Optionally:
RequiemMod.menu.removeButton('start');
```

You may register multiple buttons (global cap 24) and remove them. Each button is owned by its mod and automatically disappears when that mod is disabled. `menu:click` events carry `{id}`. Buttons only act on the main menu.

## 2. Completely custom mod screens

**A mod's own DOM is available inside its sandbox iframe.** You can use `document`, `document.createElement`, normal CSS, DOM listeners and JavaScript to build arbitrary menus and interactive interfaces **within that isolated frame**. You are not editing the host game's DOM.

```js
const css=document.createElement('style');
css.textContent='body{background:#091422;color:#aaf5ff;font-family:system-ui}button{padding:14px}';
document.head.appendChild(css);
const play=document.createElement('button');
play.textContent='START MY ACT';
play.addEventListener('click',()=>RequiemMod.playCampaign('my-act'));
document.body.appendChild(play);

RequiemMod.ui.open({title:'MY SCREEN'}); // only opens from main menu when enabled
RequiemMod.ui.close();
RequiemMod.on('ui:open',()=>console.log('Screen displayed'));
RequiemMod.on('ui:close',()=>console.log('Screen hidden'));
```

When a mod screen is open, pressing **Escape** or **× CLOSE** closes it; clicking outside also closes it. The mod sandbox remains alive, so its state persists. The screen is *not* an unrestricted iframe: external network, host DOM, storage, popups and top-level navigation are blocked/restricted by sandbox/CSP. You can create as much native DOM/CSS as the iframe allows.

**Important:** Do not try to use `window.parent.document`. The host is intentionally inaccessible. The visual viewport for a mod screen is the canvas-sized box inside the popup, and a mod owns only its iframe's content.

## 3. Register your own scripted actor type

```js
RequiemMod.defineActor({
  id:'hunter',name:'Amber Hunter',
  hp:90, speed:170, radius:19, color:'#ffce8a', sides:7, score:220, boss:false
});
```

Set `boss:true` on a scripted actor to display a full boss health bar during its encounter (the sample Eclipse Crown uses this). Boss actors still participate in the ordinary collision/death system, so the mod defines their phases and attacks.

Actors are **true game enemies** for collision, targeting, projectile damage, HP, death, scoring and victory conditions, but they do **not** inherit the built-in enemy movement or attack logic. The mod decides what they do. Actors support custom layered sprite artwork (up to 24 validated shapes), or fall back to glowing polygons (3–12 sides). Supported limits: HP 5–2,000, speed 0–700, radius 8–75, score 0–5,000, 36 distinct actor definitions globally.

Spawn one using:

```js
RequiemMod.spawnActor('hunter');
RequiemMod.spawnActor('hunter',{x:500,y:120});
```

In your campaign's `spawns` arrays, use just `'hunter'` as the type (same for ordinary built-in types such as `'charger'`). Your actor IDs are automatically namespaced per installed mod to avoid collisions. Actors cannot be spawned in menus or while paused.


### Custom layered actor artwork (API 2.1)

Scripted actors **no longer have to look like glowing polygons**. Add a `sprite` descriptor to `defineActor`. All coordinates and dimensions are relative to the actor's `radius`, with origin at its centre. Parts draw in array order (back to front). Shapes are validated data, not executable canvas functions.

```js
RequiemMod.defineActor({
 id:'manta',name:'Violet Manta',hp:95,speed:190,radius:24,color:'#a788ff',
 sprite:{rotation:'face-player',parts:[
  {kind:'polygon',sides:3,x:-.5,y:0,radius:.95,angle:-1.57,color:'#7858e9'},
  {kind:'polygon',sides:3,x:.5,y:0,radius:.95,angle:1.57,color:'#7858e9'},
  {kind:'polygon',sides:6,radius:.58,color:'#171832',lineWidth:2.5},
  {kind:'circle',radius:.24,color:'#e7beff',stroke:false},
  {kind:'circle',radius:1.1,color:'#a788ff',fill:false,opacity:.55,spin:1.7}
 ]}
});
```

Shapes: `polygon` (`sides` 3–16, `radius`), `circle` (`radius`), `rect` (`w`,`h`), and `line` (`x`,`y`,`x2`,`y2`). All parts support `x`, `y`, `angle` (radians), `spin` (radians/second), `color` (six-digit hex), `opacity`, `lineWidth`, `fill` and `stroke`. `rotation` is `static`, `spin` (set a top-level `spin` speed), `face-player`, or `face-motion`. A sprite has up to 24 parts. These designs are drawn by the existing game canvas engine with collision radius unchanged. Without `sprite`, the original simple polygon remains as a fallback.

**Important:** This is extensive *declarative vector artwork*, not unrestricted execution in the host renderer. Mods can already draw temporary battlefield effects with `RequiemMod.draw`. External bitmap files, textures, custom shaders, and per-frame Canvas callbacks are not supported; allowing arbitrary scripts inside the host would defeat the mod security boundary.

## 4. Script novel movement and attacks

`simulation:tick` fires approximately **10 times per second** during active gameplay. It carries:

```js
{
 dt:0.1, time:12.7, roomTime:3.6,
 player:{x,y,hp,maxHp},
 actors:[{id,type,x,y,hp,maxHp,vx,vy}, ...],
 campaign:null | {id,room}
}
```

Only script-controlled actors are in `actors`, not built-in enemies. `id` is the unique active actor instance ID, while `type` ends with your actor type's local name. For accurate steering, use normalized components with `RequiemMod.steerActor(id,vx,vy)`; magnitude is clamped. Only the mod that created an actor type can steer that actor. The engine interpolates movement at its normal tick rate and applies collision/damage normally.

```js
const nextShot=new Map();
RequiemMod.on('simulation:tick',tick=>{
  if(!tick.player)return;
  for(const actor of tick.actors){
    if(!actor.type.endsWith(':hunter'))continue;
    const dx=tick.player.x-actor.x,dy=tick.player.y-actor.y;
    const len=Math.hypot(dx,dy)||1;
    // Invent any scriptable AI rule, based on the player, health, time, etc.
    RequiemMod.steerActor(actor.id,dx/len,dy/len);
    if(tick.time>=(nextShot.get(actor.id)||0)){
      RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),speed:245,count:3});
      nextShot.set(actor.id,tick.time+2);
    }
  }
});
RequiemMod.on('actor:death',({id,type,x,y})=>nextShot.delete(id));
```

Actor movement is applied asynchronously by `postMessage`; rapid reactions may have up to one simulation tick of latency. Collision and movement continue in the main game loop. Mod commands are capped at **250/s per mod**; expensive AI should work with tens of actors, not thousands. The shared enemy population limit is 125, and the `simulation:tick` snapshot reports up to 50 scripted actors.

## 5. Full new campaigns and acts

Declare as many as 12 acts with up to 10 rooms per act (48 rooms maximum per campaign). Each room can have up to 100 scheduled spawn groups, each with 1–20 units. Acts are named sections of a custom standalone run, not rewrites of the canonical four. Normal-room upgrade drafts and canonical Warden bosses are not automatically inserted; make your own room pacing and guardian with scripted actors instead.

```js
RequiemMod.defineCampaign({
 id:'new-world', name:'THE FIFTH SIGNAL',
 acts:[
  {name:'ACT V // ESCAPE',rooms:[
   {name:'COLD ENTRY',duration:15,spawns:[
    {at:1,type:'hunter',count:2},
    {at:5,type:'charger',count:3},
    {at:9,type:'hunter',count:1,position:{x:400,y:200}}
   ]},
   {name:'GUARDIAN',duration:18,spawns:[{at:1,type:'my-boss',count:1}]}
  ]}
 ]
});
RequiemMod.playCampaign('new-world'); // must be called from main menu
```

The `playCampaign` command resets the run and begins room 1. Rooms end when their duration elapses, all scheduled groups have appeared, and all living enemies are defeated. Combat events/physics are the same as the main game, including the player taking damage and losing the run. When the final room clears, a custom expedition victory screen appears. The run is marked as a community expedition in the HUD. There is **no canonical rebirth or Act IV severance** in these modes.

Campaign events: `campaign:start` `{id,name,rooms}`, `campaign:room` `{id,index,act,name,duration}`, `campaign:clear` `{id,index,name}`, and `campaign:complete` `{id,name}`. Existing events such as `enemy:spawn`, `enemy:kill`, `player:damage`, `player:shoot`, `input:press`, `input:release`, `player:dash`, `player:pulse`, `run:start` and `run:end` also apply. `run:start` happens just before the community campaign is fully initialized, so use `campaign:start` for campaign-specific setup.

## 6. New mechanics and custom visuals

In addition to v1 actions, v2 provides:

```js
RequiemMod.teleport(400,260);                    // reposition pilot (short safety window)
RequiemMod.hazard({x:450,y:250,radius:65,warning:1.2}); // telegraphed arena hazard
RequiemMod.draw({kind:'circle',x:450,y:250,radius:80,color:'#a4fffb',life:.4});
RequiemMod.draw({kind:'line',x:200,y:150,x2:800,y2:450,width:2,color:'#ffaa99',life:.5});
RequiemMod.draw({kind:'text',x:420,y:140,text:'DODGE!',size:22,color:'#ecafff',life:.7});
RequiemMod.draw({kind:'rect',x:120,y:160,w:100,h:42,color:'#aaffef',fill:false});
```

All effects use validated sizes, colours and durations. Call `draw` when needed to create temporary effects, not continuously for static UI. You can use sandbox DOM/CSS for permanent menu/HUD-like interfaces within a mod screen. To invent mechanics, combine events, JS state, time-based rules, custom steering, bullets, hazards, heals and player stat modifications. More engine primitives can be added in future versions without exposing host internals.

### Keyboard-triggered abilities

Mods can invent player abilities and control schemes through `input:press` `{key}` and `input:release` `{key}`. These events are delivered only during gameplay. Normal game controls still work and are not automatically overridden by mods; choose an unused key such as **Q**. Combine the input with `getState()`, `damageNearby`, `slowNearby`, `teleport`, `fire`, etc. **The example expedition includes a Q-key Corona Pulse** with a six-second cooldown implemented entirely in its `.js` file. `player:dash` and `player:pulse` events also exist, so mods can react to existing abilities.

## 7. Existing v1 API — still supported

```js
RequiemMod.register({id,name,version,description});
RequiemMod.on('event',callback); RequiemMod.once('event',callback); RequiemMod.off('event',callback);
const snapshot=await RequiemMod.getState();
RequiemMod.toast('message',2.5);
RequiemMod.heal(10); RequiemMod.addScore(100);
RequiemMod.spawnEnemy('charger',{x:300,y:180});
RequiemMod.defineEnemy({id:'glow',base:'wisp',name:'Glowing Wisp',color:'#94f6ff',hpScale:2,speedScale:1.1,radiusScale:1,spawnChance:.1});
RequiemMod.defineUpgrade({id:'boost',name:'POWER',symbol:'✧',description:'Stronger shots',tag:'BALLISTICS',rarity:'RARE',max:2,effects:{damage:1.15,speed:1,fireRate:1,heal:0}});
RequiemMod.ring({x:250,y:200,color:'#aaf4ff',radius:12,end:90,life:.45});
RequiemMod.fire({team:'player',x:250,y:200,angle:1,speed:640,damage:8});
RequiemMod.fire({team:'hostile',x:250,y:200,angle:1,speed:260,count:4,spread:.2});
RequiemMod.damageNearby({x:250,y:200,radius:110,damage:20});
RequiemMod.slowNearby({x:250,y:200,radius:160,seconds:2});
RequiemMod.boost({damage:1.1,speed:1.08,fireRate:.95});
```

Supported v1 events: `mod:enabled`, `run:start`, `run:end`, `room:start`, `room:clear`, `enemy:spawn`, `enemy:kill`, `player:damage`, `player:shoot`, `boss:start`, `boss:phase`, `boss:defeated`, `upgrade:chosen`, and `tick`. V2 adds the events documented above, including `actor:damage` `{id,type,hp,maxHp,damage}`.

## 8. Sandboxing, trust and compatibility

Your `.js` executes in a `<iframe sandbox="allow-scripts">` with **opaque origin** and a restrictive content-security policy. Sandbox code does not get host cookies, host DOM, top-level navigation, or access to the game's JavaScript objects. The exposed API is a narrow `postMessage` bridge; engine-side validation and rate limits apply. Unlike v1, **mod screens can use their OWN frame DOM and inline CSS**. There are still limitations: malware can consume memory/CPU, exploit browsers, and game-balance changes can be abused. Do not install untrusted mods. There is no permission dialog for individual API actions in v2.

No mods are active on initial page load. The user's installed mods are stored on their own browser, and each mod must be manually enabled again after a refresh. Disabling a mod clears its button definitions, actor types, and custom campaigns; currently running mod scripts stop. Mods should not expect their content to survive disabling. Scores from modded games should not be mixed with competitive, verified vanilla leaderboards.

**Developing:** Start by importing `example_requiem_mod.js`. Edit the button label or actor AI in the file; reimport and enable the new copy. Use browser developer tools for mod errors. Test after adding larger waves and at multiple screen sizes.

## 9. Website deployment

Commit these *separate files* to `hypixelisidiotic/echo-rift` on its `main` branch:

```text
echo_rift_requiem.html
echo_rift_mod_api.js
echo_rift_modding_guide.md
example_requiem_mod.js
```

The **GitHub loader on your Linode VPS does not need to be replaced** if you're already using the v1 mod-enabled two-file loader. That loader fetches both the core HTML and the separate API JavaScript on each visit. If your site still uses the old single-file loader, install the two-file loader from the package first. Reopen the game after pushing both files; refresh with cache bypass if necessary.

**API 3.0 is experimental:** documented v1 mod calls are retained, and 2.0 adds opt-in modes/hooks. Future revisions may add custom collision geometry, animated sprites, custom upgrades within community expeditions, richer drawing APIs, HUD widgets, audio, and mod-to-mod interoperability. These are not implemented today.

## Custom models for Standard API mods (new)

**The Standard API supports original, persistent enemy artwork without Full Engine Mode.** Pass `sprite` to `RequiemMod.defineActor()`. No default octagon is rendered when a sprite is supplied. Modders can draw completely custom silhouettes with **SVG path syntax** (`M`, `L`, `C`, `Q`, `A`, `Z`, etc.) which the game's canvas renders using `Path2D`. Shapes are expressed in local coordinates relative to the actor's hit radius (for example `1` means one radius).

```javascript
RequiemMod.defineActor({
  id:'bladefish',name:'BLADEFISH',hp:120,speed:185,radius:22,
  sprite:{rotation:'face-player',parts:[
    {kind:'path',path:'M -1.4 0 C -.8 -1.2 .8 -1.2 1.5 0 C .8 1.2 -.8 1.2 -1.4 0 Z',color:'#254969',fill:true,stroke:true,lineWidth:2},
    {kind:'path',path:'M -.8 0 L .35 -.3 L 1.2 0 L .35 .3 Z',color:'#9beaff'},
    {kind:'ellipse',w:.45,h:.5,x:.5,color:'#fff0fa',pulse:2,pulseDepth:.15}
  ]}
});
```

Kinds: `path` (arbitrary vector outline using path string), `polyline` (array of `[x,y]` pairs), `ellipse`, `polygon`, `circle`, `rect`, `line`. `path` supports curves and open/closed shapes and is rendered as filled/stroked canvas geometry. Layers are painted back-to-front; up to **96 components**. Each component can animate independently with `angle`, `spin` (radians per second), `pulse` (cycles per second), `pulseDepth` (fractional scale amount), `opacity`, `color`, `fill`, `stroke`, and `lineWidth`. `rotation` at sprite level accepts `static`, `spin`, `face-player`, `face-motion`. Coordinates relative to hit radius; complex paths allow arbitrarily shaped silhouettes. Paths are interpreted as drawing instructions, never as HTML or JavaScript.

`polyline` example: `{kind:'polyline',points:[[-1,-.5],[0,-1],[1,.5],[0,1]],color:'#ff99cc',fill:true}`. Ellipse example: `{kind:'ellipse',w:2.2,h:.8,color:'#9beaff',fill:false}`.

For advanced or externally generated art, author curves as SVG path data and copy them into a mod sprite descriptor. Sprite rendering stays attached to each actor during movement and damage; do **not** use one-second `RequiemMod.draw()` calls to fake permanent body components. Use `draw()` only for transient attack telegraphs, trails and other effects. Collision is still based on actor `radius`; sprite geometry can extend outside that circle and won't automatically change hitboxes. SVG paths are not the same as loading arbitrary SVG files or running arbitrary renderer callbacks. If you need raster images or shader pipelines, those require separate support.

**Worked mod:** `act_zero_pale_hour_custom_models.js` converts the five Act 0 enemies into distinctive permanent designs without changing their movement/attack AI. It is a Standard API mod; install through MODS, not Full Engine Lab.

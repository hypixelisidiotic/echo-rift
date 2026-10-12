# ECHO//RIFT: REQUIEM — Community Mod API 2.0

**Format:** plain `.js` file · **Entry:** main menu → MODS → INSTALL → ENABLE  
**Required host files:** `echo_rift_requiem.html` + `echo_rift_mod_api.js`  
**Full playable reference:** `example_requiem_mod.js` (two new acts with custom AI and a mod-owned menu)

## What changed in 2.0

Mods can now create their own **main-menu buttons**, open **fully custom HTML/CSS/JavaScript screens**, add **independent multi-act campaigns**, create **entirely script-driven enemies**, and implement **new mechanics** with sandbox-driven simulation ticks, steering, projectiles, hazards, teleportation and custom drawing. The original 4-act game is not replaced or rewritten; custom campaigns are selectable alternate runs.

This is a foundation for genuinely custom experiences, not unlimited access to the host engine. Entirely new physics/collision models, native audio streams, multiplayer servers, arbitrary custom shaders and unbounded access to the DOM/engine are *not* provided. No stable third-party API can promise literally any feature without exposing the whole host process. APIs here are intentionally separated and may be expanded in future releases.

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

Actors are **true game enemies** for collision, targeting, projectile damage, HP, death, scoring and victory conditions, but they do **not** inherit the built-in enemy movement or attack logic. The mod decides what they do. Actors render as glowing polygons (3–12 sides). Supported limits: HP 5–2,000, speed 0–700, radius 8–75, score 0–5,000, 36 distinct actor definitions globally.

Spawn one using:

```js
RequiemMod.spawnActor('hunter');
RequiemMod.spawnActor('hunter',{x:500,y:120});
```

In your campaign's `spawns` arrays, use just `'hunter'` as the type (same for ordinary built-in types such as `'charger'`). Your actor IDs are automatically namespaced per installed mod to avoid collisions. Actors cannot be spawned in menus or while paused.

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

**API 2.0 is experimental:** documented v1 mod calls are retained, and 2.0 adds opt-in modes/hooks. Future revisions may add custom collision geometry, animated sprites, custom upgrades within community expeditions, richer drawing APIs, HUD widgets, audio, and mod-to-mod interoperability. These are not implemented today.

/*
 * ECHO//RIFT: REQUIEM // Public Mod API v2.0
 * Separate, versioned mod service. The main game only connects event hooks
 * and a versioned, sandboxed command dispatcher. Mods run in opaque-origin frames.
 *
 * DO NOT EDIT core owner-controlled source without permission. This API is
 * deliberately open for third-party mod files through documented hooks.
 */
(() => {
 'use strict';
 if(window.EchoRiftMods)return;
 const SANDBOX_DOCUMENT="<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; object-src 'none'; form-action 'none'; base-uri 'none'\"></head><body><script>/* Runs ONLY inside a sandboxed, opaque-origin mod frame. */\n(() => {\n 'use strict';\n const CHANNEL='ECHO_RIFT_MOD_V1';\n const subscriptions=new Map(),pending=new Map();\n let initialized=false,seq=0;\n const send=(type,payload={})=>parent.postMessage({channel:CHANNEL,type,...payload},'*');\n const report=error=>send('error',{error:String(error?.stack||error).slice(0,400)});\n const API=Object.freeze({\n  version:'3.0.0',\n  register(meta){send('meta',{data:{id:String(meta?.id||'').slice(0,80),name:String(meta?.name||'').slice(0,70),version:String(meta?.version||'1.0').slice(0,30),description:String(meta?.description||'').slice(0,180)}})},\n  on(event,callback){if(typeof callback!=='function')throw new TypeError('Callback must be a function');let list=subscriptions.get(event);if(!list){list=new Set();subscriptions.set(event,list)}list.add(callback);return ()=>API.off(event,callback)},\n  once(event,callback){const off=API.on(event,p=>{off();callback(p)});return off},\n  off(event,callback){subscriptions.get(event)?.delete(callback)},\n  getState(){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});send('snapshot',{id})})},\n  // Private JSON settings are held by the host, keyed to each installed mod.\n  storage:Object.freeze({\n   get(key){const id=++seq;return new Promise(resolve=>{pending.set(id,{resolve});send('storage',{id,operation:'get',key})})},\n   set(key,value){const id=++seq;return new Promise(resolve=>{pending.set(id,{resolve});send('storage',{id,operation:'set',key,value})})},\n   remove(key){const id=++seq;return new Promise(resolve=>{pending.set(id,{resolve});send('storage',{id,operation:'remove',key})})},\n   keys(){const id=++seq;return new Promise(resolve=>{pending.set(id,{resolve});send('storage',{id,operation:'keys'})})}\n  }),\n  // Declarative UI and audio do not grant access to the game's DOM or AudioContext.\n  hud:Object.freeze({set(id,options){send('command',{action:'hudSet',data:{id,...options}})},remove(id){send('command',{action:'hudRemove',data:{id}})}}),\n  audio:Object.freeze({tone(options){send('command',{action:'tone',data:options})}}),\n  actor:Object.freeze({set(id,options){send('command',{action:'actorSet',data:{id,...options}})},damage(id,amount){send('command',{action:'actorDamage',data:{id,amount}})},remove(id){send('command',{action:'actorRemove',data:{id}})}}),\n  player:Object.freeze({impulse(x,y){send('command',{action:'playerImpulse',data:{x,y}})},shield(seconds){send('command',{action:'playerShield',data:{seconds}})}}),\n  toast(text,seconds=2){send('command',{action:'toast',data:{text,seconds}})},\n  heal(amount){send('command',{action:'heal',data:{amount}})},\n  addScore(points){send('command',{action:'score',data:{points}})},\n  spawnEnemy(type,options={}){send('command',{action:'spawnEnemy',data:{type,...options}})},\n  defineEnemy(options){send('command',{action:'defineEnemy',data:options})},\n  defineUpgrade(options){send('command',{action:'defineUpgrade',data:options})},\n  ring(options){send('command',{action:'ring',data:options})},\n  fire(options){send('command',{action:'fire',data:options})},\n  damageNearby(options){send('command',{action:'damageNearby',data:options})},\n  slowNearby(options){send('command',{action:'slowNearby',data:options})},\n  boost(options){send('command',{action:'boost',data:options})},\n  menu:Object.freeze({addButton(options){send('command',{action:'menuButton',data:options})},removeButton(id){send('command',{action:'menuRemove',data:{id}})}}),\n  ui:Object.freeze({open(options={}){send('command',{action:'uiOpen',data:options})},close(){send('command',{action:'uiClose',data:{}})}}),\n  defineActor(options){send('command',{action:'defineActor',data:options})},\n  spawnActor(id,options={}){send('command',{action:'spawnEnemy',data:{type:id,...options}})},\n  steerActor(id,vx,vy){send('command',{action:'steerActor',data:{id,vx,vy}})},\n  defineCampaign(options){send('command',{action:'defineCampaign',data:options})},\n  playCampaign(id){send('command',{action:'playCampaign',data:{id}})},\n  teleport(x,y){send('command',{action:'teleport',data:{x,y}})},\n  hazard(options){send('command',{action:'hazard',data:options})},\n  draw(options){send('command',{action:'visual',data:options})}\n });\n Object.defineProperty(window,'RequiemMod',{value:API,writable:false,configurable:false});\n window.addEventListener('error',e=>report(e.error||e.message));\n window.addEventListener('unhandledrejection',e=>report(e.reason));\n window.addEventListener('message',e=>{\n  if(e.source!==parent||!e.data||e.data.channel!==CHANNEL)return;\n  const msg=e.data;\n  if(msg.type==='init'&&!initialized){\n   initialized=true;\n   try{\n    const script=document.createElement('script');\n    script.textContent=msg.code;\n    document.head.appendChild(script);\n    send('ready');\n   }catch(err){report(err)}\n  }else if(msg.type==='event'){\n   for(const cb of [...(subscriptions.get(msg.event)||[])]){\n    try{cb(msg.data)}catch(err){report(err)}\n   }\n  }else if(msg.type==='snapshotResult'||msg.type==='storageResult'){\n   const request=pending.get(msg.id);\n   if(request){pending.delete(msg.id);request.resolve(msg.data)}\n  }\n });\n window.addEventListener('keydown',e=>{if(e.key==='Escape'){send('command',{action:'uiClose',data:{}});e.preventDefault()}});\n send('boot');\n})();\n</script></body></html>";
 const MOD_STYLE="#riftModLauncher{position:fixed;bottom:19px;right:22px;z-index:37;padding:11px 17px;border:1px solid #90e6ff98;background:#0e2b40e8;color:#d7fbff;font:800 11px ui-monospace,monospace;letter-spacing:.14em;box-shadow:0 0 24px #2ecbef25;transition:border-color .15s,transform .15s;cursor:pointer}\n#riftModLauncher:hover{border-color:#c1ffff;transform:translateY(-2px)}#riftModLauncher.hidden,#riftModsOverlay.hidden{display:none!important}\n#riftModsOverlay{position:fixed;inset:0;z-index:65;display:flex;align-items:center;justify-content:center;background:#030917f0;backdrop-filter:blur(12px);padding:clamp(10px,4vw,33px);color:#e9f8ff;font-family:Inter,system-ui,sans-serif}\n.riftModsShell{display:flex;flex-direction:column;width:min(800px,100%);max-height:min(92dvh,840px);min-height:300px;border:1px solid #7bcce277;background:linear-gradient(145deg,#152a3c,#071221 80%);box-shadow:0 22px 80px #000b,inset 0 1px #ffffff12;overflow:hidden}\n.riftModsHeader{display:flex;justify-content:space-between;gap:20px;align-items:start;padding:25px 27px 19px;border-bottom:1px solid #6eb8d833}.riftModsEyebrow{color:#8ecde1;font:800 10px ui-monospace,monospace;letter-spacing:.16em}.riftModsHeader h2{margin:8px 0;font-size:clamp(30px,6vw,49px);letter-spacing:-.055em;line-height:.95}.riftModsHeader h2 span{color:#80eeff}.riftModsHeader p{color:#91adc1;font-size:12px;margin:8px 0 0}\n.riftModsTools{display:flex;gap:9px;padding:20px 27px 11px;flex-wrap:wrap}.riftUpload,.riftModButton{display:inline-flex;align-items:center;justify-content:center;border:1px solid #527d94;background:#143149;color:#d4f7ff;cursor:pointer;font:800 10px ui-monospace,monospace;letter-spacing:.065em;padding:11px 13px;min-height:40px;text-align:center}.riftUpload{border-color:#9be8fb;color:#091825;background:#acf3ff}.riftUpload:hover,.riftModButton:hover{filter:brightness(1.17)}.riftModButton.active{border-color:#8be9c0;background:#1b554c}.riftModButton.danger{border-color:#684d62;color:#e3b7c7;background:#291b2b}\n.riftModsNote{padding:0 27px 18px;color:#91aabc;font:11px/1.65 ui-monospace,monospace}.riftModsBar{border-top:1px solid #537b933d;border-bottom:1px solid #537b933d;background:#0c2233;display:flex;justify-content:space-between;padding:12px 27px;gap:10px;font:800 10px ui-monospace,monospace;letter-spacing:.08em;color:#b8deed}.riftModsBar span{color:#8ba8b8}\n#riftModList{min-height:60px;overflow:auto;scrollbar-color:#477f91 transparent;max-height:46dvh}.riftEmpty{padding:35px 25px;color:#668ba1;text-align:center;font:11px ui-monospace,monospace}.riftModRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 27px;border-bottom:1px solid #52799240}.riftModInfo{display:flex;flex-direction:column;gap:5px;min-width:0}.riftModInfo strong{font-size:15px;overflow:hidden;text-overflow:ellipsis}.riftModInfo span{font:10px ui-monospace,monospace;color:#91cbdd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.riftModInfo small{color:#8aa2b6;font-size:11px}.riftModActions{display:flex;gap:6px;flex-shrink:0}#riftModLog{padding:13px 27px;background:#081727;border-top:1px solid #4f768a46;color:#88b6c9;font:10px ui-monospace,monospace;min-height:39px;overflow:hidden;text-overflow:ellipsis}\n@media(max-width:600px){#riftModLauncher{right:12px;bottom:10px}.riftModsHeader{padding:18px 15px 12px}.riftModsHeader p{font-size:10px}.riftModsTools{padding:13px 15px 10px}.riftModsNote{padding:0 15px 12px;font-size:10px}.riftModsBar{padding:12px 15px;font-size:9px}.riftModRow{padding:11px 15px;align-items:start;flex-direction:column}.riftModActions{align-self:flex-end}.riftModsHeader h2{font-size:31px}#riftModLog{padding:11px 15px}}\n\n/* Community-owned menu launchers and fully custom sandboxed mod screens. */\n#riftCommunityButtons{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;max-width:530px}\n#riftCommunityButtons[hidden]{display:none!important}\n.riftCommunityButton{display:flex;flex-direction:column;gap:4px;min-width:155px;max-width:240px;text-align:left;padding:11px 14px;border:1px solid #78cbe387;background:linear-gradient(130deg,#132d41,#131c39);color:#e1f8ff;cursor:pointer;transition:background .15s}\n.riftCommunityButton:hover{background:#1c4056}.riftCommunityButton strong{font:800 12px ui-monospace,monospace;letter-spacing:.1em}.riftCommunityButton small{font:10px ui-monospace,monospace;color:#94adc9}\n#riftModView.hidden{display:none!important}#riftModView{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:clamp(8px,3vw,32px);background:#020a16ed;backdrop-filter:blur(11px)}\n.riftModViewShell{height:min(84dvh,720px);width:min(900px,96vw);min-height:280px;display:flex;flex-direction:column;background:#071625;border:1px solid #7fdaf085;box-shadow:0 28px 95px #000b}\n.riftModViewShell header{display:flex;gap:12px;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #579abb55;color:#c4f3ff;font:800 13px ui-monospace,monospace;letter-spacing:.12em}\n#riftModViewBody{flex:1;min-height:0;overflow:hidden}\n@media(max-width:650px){.riftCommunityButton{min-width:120px;max-width:100%;flex:1}.riftModViewShell header{padding:10px 12px;font-size:11px}}\n#riftModHud{position:fixed;top:118px;right:14px;z-index:18;display:flex;flex-direction:column;align-items:flex-end;gap:5px;pointer-events:none;max-width:40vw}#riftModHud>div{padding:5px 9px;background:#06182acb;border-left:2px solid var(--hue,#8befff);font:700 10px ui-monospace,monospace;color:#d4f4ff;text-align:right;text-shadow:0 1px #000}#riftModHud span{color:var(--hue,#8befff)}\n";
 const MOD_DOCUMENTATION="# ECHO//RIFT: REQUIEM — Community Mod API 3.1\n\n**Format:** plain `.js` file · **Entry:** main menu → MODS → INSTALL → ENABLE  \n**Required host files:** `echo_rift_requiem.html` + `echo_rift_mod_api.js`  \n**Full playable reference:** `example_requiem_mod.js` (two new acts with custom AI and a mod-owned menu)\n\n## What changed in 2.0\n\nMods can now create their own **main-menu buttons**, open **fully custom HTML/CSS/JavaScript screens**, add **independent multi-act campaigns**, create **entirely script-driven enemies**, and implement **new mechanics** with sandbox-driven simulation ticks, steering, projectiles, hazards, teleportation and custom drawing. The original 4-act game is not replaced or rewritten; custom campaigns are selectable alternate runs.\n\nThis is a foundation for genuinely custom experiences, not unlimited access to the host engine. Entirely new physics/collision models, native audio streams, multiplayer servers, arbitrary custom shaders and unbounded access to the DOM/engine are *not* provided. No stable third-party API can promise literally any feature without exposing the whole host process. APIs here are intentionally separated and may be expanded in future releases.\n\n\n## API 3.1 — Full Engine Lab (advanced, unrestricted *inside an isolated game*)\n\n**This is the answer to wanting to rewrite REQUIEM rather than merely use hooks.** On the main menu, open **MODS → FULL ENGINE LAB → IMPORT .JS PATCH → LAUNCH MODDED GAME**. The lab loads a completely fresh, temporary copy of the REQUIEM engine in a browser iframe with `sandbox=\"allow-scripts\"` (no `allow-same-origin`). Your patch is evaluated **directly inside the game engine's IIFE scope**, after the engine has initialized. This allows full control over its existing functions, variables, internal arrays, player and enemy rules, rendering functions, and cloned game DOM. You do not need to use `RequiemMod` for lab patches.\n\nA lab patch can reassign functions, change constants *where mutable*, extend enemy AI, directly use the canvas and UI, replace boss patterns and make original game modes. It has roughly the same creative latitude as directly editing the source *at runtime*, without rewriting or distributing the original HTML. It is not a code-rewriting compiler: `const` bindings cannot be reassigned, and code executed before patch injection cannot be retroactively changed. For deeper replacements, intercept later calls, modify mutable tables/objects, or build your own runtime systems.\n\nExample patch (`example_engine_lab_patch.js`):\n\n```js\n// These names are in the game's lexical engine scope, NOT on the website.\nconst vanillaSilence = silenceAttack;\nsilenceAttack = function (boss) {\n  vanillaSilence(boss);  // preserve existing attacks\n  // You can add entirely new patterns here using game functions, or\n  // replace the function body and draw or fire anything you want.\n};\n// Alter cloned REQUIEM's DOM; the real host menu is unaffected.\nconst tag = document.createElement('div');\ntag.textContent = 'CUSTOM ENGINE PATCH ACTIVE';\ntag.style.cssText = 'position:fixed;left:15px;top:12px;color:#8fffe9;z-index:99';\ndocument.body.append(tag);\n```\n\n**Security boundary:** the lab frame has a unique opaque origin. It cannot read the original site's localStorage, cookies, DOM, or the live REQUIEM game state. It cannot navigate the top-level page, submit forms, or open popups. The frame includes a restrictive Content Security Policy that blocks normal external connections, images and nested frames; JavaScript `eval` and inline CSS are deliberately permitted *within the isolated frame* for engine patching. Browser sandbox/CSP defence is not a guarantee against exploits or CPU/memory exhaustion. Only run mods from people you trust; arbitrary code can intentionally break or freeze the *lab instance*. The lab does not have a save bridge to the main website and does not retain progress after you close it. The regular Mod API runs separately and continues to use its controlled postMessage bridge.\n\n**Performance:** launching a lab runs a second complete game and temporarily uses extra memory/CPU. Close the lab to destroy its iframe. **Compatibility:** lab patches targeting specific engine internals may need changes when REQUIEM updates. Mods distributed for the public API are more version-stable.\n\n## API 3.1 — Full Engine Lab (advanced, unrestricted *inside an isolated game*)\n\n**This is the answer to wanting to rewrite REQUIEM rather than merely use hooks.** On the main menu, open **MODS → FULL ENGINE LAB → IMPORT .JS PATCH → LAUNCH MODDED GAME**. The lab loads a completely fresh, temporary copy of the REQUIEM engine in a browser iframe with `sandbox=\"allow-scripts\"` (no `allow-same-origin`). Your patch is evaluated **directly inside the game engine's IIFE scope**, after the engine has initialized. This allows full control over its existing functions, variables, internal arrays, player and enemy rules, rendering functions, and cloned game DOM. You do not need to use `RequiemMod` for lab patches.\n\nA lab patch can reassign functions, change constants *where mutable*, extend enemy AI, directly use the canvas and UI, replace boss patterns and make original game modes. It has roughly the same creative latitude as directly editing the source *at runtime*, without rewriting or distributing the original HTML. It is not a code-rewriting compiler: `const` bindings cannot be reassigned, and code executed before patch injection cannot be retroactively changed. For deeper replacements, intercept later calls, modify mutable tables/objects, or build your own runtime systems.\n\nExample patch (`example_engine_lab_patch.js`):\n\n```js\n// These names are in the game's lexical engine scope, NOT on the website.\nconst vanillaSilence = silenceAttack;\nsilenceAttack = function (boss) {\n  vanillaSilence(boss);  // preserve existing attacks\n  // You can add entirely new patterns here using game functions, or\n  // replace the function body and draw or fire anything you want.\n};\n// Alter cloned REQUIEM's DOM; the real host menu is unaffected.\nconst tag = document.createElement('div');\ntag.textContent = 'CUSTOM ENGINE PATCH ACTIVE';\ntag.style.cssText = 'position:fixed;left:15px;top:12px;color:#8fffe9;z-index:99';\ndocument.body.append(tag);\n```\n\n**Security boundary:** the lab frame has a unique opaque origin. It cannot read the original site's localStorage, cookies, DOM, or the live REQUIEM game state. It cannot navigate the top-level page, submit forms, or open popups. The frame includes a restrictive Content Security Policy that blocks normal external connections, images and nested frames; JavaScript `eval` and inline CSS are deliberately permitted *within the isolated frame* for engine patching. Browser sandbox/CSP defence is not a guarantee against exploits or CPU/memory exhaustion. Only run mods from people you trust; arbitrary code can intentionally break or freeze the *lab instance*. The lab does not have a save bridge to the main website and does not retain progress after you close it. The regular Mod API runs separately and continues to use its controlled postMessage bridge.\n\n**Performance:** launching a lab runs a second complete game and temporarily uses extra memory/CPU. Close the lab to destroy its iframe. **Compatibility:** lab patches targeting specific engine internals may need changes when REQUIEM updates. Mods distributed for the public API are more version-stable.\n\n## API 3.0 — New creative systems\n\n**The previous API (custom HTML menus, multi-act expeditions, custom AI, custom sprite layers, scripted abilities) remains available.** Version 3.0 adds five new interfaces rather than granting mods unsafe access to the host's internal objects.\n\n### Per-mod storage (persistent, namespaced)\n\n```js\nconst setting = await RequiemMod.storage.get('my-setting'); // JSON value or null\nconst saved = await RequiemMod.storage.set('my-setting', { enabled: true, level: 4 }); // boolean\nconst keys = await RequiemMod.storage.keys(); // string[]\nawait RequiemMod.storage.remove('my-setting'); // boolean\n```\n\nStorage is namespaced to the *installed mod*, not to the mod's displayed name. Data persists across reloads and disable/enable; uninstall deletes that installation's data. Per mod: 64 keys maximum, keys of 1–64 ASCII alphanumeric/underscore/dot/colon/hyphen characters, each JSON value up to 8 KB serialized, 32 KB total serialized. Storage is subject to the browser's own localStorage limits. Calls return Promises. Unlike the iframe's own opaque-origin storage, the host stores JSON for the mod and does not expose other mods' keys.\n\n### Custom in-game HUD readouts\n\n```js\nRequiemMod.hud.set('charges', {label:'MY ABILITY', value:'3 / 3', color:'#94e8ff'});\nRequiemMod.hud.set('charges', {label:'MY ABILITY', value:'2 / 3', color:'#ffbb88'});\nRequiemMod.hud.remove('charges');\n```\n\nHUD content is plain text, never HTML. Readouts are removed automatically on disable. Total across all mods: 24 readouts. Avoid updating unchanged values every simulation tick.\n\n### Procedural sounds\n\n```js\nRequiemMod.audio.tone({frequency:660,endFrequency:330,duration:.2,volume:.05,wave:'triangle'});\n```\n\nOscillator options: `frequency` 80–1800 Hz; `endFrequency` 70–1900 Hz; `duration` .025–.75 seconds; `volume` 0–.15; `wave`: sine, triangle, square, sawtooth. Sounds respect the game's audio settings and browser audio-unlock requirements. They are routed through the game's limiter; this is not file-based audio playback.\n\n### Actor runtime control (only actors belonging to your own mod)\n\n```js\nRequiemMod.actor.set(actor.id, {x:400, y:220, speed:200, hp:35, color:'#eeaaff'});\nRequiemMod.actor.damage(actor.id, 10);\nRequiemMod.actor.remove(actor.id);\n```\n\nOnly the calling mod's scripted actors can be changed; native enemies, Wardens, and another mod's actors are protected. Positions are clamped inside the playable arena. Speed 0–700; health 1–max health. `remove` removes a scripted actor directly and does not award a normal kill.\n\n### New player mechanics\n\n```js\nRequiemMod.player.impulse(80,-25); // move player by bounded displacement\nRequiemMod.player.shield(.6); // temporary invulnerability, up to 2s per call\n```\n\nPlayer displacement is clamped to screen bounds (±180 game units per axis, per call). Invulnerability uses the normal player hit system. Mods are rate-limited to 250 commands per second so these abilities should manage their own cooldowns. For production mods, clearly communicate what the ability does and avoid interfering with the player's normal input without warning.\n\n### Transient polygon drawing\n\n```js\nRequiemMod.draw({kind:'polygon',x:300,y:200,sides:6,radius:45,angle:Math.PI/6,color:'#bbffaa',fill:false,life:.4,width:3});\n```\n\nLike circle, line, rectangle and text effects, polygon drawing is time-limited and validated by the host; this does *not* give direct access to the game's canvas context.\n\n### What remains outside the public API\n\nThe API does **not** grant host DOM access, unrestricted main-engine JavaScript execution, arbitrary external fetches, custom native shaders, a new physics engine, server-side multiplayer, or arbitrary asset ingestion. These would require dedicated interfaces and security reviews. Sandboxing protects the website against many cross-origin abuses but does not make untrusted JavaScript completely harmless (e.g. CPU-intensive loops). Test mods and only enable code you trust.\n\n## Minimal mod\n\n```js\nRequiemMod.register({id:'ham.my-mod', name:'My Mod',version:'2.0.0'});\nRequiemMod.on('run:start',()=>RequiemMod.toast('Mod loaded!',2));\n```\n\nInstallation is per visitor, via `.js` import. Installed mod code persists in localStorage on that browser; mods begin **disabled** after each refresh. The user has to opt in before code runs. Previous v1 mods using the existing `RequiemMod` calls still work.\n\n## 1. Custom main-menu buttons\n\n```js\nRequiemMod.menu.addButton({id:'start',label:'★ MY CAMPAIGN',description:'NEW ACTS · ORIGINAL ENEMIES'});\nRequiemMod.on('menu:click',({id})=>{\n  if(id==='start')RequiemMod.ui.open({title:'MY CAMPAIGN'});\n});\n// Optionally:\nRequiemMod.menu.removeButton('start');\n```\n\nYou may register multiple buttons (global cap 24) and remove them. Each button is owned by its mod and automatically disappears when that mod is disabled. `menu:click` events carry `{id}`. Buttons only act on the main menu.\n\n## 2. Completely custom mod screens\n\n**A mod's own DOM is available inside its sandbox iframe.** You can use `document`, `document.createElement`, normal CSS, DOM listeners and JavaScript to build arbitrary menus and interactive interfaces **within that isolated frame**. You are not editing the host game's DOM.\n\n```js\nconst css=document.createElement('style');\ncss.textContent='body{background:#091422;color:#aaf5ff;font-family:system-ui}button{padding:14px}';\ndocument.head.appendChild(css);\nconst play=document.createElement('button');\nplay.textContent='START MY ACT';\nplay.addEventListener('click',()=>RequiemMod.playCampaign('my-act'));\ndocument.body.appendChild(play);\n\nRequiemMod.ui.open({title:'MY SCREEN'}); // only opens from main menu when enabled\nRequiemMod.ui.close();\nRequiemMod.on('ui:open',()=>console.log('Screen displayed'));\nRequiemMod.on('ui:close',()=>console.log('Screen hidden'));\n```\n\nWhen a mod screen is open, pressing **Escape** or **× CLOSE** closes it; clicking outside also closes it. The mod sandbox remains alive, so its state persists. The screen is *not* an unrestricted iframe: external network, host DOM, storage, popups and top-level navigation are blocked/restricted by sandbox/CSP. You can create as much native DOM/CSS as the iframe allows.\n\n**Important:** Do not try to use `window.parent.document`. The host is intentionally inaccessible. The visual viewport for a mod screen is the canvas-sized box inside the popup, and a mod owns only its iframe's content.\n\n## 3. Register your own scripted actor type\n\n```js\nRequiemMod.defineActor({\n  id:'hunter',name:'Amber Hunter',\n  hp:90, speed:170, radius:19, color:'#ffce8a', sides:7, score:220, boss:false\n});\n```\n\nSet `boss:true` on a scripted actor to display a full boss health bar during its encounter (the sample Eclipse Crown uses this). Boss actors still participate in the ordinary collision/death system, so the mod defines their phases and attacks.\n\nActors are **true game enemies** for collision, targeting, projectile damage, HP, death, scoring and victory conditions, but they do **not** inherit the built-in enemy movement or attack logic. The mod decides what they do. Actors support custom layered sprite artwork (up to 24 validated shapes), or fall back to glowing polygons (3–12 sides). Supported limits: HP 5–2,000, speed 0–700, radius 8–75, score 0–5,000, 36 distinct actor definitions globally.\n\nSpawn one using:\n\n```js\nRequiemMod.spawnActor('hunter');\nRequiemMod.spawnActor('hunter',{x:500,y:120});\n```\n\nIn your campaign's `spawns` arrays, use just `'hunter'` as the type (same for ordinary built-in types such as `'charger'`). Your actor IDs are automatically namespaced per installed mod to avoid collisions. Actors cannot be spawned in menus or while paused.\n\n\n### Custom layered actor artwork (API 2.1)\n\nScripted actors **no longer have to look like glowing polygons**. Add a `sprite` descriptor to `defineActor`. All coordinates and dimensions are relative to the actor's `radius`, with origin at its centre. Parts draw in array order (back to front). Shapes are validated data, not executable canvas functions.\n\n```js\nRequiemMod.defineActor({\n id:'manta',name:'Violet Manta',hp:95,speed:190,radius:24,color:'#a788ff',\n sprite:{rotation:'face-player',parts:[\n  {kind:'polygon',sides:3,x:-.5,y:0,radius:.95,angle:-1.57,color:'#7858e9'},\n  {kind:'polygon',sides:3,x:.5,y:0,radius:.95,angle:1.57,color:'#7858e9'},\n  {kind:'polygon',sides:6,radius:.58,color:'#171832',lineWidth:2.5},\n  {kind:'circle',radius:.24,color:'#e7beff',stroke:false},\n  {kind:'circle',radius:1.1,color:'#a788ff',fill:false,opacity:.55,spin:1.7}\n ]}\n});\n```\n\nShapes: `polygon` (`sides` 3–16, `radius`), `circle` (`radius`), `rect` (`w`,`h`), and `line` (`x`,`y`,`x2`,`y2`). All parts support `x`, `y`, `angle` (radians), `spin` (radians/second), `color` (six-digit hex), `opacity`, `lineWidth`, `fill` and `stroke`. `rotation` is `static`, `spin` (set a top-level `spin` speed), `face-player`, or `face-motion`. A sprite has up to 24 parts. These designs are drawn by the existing game canvas engine with collision radius unchanged. Without `sprite`, the original simple polygon remains as a fallback.\n\n**Important:** This is extensive *declarative vector artwork*, not unrestricted execution in the host renderer. Mods can already draw temporary battlefield effects with `RequiemMod.draw`. External bitmap files, textures, custom shaders, and per-frame Canvas callbacks are not supported; allowing arbitrary scripts inside the host would defeat the mod security boundary.\n\n## 4. Script novel movement and attacks\n\n`simulation:tick` fires approximately **10 times per second** during active gameplay. It carries:\n\n```js\n{\n dt:0.1, time:12.7, roomTime:3.6,\n player:{x,y,hp,maxHp},\n actors:[{id,type,x,y,hp,maxHp,vx,vy}, ...],\n campaign:null | {id,room}\n}\n```\n\nOnly script-controlled actors are in `actors`, not built-in enemies. `id` is the unique active actor instance ID, while `type` ends with your actor type's local name. For accurate steering, use normalized components with `RequiemMod.steerActor(id,vx,vy)`; magnitude is clamped. Only the mod that created an actor type can steer that actor. The engine interpolates movement at its normal tick rate and applies collision/damage normally.\n\n```js\nconst nextShot=new Map();\nRequiemMod.on('simulation:tick',tick=>{\n  if(!tick.player)return;\n  for(const actor of tick.actors){\n    if(!actor.type.endsWith(':hunter'))continue;\n    const dx=tick.player.x-actor.x,dy=tick.player.y-actor.y;\n    const len=Math.hypot(dx,dy)||1;\n    // Invent any scriptable AI rule, based on the player, health, time, etc.\n    RequiemMod.steerActor(actor.id,dx/len,dy/len);\n    if(tick.time>=(nextShot.get(actor.id)||0)){\n      RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),speed:245,count:3});\n      nextShot.set(actor.id,tick.time+2);\n    }\n  }\n});\nRequiemMod.on('actor:death',({id,type,x,y})=>nextShot.delete(id));\n```\n\nActor movement is applied asynchronously by `postMessage`; rapid reactions may have up to one simulation tick of latency. Collision and movement continue in the main game loop. Mod commands are capped at **250/s per mod**; expensive AI should work with tens of actors, not thousands. The shared enemy population limit is 125, and the `simulation:tick` snapshot reports up to 50 scripted actors.\n\n## 5. Full new campaigns and acts\n\nDeclare as many as 12 acts with up to 10 rooms per act (48 rooms maximum per campaign). Each room can have up to 100 scheduled spawn groups, each with 1–20 units. Acts are named sections of a custom standalone run, not rewrites of the canonical four. Normal-room upgrade drafts and canonical Warden bosses are not automatically inserted; make your own room pacing and guardian with scripted actors instead.\n\n```js\nRequiemMod.defineCampaign({\n id:'new-world', name:'THE FIFTH SIGNAL',\n acts:[\n  {name:'ACT V // ESCAPE',rooms:[\n   {name:'COLD ENTRY',duration:15,spawns:[\n    {at:1,type:'hunter',count:2},\n    {at:5,type:'charger',count:3},\n    {at:9,type:'hunter',count:1,position:{x:400,y:200}}\n   ]},\n   {name:'GUARDIAN',duration:18,spawns:[{at:1,type:'my-boss',count:1}]}\n  ]}\n ]\n});\nRequiemMod.playCampaign('new-world'); // must be called from main menu\n```\n\nThe `playCampaign` command resets the run and begins room 1. Rooms end when their duration elapses, all scheduled groups have appeared, and all living enemies are defeated. Combat events/physics are the same as the main game, including the player taking damage and losing the run. When the final room clears, a custom expedition victory screen appears. The run is marked as a community expedition in the HUD. There is **no canonical rebirth or Act IV severance** in these modes.\n\nCampaign events: `campaign:start` `{id,name,rooms}`, `campaign:room` `{id,index,act,name,duration}`, `campaign:clear` `{id,index,name}`, and `campaign:complete` `{id,name}`. Existing events such as `enemy:spawn`, `enemy:kill`, `player:damage`, `player:shoot`, `input:press`, `input:release`, `player:dash`, `player:pulse`, `run:start` and `run:end` also apply. `run:start` happens just before the community campaign is fully initialized, so use `campaign:start` for campaign-specific setup.\n\n## 6. New mechanics and custom visuals\n\nIn addition to v1 actions, v2 provides:\n\n```js\nRequiemMod.teleport(400,260);                    // reposition pilot (short safety window)\nRequiemMod.hazard({x:450,y:250,radius:65,warning:1.2}); // telegraphed arena hazard\nRequiemMod.draw({kind:'circle',x:450,y:250,radius:80,color:'#a4fffb',life:.4});\nRequiemMod.draw({kind:'line',x:200,y:150,x2:800,y2:450,width:2,color:'#ffaa99',life:.5});\nRequiemMod.draw({kind:'text',x:420,y:140,text:'DODGE!',size:22,color:'#ecafff',life:.7});\nRequiemMod.draw({kind:'rect',x:120,y:160,w:100,h:42,color:'#aaffef',fill:false});\n```\n\nAll effects use validated sizes, colours and durations. Call `draw` when needed to create temporary effects, not continuously for static UI. You can use sandbox DOM/CSS for permanent menu/HUD-like interfaces within a mod screen. To invent mechanics, combine events, JS state, time-based rules, custom steering, bullets, hazards, heals and player stat modifications. More engine primitives can be added in future versions without exposing host internals.\n\n### Keyboard-triggered abilities\n\nMods can invent player abilities and control schemes through `input:press` `{key}` and `input:release` `{key}`. These events are delivered only during gameplay. Normal game controls still work and are not automatically overridden by mods; choose an unused key such as **Q**. Combine the input with `getState()`, `damageNearby`, `slowNearby`, `teleport`, `fire`, etc. **The example expedition includes a Q-key Corona Pulse** with a six-second cooldown implemented entirely in its `.js` file. `player:dash` and `player:pulse` events also exist, so mods can react to existing abilities.\n\n## 7. Existing v1 API — still supported\n\n```js\nRequiemMod.register({id,name,version,description});\nRequiemMod.on('event',callback); RequiemMod.once('event',callback); RequiemMod.off('event',callback);\nconst snapshot=await RequiemMod.getState();\nRequiemMod.toast('message',2.5);\nRequiemMod.heal(10); RequiemMod.addScore(100);\nRequiemMod.spawnEnemy('charger',{x:300,y:180});\nRequiemMod.defineEnemy({id:'glow',base:'wisp',name:'Glowing Wisp',color:'#94f6ff',hpScale:2,speedScale:1.1,radiusScale:1,spawnChance:.1});\nRequiemMod.defineUpgrade({id:'boost',name:'POWER',symbol:'✧',description:'Stronger shots',tag:'BALLISTICS',rarity:'RARE',max:2,effects:{damage:1.15,speed:1,fireRate:1,heal:0}});\nRequiemMod.ring({x:250,y:200,color:'#aaf4ff',radius:12,end:90,life:.45});\nRequiemMod.fire({team:'player',x:250,y:200,angle:1,speed:640,damage:8});\nRequiemMod.fire({team:'hostile',x:250,y:200,angle:1,speed:260,count:4,spread:.2});\nRequiemMod.damageNearby({x:250,y:200,radius:110,damage:20});\nRequiemMod.slowNearby({x:250,y:200,radius:160,seconds:2});\nRequiemMod.boost({damage:1.1,speed:1.08,fireRate:.95});\n```\n\nSupported v1 events: `mod:enabled`, `run:start`, `run:end`, `room:start`, `room:clear`, `enemy:spawn`, `enemy:kill`, `player:damage`, `player:shoot`, `boss:start`, `boss:phase`, `boss:defeated`, `upgrade:chosen`, and `tick`. V2 adds the events documented above, including `actor:damage` `{id,type,hp,maxHp,damage}`.\n\n## 8. Sandboxing, trust and compatibility\n\nYour `.js` executes in a `<iframe sandbox=\"allow-scripts\">` with **opaque origin** and a restrictive content-security policy. Sandbox code does not get host cookies, host DOM, top-level navigation, or access to the game's JavaScript objects. The exposed API is a narrow `postMessage` bridge; engine-side validation and rate limits apply. Unlike v1, **mod screens can use their OWN frame DOM and inline CSS**. There are still limitations: malware can consume memory/CPU, exploit browsers, and game-balance changes can be abused. Do not install untrusted mods. There is no permission dialog for individual API actions in v2.\n\nNo mods are active on initial page load. The user's installed mods are stored on their own browser, and each mod must be manually enabled again after a refresh. Disabling a mod clears its button definitions, actor types, and custom campaigns; currently running mod scripts stop. Mods should not expect their content to survive disabling. Scores from modded games should not be mixed with competitive, verified vanilla leaderboards.\n\n**Developing:** Start by importing `example_requiem_mod.js`. Edit the button label or actor AI in the file; reimport and enable the new copy. Use browser developer tools for mod errors. Test after adding larger waves and at multiple screen sizes.\n\n## 9. Website deployment\n\nCommit these *separate files* to `hypixelisidiotic/echo-rift` on its `main` branch:\n\n```text\necho_rift_requiem.html\necho_rift_mod_api.js\necho_rift_modding_guide.md\nexample_requiem_mod.js\n```\n\nThe **GitHub loader on your Linode VPS does not need to be replaced** if you're already using the v1 mod-enabled two-file loader. That loader fetches both the core HTML and the separate API JavaScript on each visit. If your site still uses the old single-file loader, install the two-file loader from the package first. Reopen the game after pushing both files; refresh with cache bypass if necessary.\n\n**API 3.0 is experimental:** documented v1 mod calls are retained, and 2.0 adds opt-in modes/hooks. Future revisions may add custom collision geometry, animated sprites, custom upgrades within community expeditions, richer drawing APIs, HUD widgets, audio, and mod-to-mod interoperability. These are not implemented today.\n";
 const MOD_EXAMPLE="// ECHO//RIFT: REQUIEM — V2 COMMUNITY EXPEDITION EXAMPLE\n// Import via MODS → INSTALL .JS → ENABLE. This is a real 2-act mini-campaign.\n// It also demonstrates a CUSTOM HTML/CSS main-menu screen and new actor AI.\nRequiemMod.register({\n  id:'example.eclipse-expedition',name:'Eclipse Expedition',version:'2.0.0',\n  description:'Two new acts, a custom menu, script-driven enemies, and a phase-changing final guardian.'\n});\n\n// No built-in behaviour is inherited: the mod controls these units every 100ms.\nRequiemMod.defineActor({id:'seek',name:'Eclipse Seeker',hp:44,speed:155,radius:17,color:'#5dffe0',sides:3,score:160,sprite:{rotation:'face-player',parts:[{kind:'polygon',sides:3,radius:1.2,color:'#274e58'},{kind:'polygon',sides:3,radius:.76,color:'#54eacb'},{kind:'circle',y:.16,radius:.26,color:'#e1fff9',stroke:false},{kind:'line',x:-.86,y:.42,x2:.86,y2:.42,color:'#b4fff3',lineWidth:2}]}});\nRequiemMod.defineActor({id:'orbit',name:'Orbit Sentinel',hp:110,speed:120,radius:23,color:'#ffd28a',sides:7,score:280,sprite:{rotation:'spin',spin:.65,parts:[{kind:'circle',radius:1.2,color:'#f6af61',fill:false,lineWidth:3},{kind:'rect',w:1.4,h:.36,color:'#ffc972',angle:.785},{kind:'rect',w:1.4,h:.36,color:'#ffc972',angle:-.785},{kind:'polygon',sides:6,radius:.57,color:'#33263e'},{kind:'circle',radius:.22,color:'#fff1cb',stroke:false}]}});\nRequiemMod.defineActor({id:'crown',name:'Eclipse Crown',hp:850,speed:62,radius:54,color:'#e49cff',sides:9,score:1800,boss:true,sprite:{rotation:'spin',spin:-.18,parts:[{kind:'polygon',sides:5,radius:1.15,color:'#8e49b0',fill:false,lineWidth:4},{kind:'polygon',sides:5,radius:.92,color:'#24203f',angle:.628},{kind:'circle',radius:.65,color:'#d39aff',fill:false,lineWidth:3,spin:.9},{kind:'polygon',sides:3,radius:.57,color:'#eabaed',angle:3.14},{kind:'circle',radius:.18,color:'#ffffff',stroke:false}]}});\n\nRequiemMod.defineCampaign({\n id:'eclipse',name:'ECLIPSE EXPEDITION',\n acts:[\n  {name:'ACT V // DARKLIGHT',rooms:[\n   {name:'UNWELCOME SIGNAL',duration:14,spawns:[\n    {at:1,type:'seek',count:3},{at:5,type:'orbit',count:1},{at:8,type:'seek',count:3}]},\n   {name:'THE HOLLOW STAR',duration:17,spawns:[\n    {at:1,type:'orbit',count:2},{at:6,type:'seek',count:4},{at:10,type:'orbit',count:1}]}\n  ]},\n  {name:'ACT VI // OCCLUSION',rooms:[\n   {name:'FADING ORBIT',duration:19,spawns:[\n    {at:1,type:'orbit',count:3},{at:5,type:'seek',count:5},{at:10,type:'orbit',count:2}]},\n   {name:'THE LAST CORONA',duration:20,spawns:[\n    {at:2,type:'crown',count:1},{at:6,type:'seek',count:3},{at:11,type:'orbit',count:2}]}\n  ]}\n ]\n});\n\nRequiemMod.menu.addButton({id:'eclipse',label:'✦ ECLIPSE EXPEDITION',description:'TWO NEW ACTS · CUSTOM AI · NEW BOSS'});\n\n// The following DOM and CSS belong to the SANDBOXED MOD FRAME ONLY.\n// The mod cannot edit the REQUIEM menu/host document itself.\nconst style=document.createElement('style');\nstyle.textContent=`\n *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:system-ui,sans-serif;color:#e3ffff;background:#061424}\n .scene{min-height:100%;padding:clamp(20px,6vw,48px);display:flex;flex-direction:column;align-items:start;justify-content:center;background:radial-gradient(ellipse at 75% 26%,#2e2356 0%,transparent 55%)}\n small{color:#85dece;font:700 11px ui-monospace,monospace;letter-spacing:.28em}\n h1{font-size:clamp(36px,7vw,74px);line-height:.98;letter-spacing:-.06em;margin:20px 0;color:#fff1fa;text-shadow:0 0 32px #c18bff65}\n p{font-size:15px;line-height:1.75;color:#a7c1d2;max-width:580px}\n .pill{border:1px solid #9df3da67;padding:9px 13px;margin:18px 0;color:#8deecf;font:700 11px ui-monospace,monospace}\n button{padding:17px 25px;border:1px solid #b1fce9;background:#bcffee;color:#09202b;font:900 13px ui-monospace,monospace;letter-spacing:.12em;cursor:pointer}\n button:hover{background:white}\n`;\ndocument.head.appendChild(style);\nconst ui=document.createElement('main');ui.className='scene';\nui.innerHTML=`<small>COMMUNITY CONTENT / CUSTOM EXPEDITION</small>\n<h1>THE ECLIPSE<br>EXPEDITION.</h1>\n<p>Four new encounters across two acts. Seekers hunt you in sharp bursts, Sentinels orbit and fire in calculated patterns, and the Eclipse Crown changes its attack logic as its health drops.</p>\n<div class=\"pill\">SCRIPTED AI · Q CORONA PULSE · MOD-OWNED CAMPAIGN</div>\n<button id=\"beginEclipse\" type=\"button\">▶ BEGIN EXPEDITION</button>`;\ndocument.body.appendChild(ui);\ndocument.getElementById('beginEclipse').addEventListener('click',()=>RequiemMod.playCampaign('eclipse'));\n\nRequiemMod.on('menu:click',({id})=>{if(id==='eclipse')RequiemMod.ui.open({title:'ECLIPSE EXPEDITION'})});\n\nconst shotTimers=new Map();\nlet corona=0,abilityReady=0,expeditionLive=false;\n// A completely NEW player ability, implemented exclusively in mod code.\n// Q sends a short-range disruption pulse with its own cooldown and visuals.\nRequiemMod.on('input:press',async({key})=>{\n if(key!=='q'||!expeditionLive||Date.now()<abilityReady)return;\n const game=await RequiemMod.getState();\n if(!game||game.state!=='playing'||!game.campaign||!game.player)return;\n abilityReady=Date.now()+6000;\n const {x,y}=game.player;\n RequiemMod.damageNearby({x,y,radius:155,damage:24});\n RequiemMod.slowNearby({x,y,radius:180,seconds:2.4});\n RequiemMod.ring({x,y,color:'#8fffe9',radius:25,end:175,life:.55});\n RequiemMod.draw({kind:'text',x,y:y-70,text:'CORONA PULSE',color:'#a7fff0',size:18,life:.9});\n RequiemMod.toast('CORONA PULSE // RECHARGING 6 SEC',1.8);\n});\nRequiemMod.on('run:end',()=>{expeditionLive=false});\nRequiemMod.on('campaign:start',()=>{shotTimers.clear();corona=0;expeditionLive=true;abilityReady=0;RequiemMod.toast('ECLIPSE ACQUIRED // PRESS Q FOR CORONA PULSE',3)});\nRequiemMod.on('campaign:room',r=>{\n RequiemMod.toast('NEW SECTOR // '+r.name,2.2);\n shotTimers.clear();\n});\nRequiemMod.on('actor:death',a=>{shotTimers.delete(a.id);RequiemMod.ring({x:a.x,y:a.y,color:'#a8ffde',radius:15,end:110,life:.5})});\nRequiemMod.on('campaign:complete',()=>RequiemMod.toast('THE ECLIPSE HAS ENDED',3));\n\n// All mechanics here are mod code, not switches on an existing enemy's AI.\nRequiemMod.on('simulation:tick',frame=>{\n if(!frame.campaign||!frame.player)return;\n const p=frame.player;\n for(const actor of frame.actors){\n  const tag=actor.type.split(':').pop(),dx=p.x-actor.x,dy=p.y-actor.y;\n  const dist=Math.max(1,Math.hypot(dx,dy)),nx=dx/dist,ny=dy/dist;\n  const t=frame.time;\n  if(tag==='seek'){\n   // Zig-zag interceptors that accelerate sideways, without built-in AI.\n   const wobble=Math.sin(t*3+actor.id*43)*.8;\n   RequiemMod.steerActor(actor.id,nx-ny*wobble,ny+nx*wobble);\n  }else if(tag==='orbit'){\n   // Tangential defenders that strafe at range and periodically aim at the pilot.\n   const forward=dist<170?-.5:dist>380?.7:.1;\n   RequiemMod.steerActor(actor.id,nx*forward-ny*.95,ny*forward+nx*.95);\n   if(t>=(shotTimers.get(actor.id)||0)){\n    RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),count:3,spread:.24,speed:210,color:'#ffd28a'});\n    shotTimers.set(actor.id,t+1.8);\n   }\n  }else if(tag==='crown'){\n   // An entirely mod-scripted miniboss with 3 health-triggered phases.\n   const phase=actor.hp/actor.maxHp>.65?1:actor.hp/actor.maxHp>.32?2:3;\n   const side=Math.sin(t*.8)*.75;\n   RequiemMod.steerActor(actor.id,-ny*side+nx*.1,nx*side+ny*.1);\n   if(t>=(shotTimers.get(actor.id)||0)){\n    if(phase===1){\n     RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),count:5,spread:.21,speed:215,color:'#d6a4ff'});\n    }else if(phase===2){\n     for(let i=0;i<6;i++)RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:corona+i*Math.PI/3,count:1,speed:190,color:'#d6a4ff'});\n    }else{\n     RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),count:7,spread:.17,speed:270,color:'#f69bbd'});\n     RequiemMod.hazard({x:p.x+Math.sin(t)*95,y:p.y+Math.cos(t)*70,radius:44,warning:1.25});\n    }\n    RequiemMod.draw({kind:'circle',x:actor.x,y:actor.y,radius:actor.maxHp?60:35,color:'#d89cff',life:.35});\n    corona+=.3;shotTimers.set(actor.id,t+(phase===3?2.1:phase===2?2.5:3.1));\n   }\n  }\n }\n});\n";
 const CHANNEL='ECHO_RIFT_MOD_V1',KEY='echoRiftCommunityModsV1',MAX_MODS=8,MAX_BYTES=240000;
 const BUILTIN=new Set('wisp shooter charger bulwark splitter sniper weaver spinner corsair obelisk interceptor needle prism vesper'.split(' '));
 const safeNumber=(x,min,max,def=min)=>Number.isFinite(Number(x))?Math.min(max,Math.max(min,Number(x))):def;
 const safeColor=s=>typeof s==='string'&&/^#[\da-fA-F]{6}$/.test(s)?s:'#a3f6ff';
 const state={hud:new Map(),stored:[],active:new Map(),custom:new Map(),upgrades:new Map(),actors:new Map(),campaigns:new Map(),menuButtons:new Map(),view:null,game:null,open:false,logs:[]};
 const toId=()=>Math.random().toString(36).slice(2,11)+Date.now().toString(36).slice(-4);
 const log=(msg)=>{state.logs.push(msg);if(state.logs.length>25)state.logs.shift();const el=document.getElementById('riftModLog');if(el)el.textContent=msg;console.info('[REQUIEM Mods]',msg)};
 const getStore=()=>{try{const entries=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(entries))return entries.filter(v=>v&&typeof v.uid==='string'&&typeof v.code==='string'&&v.code.length<=MAX_BYTES).slice(0,MAX_MODS)}catch{}return []};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state.stored))}catch(e){log('Storage limit reached; installed mod list may not persist.')}};
 const getMod=uid=>state.stored.find(v=>v.uid===uid);
 const anyActive=()=>state.active.size>0;
 const isMenu=()=>state.game?.snapshot()?.state==='menu';
 const allClear=()=>!state.view&&document.getElementById('adminOverlay')?.classList.contains('hidden')&&document.getElementById('wordleOverlay')?.classList.contains('hidden')&&document.getElementById('codexOverlay')?.classList.contains('hidden');
 function render(){
  const list=document.getElementById('riftModList');if(!list)return;
  list.replaceChildren();
  if(!state.stored.length){const el=document.createElement('div');el.className='riftEmpty';el.textContent='NO COMMUNITY MODS INSTALLED // IMPORT A .JS FILE';list.appendChild(el)}
  state.stored.forEach(mod=>{
   const running=state.active.get(mod.uid);
   const row=document.createElement('div');row.className='riftModRow';
   const content=document.createElement('div');content.className='riftModInfo';
   const name=document.createElement('strong');name.textContent=running?.meta?.name||mod.name||mod.filename;
   const sub=document.createElement('span');sub.textContent=(running?'ACTIVE':'INACTIVE')+' · '+mod.filename+(running?.meta?.version?' · v'+running.meta.version:'');
   const description=document.createElement('small');description.textContent=running?.meta?.description||'Community JavaScript mod';
   content.append(name,sub,description);
   const actions=document.createElement('div');actions.className='riftModActions';
   const toggle=document.createElement('button');toggle.type='button';toggle.textContent=running?'DISABLE':'ENABLE';toggle.className='riftModButton'+(running?' active':'');toggle.addEventListener('click',()=>running?disable(mod.uid):enable(mod.uid));
   const remove=document.createElement('button');remove.type='button';remove.textContent='REMOVE';remove.className='riftModButton danger';remove.addEventListener('click',()=>removeMod(mod.uid));
   actions.append(toggle,remove);row.append(content,actions);list.append(row);
  });
  const count=document.getElementById('riftModCount');if(count)count.textContent=state.active.size+' ENABLED / '+state.stored.length+' INSTALLED';
 }
 const send=(mod,msg)=>{try{mod.frame?.contentWindow?.postMessage({channel:CHANNEL,...msg},'*')}catch{}};
 function renderHud(){
  const host=document.getElementById('riftModHud');if(!host)return;
  host.replaceChildren();
  const visible=document.getElementById('menu')?.classList.contains('hidden');
  host.hidden=!visible||!state.hud.size;
  for(const item of state.hud.values()){
   const row=document.createElement('div');row.style.setProperty('--hue',item.color);
   const label=document.createTextNode(item.label+'  ');const value=document.createElement('span');value.textContent=item.value;
   row.append(label,value);host.append(row);
  }
 }
 function disable(uid){
  if(state.view?.uid===uid)closeView();
  for(const key of [...state.menuButtons.keys()])if(key.startsWith(uid+':'))state.menuButtons.delete(key);
  for(const key of [...state.actors.keys()])if(key.startsWith(uid+':'))state.actors.delete(key);
  for(const key of [...state.campaigns.keys()])if(key.startsWith(uid+':'))state.campaigns.delete(key);
  for(const key of [...state.hud.keys()])if(key.startsWith(uid+':'))state.hud.delete(key);
  renderHud();renderMenuButtons();
  const mod=state.active.get(uid);if(!mod)return;
  mod.frame.remove();state.active.delete(uid);
  for(const key of [...state.custom.keys()])if(key.startsWith(uid+':'))state.custom.delete(key);
  for(const key of [...state.upgrades.keys()])if(key.startsWith(uid+':'))state.upgrades.delete(key);
  log('Disabled '+(mod.meta?.name||mod.filename));render();
 }
 function removeMod(uid){try{localStorage.removeItem('echoRiftModDataV3:'+uid)}catch{}disable(uid);state.stored=state.stored.filter(v=>v.uid!==uid);save();render();log('Removed mod.');}
 function enable(uid){
  if(!isMenu()){log('Mods may only be enabled from the main menu.');return}
  if(state.active.has(uid))return;
  const saved=getMod(uid);if(!saved)return;
  // An opaque-origin frame receives only serializable snapshots and whitelisted actions.
  const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.style.cssText='display:none!important';
  frame.srcdoc=SANDBOX_DOCUMENT;
  const mod={uid,frame,filename:saved.filename,code:saved.code,meta:null,lastWindow:performance.now(),actions:0,ready:false};
  state.active.set(uid,mod);(document.getElementById('riftModViewBody')||document.body).appendChild(frame);
  log('Starting '+saved.filename+'…');render();
 }
 // Buttons belong to the main menu, but their click events are delivered
 // to the owning sandbox. There is no injection into the host DOM.
 function renderMenuButtons(){
  const parent=document.getElementById('riftCommunityButtons');if(!parent)return;
  parent.replaceChildren();
  for(const entry of state.menuButtons.values()){
   if(!state.active.has(entry.owner))continue;
   const button=document.createElement('button');button.type='button';button.className='riftCommunityButton';
   const title=document.createElement('strong');title.textContent=entry.label;
   const detail=document.createElement('small');detail.textContent=entry.description||'COMMUNITY MODE';
   button.append(title,detail);button.addEventListener('click',()=>{
    if(!isMenu()||!allClear())return;
    const mod=state.active.get(entry.owner);if(mod?.ready)send(mod,{type:'event',event:'menu:click',data:{id:entry.id}});
   });parent.append(button);
  }
  parent.hidden=!parent.childElementCount;
 }
 function openView(mod,options={}){
  if(!isMenu()||!mod.ready||state.open||!allClear())return;
  const overlay=document.getElementById('riftModView'),title=document.getElementById('riftModViewTitle'),body=document.getElementById('riftModViewBody');
  if(!overlay||!body)return;
  state.view={uid:mod.uid};title.textContent=String(options.title||mod.meta?.name||'COMMUNITY SCREEN').slice(0,75);
  const frame=mod.frame;frame.style.cssText='width:100%;height:100%;border:0;display:block;background:#071726';
  overlay.classList.remove('hidden');
  send(mod,{type:'event',event:'ui:open',data:{}});
 }
 function closeView(){
  const active=state.view;if(!active)return;
  state.view=null;
  const overlay=document.getElementById('riftModView');overlay?.classList.add('hidden');
  const mod=state.active.get(active.uid);
  if(mod){mod.frame.style.cssText='display:none!important';send(mod,{type:'event',event:'ui:close',data:{}})}
  const arena=document.getElementById('game');if(arena){arena.tabIndex=-1;arena.focus({preventScroll:true})}
 }
 const ident=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,36}$/.test(id);
 function registerCampaign(mod,d){
  if(!ident(d.id)||!Array.isArray(d.acts)||!d.acts.length||d.acts.length>12)return;
  let total=0;const rooms=[];
  for(const act of d.acts){
   if(!act||!Array.isArray(act.rooms)||!act.rooms.length||act.rooms.length>10)return;
   for(const room of act.rooms){
    if(++total>48)return;
    const spawns=[];
    for(const wave of (Array.isArray(room.spawns)?room.spawns:[]).slice(0,100)){
     const type=String(wave?.type||'');const resolved=state.actors.has(mod.uid+':'+type)?mod.uid+':'+type:state.custom.has(mod.uid+':'+type)?mod.uid+':'+type:type;
     if(!BUILTIN.has(resolved)&&!state.actors.has(resolved)&&!state.custom.has(resolved))continue;
     const position=wave.position&&typeof wave.position==='object'?{x:safeNumber(wave.position.x,35,3500,300),y:safeNumber(wave.position.y,35,2400,200)}:null;
     spawns.push({at:safeNumber(wave.at,0,180,0),type:resolved,count:Math.floor(safeNumber(wave.count,1,20,1)),position});
    }
    spawns.sort((a,b)=>a.at-b.at);
    rooms.push({name:String(room.name||'UNNAMED ROOM').slice(0,60),actName:String(act.name||'CUSTOM ACT').slice(0,45),duration:safeNumber(room.duration,6,180,20),spawns});
   }
  }
  const id=mod.uid+':'+d.id;state.campaigns.set(id,{id,owner:mod.uid,name:String(d.name||d.id).slice(0,70),rooms});
  log('Playable campaign registered: '+String(d.name||d.id).slice(0,65));
 }
 function handleMessage(e){
  const msg=e.data;if(!msg||msg.channel!==CHANNEL||typeof msg.type!=='string')return;
  const mod=[...state.active.values()].find(v=>v.frame.contentWindow===e.source);
  if(!mod)return;
  if(msg.type==='boot'){send(mod,{type:'init',code:mod.code});return}
  if(msg.type==='meta'){
   const m=msg.data||{};mod.meta={id:String(m.id||mod.uid).slice(0,80),name:String(m.name||mod.filename).slice(0,70),version:String(m.version||'1.0').slice(0,30),description:String(m.description||'').slice(0,180)};
   const stored=getMod(mod.uid);if(stored){stored.name=mod.meta.name;save()};render();return;
  }
  if(msg.type==='ready'){mod.ready=true;log('Enabled '+(mod.meta?.name||mod.filename));send(mod,{type:'event',event:'mod:enabled',data:{}});render();return}
  if(msg.type==='error'){log('Mod error in '+(mod.meta?.name||mod.filename)+': '+String(msg.error||'Unknown error').slice(0,140));return}
  if(msg.type==='snapshot'){if(!Number.isInteger(msg.id))return;send(mod,{type:'snapshotResult',id:msg.id,data:state.game?.snapshot()||null});return}
  if(msg.type==='storage'){
   if(!Number.isInteger(msg.id)||msg.id<1||msg.id>1e9)return;
   const key=String(msg.key||'');const valid=/^[a-zA-Z0-9_.:-]{1,64}$/.test(key);
   const storeKey='echoRiftModDataV3:'+mod.uid;
   let data={};try{const loaded=JSON.parse(localStorage.getItem(storeKey)||'{}');if(loaded&&typeof loaded==='object'&&!Array.isArray(loaded))data=loaded}catch{}
   let result=null;
   if(msg.operation==='keys')result=Object.keys(data);
   else if(valid){
    if(msg.operation==='get')result=Object.hasOwn(data,key)?data[key]:null;
    else if(msg.operation==='remove'){delete data[key];try{localStorage.setItem(storeKey,JSON.stringify(data));result=true}catch{result=false}}
    else if(msg.operation==='set'){
     try{const encoded=JSON.stringify(msg.value);if(encoded!==undefined&&encoded.length<=8192){const next={...data,[key]:JSON.parse(encoded)};if(Object.keys(next).length<=64&&JSON.stringify(next).length<=32768){localStorage.setItem(storeKey,JSON.stringify(next));result=true}else result=false}else result=false}catch{result=false}
    }
   }
   send(mod,{type:'storageResult',id:msg.id,data:result});return;
  }
  if(msg.type==='command'){
   const now=performance.now();if(now-mod.lastWindow>1000){mod.lastWindow=now;mod.actions=0}
   if(++mod.actions>250)return; // per-mod flood prevention
   if(!msg.data||typeof msg.data!=='object'||Array.isArray(msg.data))return;
   if(JSON.stringify(msg.data).length>12000)return;
   const d=msg.data;
   if(msg.action==='hudSet'){
    if(!ident(d.id))return;
    const owned=mod.uid+':'+d.id;
    if(state.hud.size>=24&&!state.hud.has(owned))return;
    state.hud.set(owned,{label:String(d.label||'').slice(0,40),value:String(d.value??'').slice(0,60),color:safeColor(d.color)});
    renderHud();return;
   }
   if(msg.action==='hudRemove'){state.hud.delete(mod.uid+':'+d.id);renderHud();return}
   if(msg.action==='tone'){
    state.game?.apply('tone',d,mod.uid);return;
   }
   if(msg.action==='menuButton'){
    if(!ident(d.id))return;const entry={owner:mod.uid,id:d.id,label:String(d.label||d.id).slice(0,55),description:String(d.description||'').slice(0,90)};
    if(state.menuButtons.size>=24&&!state.menuButtons.has(mod.uid+':'+d.id))return;
    state.menuButtons.set(mod.uid+':'+d.id,entry);renderMenuButtons();return;
   }
   if(msg.action==='menuRemove'){state.menuButtons.delete(mod.uid+':'+d.id);renderMenuButtons();return}
   if(msg.action==='uiOpen'){openView(mod,d);return}
   if(msg.action==='uiClose'){if(state.view?.uid===mod.uid)closeView();return}
   // Declarative artwork is validated before reaching the canvas host. No callbacks or SVG/HTML.
   function safeActorSprite(raw){
    if(!raw||typeof raw!=='object'||!Array.isArray(raw.parts))return null;
    const parts=[];
    for(const p of raw.parts.slice(0,24)){
     if(!p||typeof p!=='object'||!['polygon','circle','rect','line'].includes(p.kind))continue;
     parts.push({kind:p.kind,x:safeNumber(p.x,-2.5,2.5,0),y:safeNumber(p.y,-2.5,2.5,0),
      x2:safeNumber(p.x2,-2.5,2.5,0),y2:safeNumber(p.y2,-2.5,2.5,0),
      radius:safeNumber(p.radius,.02,2.5,.65),w:safeNumber(p.w,.02,5,1),h:safeNumber(p.h,.02,5,1),
      sides:Math.floor(safeNumber(p.sides,3,16,6)),angle:safeNumber(p.angle,-6.29,6.29,0),
      spin:safeNumber(p.spin,-8,8,0),fill:p.fill===false?false:true,
      color:safeColor(p.color),stroke:p.stroke===false?false:true,
      lineWidth:safeNumber(p.lineWidth,.3,8,1.6),opacity:safeNumber(p.opacity,.1,1,1)});
    }
    return parts.length?{parts,rotation:['static','spin','face-player','face-motion'].includes(raw.rotation)?raw.rotation:'static',spin:safeNumber(raw.spin,-6,6,0)}:null;
   }
   if(msg.action==='defineActor'){
    if(!ident(d.id))return;const id=mod.uid+':'+d.id;
    if(state.actors.size>=36&&!state.actors.has(id))return;
    state.actors.set(id,{id,owner:mod.uid,name:String(d.name||d.id).slice(0,55),color:safeColor(d.color),hp:safeNumber(d.hp,5,2000,80),speed:safeNumber(d.speed,0,700,150),radius:safeNumber(d.radius,8,75,20),score:safeNumber(d.score,0,5000,200),boss:!!d.boss,sides:Math.floor(safeNumber(d.sides,3,12,6)),sprite:safeActorSprite(d.sprite)});
    log('Scripted actor registered: '+d.id);return;
   }
   if(msg.action==='defineCampaign'){registerCampaign(mod,d);return}
   if(msg.action==='playCampaign'){
    if(!isMenu()||state.open)return;
    const campaign=state.campaigns.get(mod.uid+':'+d.id);if(!campaign)return;
    if(state.view?.uid===mod.uid)closeView();
    state.game?.startCampaign(campaign);return;
   }
   if(msg.action==='steerActor'){
    state.game?.apply(msg.action,d,mod.uid);return;
   }
   if(msg.action==='defineEnemy'){
    const id=String(d.id||'');if(!/^[\w-]{1,32}$/.test(id)||!BUILTIN.has(d.base))return;
    state.custom.set(mod.uid+':'+id,{id:mod.uid+':'+id,name:String(d.name||id).slice(0,50),base:d.base,color:safeColor(d.color),hpScale:safeNumber(d.hpScale,.25,5,1),speedScale:safeNumber(d.speedScale,.25,3,1),radiusScale:safeNumber(d.radiusScale,.6,1.8,1),spawnChance:safeNumber(d.spawnChance,0,.25,0)});
    log('Enemy variant registered: '+id);return;
   }
   if(msg.action==='defineUpgrade'){
    const id=String(d.id||''),tag=String(d.tag||'CIRCUIT').toUpperCase(),rarity=String(d.rarity||'COMMON').toUpperCase();
    if(!/^[\w-]{1,32}$/.test(id)||!['BALLISTICS','KINETIC','CIRCUIT','TEMPORAL'].includes(tag))return;
    if(!['COMMON','RARE','PROTOTYPE'].includes(rarity))return;
    const effect=d.effects&&typeof d.effects==='object'?d.effects:{};
    state.upgrades.set(mod.uid+':'+id,{
     id:mod.uid+':'+id,name:String(d.name||id).slice(0,55),desc:String(d.description||'Community upgrade').slice(0,180),
     symbol:String(d.symbol||'◇').slice(0,6),tag,rarity,max:Math.floor(safeNumber(d.max,1,3,1)),
     effects:{damage:safeNumber(effect.damage,.7,1.5,1),speed:safeNumber(effect.speed,.7,1.5,1),fireRate:safeNumber(effect.fireRate,.7,1.5,1),heal:safeNumber(effect.heal,0,40,0)}
    });
    log('Upgrade registered: '+id);return;
   }
   if(msg.action==='spawnEnemy'){
    const type=String(d.type||'');d.type=state.actors.has(mod.uid+':'+type)||state.custom.has(mod.uid+':'+type)?mod.uid+':'+type:type;
   }
   if(state.game?.apply)try{state.game.apply(msg.action,d,mod.uid)}catch(err){log('Command failed: '+String(err.message||err).slice(0,90))}
  }
 }
 function emit(event,data={}){
  if(!state.active.size)return;
  for(const mod of state.active.values())if(mod.ready)send(mod,{type:'event',event,data});
 }
 function enemyDefinition(id){return state.custom.get(id)||null}
 function actorDefinition(id){return state.actors.get(id)||null}
 function upgradeDefinitions(){return [...state.upgrades.values()]}
 function rollEnemy(){
  if(!state.custom.size)return null;
  for(const spec of state.custom.values())if(spec.spawnChance&&Math.random()<spec.spawnChance)return spec.id;
  return null;
 }
 const api=Object.freeze({
  version:'3.1.0',connect(game){state.game=game},emit,enemyDefinition,actorDefinition,rollEnemy,upgradeDefinitions,campaignDefinition(id){return state.campaigns.get(id)||null},
  // Read-only control-plane diagnostics for QA and support.
  status(){return {enabled:state.active.size,installed:state.stored.length,customEnemies:state.custom.size,customUpgrades:state.upgrades.size,actors:state.actors.size,campaigns:state.campaigns.size,buttons:state.menuButtons.size,viewOpen:!!state.view,open:state.open||!!state.view}},
  open(){openPanel()}
 });
 Object.defineProperty(window,'EchoRiftMods',{value:api,configurable:false,writable:false});
 window.addEventListener('message',handleMessage);
 state.stored=getStore();
 function openPanel(){
  if(!isMenu()||!allClear())return;
  state.open=true;document.getElementById('riftModsOverlay').classList.remove('hidden');render();document.getElementById('riftModsClose').focus();
 }
 function closePanel(){
  state.open=false;document.getElementById('riftModsOverlay').classList.add('hidden');document.getElementById('riftModLauncher').focus();
 }
 function refreshLauncher(){
  const menu=document.getElementById('menu');const launcher=document.getElementById('riftModLauncher');
  launcher.classList.toggle('hidden',menu.classList.contains('hidden'));
  renderHud();
  if(menu.classList.contains('hidden')&&state.open)closePanel();
 }
 function downloadText(filename,text,mime='text/plain'){
  const object=URL.createObjectURL(new Blob([text],{type:mime}));
  const a=document.createElement('a');a.href=object;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),3000);
 }
 async function importFiles(files){
  for(const file of [...files]){
   if(!/\.js$/i.test(file.name)){log('Only .js files can be installed: '+file.name);continue}
   if(file.size>MAX_BYTES){log(file.name+' exceeds the 240 KB mod size limit.');continue}
   if(state.stored.length>=MAX_MODS){log('Maximum of '+MAX_MODS+' installed mods.');break}
   const code=await file.text();
   if(!code.trim()){log(file.name+' is empty.');continue}
   const mod={uid:toId(),filename:file.name,name:file.name,code};
   state.stored.push(mod);save();log('Installed '+file.name+' — click ENABLE to run it.');render();
  }
 }
 // FULL ENGINE LAB: inject editable JavaScript into a complete, separately sandboxed
 // copy of REQUIEM. It has a fresh opaque origin and no website storage or network.
 let labFrame=null,labCode='',labFilename='';
 function closeLab(){
  document.getElementById('riftEngineLab')?.classList.add('hidden');
  if(labFrame){labFrame.remove();labFrame=null}
  document.getElementById('riftEngineLabFrames')?.replaceChildren();
 }
 function openLab(){
  if(!isMenu())return;
  if(state.open)closePanel();
  const target=document.getElementById('riftEngineLab');target.classList.remove('hidden');
  document.getElementById('riftEngineLabStatus').textContent=labFilename?'READY: '+labFilename:'SELECT A .JS ENGINE PATCH TO LAUNCH';
  document.getElementById('riftEngineLabClose').focus();
 }
 function base64Utf8(str){
  const bytes=new TextEncoder().encode(str);let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
 }
 function startLab(){
  if(!labCode){document.getElementById('riftEngineLabStatus').textContent='IMPORT A .JS PATCH FIRST';return}
  if(labFrame){labFrame.remove();labFrame=null}
  // Work from the running game markup, not a network URL. The external API is
  // deliberately stripped; this is an independent copy of the ORIGINAL engine.
  const clone=document.documentElement.cloneNode(true);
  clone.querySelector('script[src="echo_rift_mod_api.js"]')?.remove();
  for(const el of clone.querySelectorAll('#riftModsOverlay,#riftModView,#riftModLauncher,#riftEngineLab,#riftModHud,#riftCommunityButtons'))el.remove();
  for(const el of clone.querySelectorAll('script'))if(el!==clone.querySelector('script:last-of-type')&&el.getAttribute('src'))el.remove();
  const scripts=[...clone.querySelectorAll('script')];
  const engine=scripts.find(el=>el.textContent.slice(0,750).includes("const canvas=document.getElementById('game')"));
  if(!engine){document.getElementById('riftEngineLabStatus').textContent='ERROR: GAME ENGINE SOURCE NOT FOUND';return}
  const source=engine.textContent;
  const end=source.lastIndexOf('})();');
  if(end<0){document.getElementById('riftEngineLabStatus').textContent='ERROR: GAME ENGINE ENTRY NOT FOUND';return}
  // Execute within the existing IIFE lexical scope. Mods can replace functions,
  // change rules, subscribe to game state, and draw on the ORIGINAL canvas.
  // The code never runs in the actual website's browsing context.
  const patch="\ntry { (0,()=>{})(); eval(new TextDecoder().decode(Uint8Array.from(atob('"+base64Utf8(labCode)+"'),c=>c.charCodeAt(0)))); } catch (e) { console.error('[ENGINE LAB PATCH]',e); const n=document.createElement('pre');n.textContent='ENGINE PATCH ERROR: '+String(e);n.style.cssText='position:fixed;top:10px;left:10px;right:10px;z-index:99999;padding:15px;background:#280d19;color:#ffb4c8;white-space:pre-wrap';document.body.append(n); }\n";
  engine.textContent=source.slice(0,end)+patch+source.slice(end);
  // Restrict sandbox execution: no external requests, forms, workers, media URLs,
  // object/embed or outbound links. Inline code and eval work for patches.
  const csp=clone.ownerDocument.createElement('meta');csp.httpEquiv='Content-Security-Policy';
  csp.content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob: https:; style-src 'unsafe-inline' https:; img-src data: blob: https:; font-src data: blob: https:; media-src data: blob: https:; connect-src https:; frame-src 'none'; worker-src blob:; form-action 'none'; base-uri 'none'; object-src 'none'";
  clone.querySelector('head')?.prepend(csp);
  const frame=document.createElement('iframe');frame.sandbox='allow-scripts';
  frame.title='Isolated REQUIEM full-engine mod';frame.style.cssText='border:0;width:100%;height:100%;display:block;background:#080b16';
  labFrame=frame;document.getElementById('riftEngineLabFrames').append(frame);
  // srcdoc has an opaque unique origin due to sandbox without allow-same-origin.
  // Its DOM, globals, saves, cookies and cache are separate from the VPS site.
  frame.srcdoc='<!doctype html>\n'+clone.outerHTML;
  document.getElementById('riftEngineLabStatus').textContent='ISOLATED ENGINE RUNNING: '+labFilename+' · ISOLATED ORIGIN · HTTPS ASSETS ALLOWED';
  frame.focus();
 }
 function createUI(){
  const style=document.createElement('style');style.textContent=MOD_STYLE;document.head.appendChild(style);
  const hud=document.createElement('div');hud.id='riftModHud';hud.hidden=true;document.body.appendChild(hud);
  const launcher=document.createElement('button');launcher.id='riftModLauncher';launcher.type='button';launcher.textContent='◈ MODS';launcher.setAttribute('aria-label','Open REQUIEM mod manager');launcher.addEventListener('click',openPanel);document.body.appendChild(launcher);
  const overlay=document.createElement('div');overlay.id='riftModsOverlay';overlay.className='hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','REQUIEM Mod Manager');
  overlay.innerHTML=`<div class="riftModsShell"><header class="riftModsHeader"><div><span class="riftModsEyebrow">COMMUNITY INTERFACE // API v3.1</span><h2>MOD<span>//</span>RIFT.</h2><p>Extend the arena without editing the main game.</p></div><button id="riftModsClose" type="button" class="riftModButton">✕ CLOSE</button></header><div class="riftModsTools"><label class="riftUpload" for="riftModFiles">+ INSTALL .JS MODS</label><input type="file" id="riftModFiles" accept=".js,text/javascript,application/javascript" multiple hidden><button type="button" id="riftModDocs" class="riftModButton">↓ DOCUMENTATION .MD</button><button type="button" id="riftModExample" class="riftModButton">↓ EXAMPLE MOD .JS</button></div><div class="riftModsNote">Imported JavaScript runs inside an isolated sandbox. It can control game features through the mod API, but cannot directly access your website or saves. Only enable mods you trust. Saved mods must be enabled again after a page refresh.</div><div class="riftModsBar"><strong>INSTALLED MODULES</strong><span id="riftModCount">0 ENABLED / 0 INSTALLED</span></div><div id="riftModList"></div><footer id="riftModLog" role="status" aria-live="polite">AWAITING COMMUNITY MODULES.</footer></div>`;
  document.body.appendChild(overlay);
  const labButton=document.createElement('button');labButton.type='button';labButton.id='riftEngineLabOpen';labButton.className='riftModButton';labButton.textContent='⚙ FULL ENGINE MODE';labButton.style.cssText='margin:12px 22px 0;padding:12px 18px;';
  labButton.addEventListener('click',openLab);
  overlay.querySelector('.riftModsTools')?.append(labButton);
  const lab=document.createElement('div');lab.id='riftEngineLab';lab.className='hidden';
  lab.style.cssText='position:fixed;inset:0;z-index:1200;background:#050a14;display:flex;flex-direction:column;color:#dcf8ff;font:12px ui-monospace,monospace';
  lab.innerHTML='<div style="padding:12px 16px;border-bottom:1px solid #457184;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><strong style="letter-spacing:2px;color:#aeebff">FULL ENGINE MODE // ISOLATED</strong><label for="riftEnginePatch" style="cursor:pointer;border:1px solid #67899b;padding:9px">+ IMPORT .JS PATCH</label><input id="riftEnginePatch" type="file" accept=".js,text/javascript" hidden><button id="riftEngineLaunch" type="button" class="riftModButton">▶ LAUNCH MODDED GAME</button><span id="riftEngineLabStatus" style="flex:1;color:#90bfd0">SELECT A PATCH</span><button id="riftEngineLabClose" type="button" class="riftModButton">✕ EXIT LAB</button></div><div id="riftEngineLabFrames" style="flex:1;min-height:0"></div><div style="padding:7px 14px;color:#92adc0;border-top:1px solid #233847">Mods run inside a separate, temporary copy of REQUIEM. Changes do not affect the live website, vanilla run or saves. Reloading the lab discards that copy.</div>';
  document.body.appendChild(lab);
  const labStyle=document.createElement('style');labStyle.textContent='#riftEngineLab.hidden{display:none!important}#riftEngineLab button{cursor:pointer}';document.head.append(labStyle);
  document.getElementById('riftEngineLabClose').addEventListener('click',closeLab);
  document.getElementById('riftEngineLaunch').addEventListener('click',startLab);
  document.getElementById('riftEnginePatch').addEventListener('change',async event=>{const f=event.target.files?.[0];if(!f)return;if(!/\.js$/i.test(f.name)||f.size>2000000){document.getElementById('riftEngineLabStatus').textContent='ONLY .JS PATCHES UP TO 2MB';return}labCode=await f.text();labFilename=f.name;document.getElementById('riftEngineLabStatus').textContent='READY: '+labFilename;event.target.value=''});

  const menuButtons=document.createElement('div');menuButtons.id='riftCommunityButtons';menuButtons.hidden=true;
  document.querySelector('#menu .menuActions')?.after(menuButtons);
  const view=document.createElement('div');view.id='riftModView';view.className='hidden';view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');
  view.innerHTML='<div class="riftModViewShell"><header><span id="riftModViewTitle">COMMUNITY SCREEN</span><button id="riftModViewClose" class="riftModButton" type="button">✕ CLOSE</button></header><div id="riftModViewBody"></div></div>';
  document.body.appendChild(view);
  document.getElementById('riftModViewClose').addEventListener('click',closeView);
  view.addEventListener('pointerdown',e=>{if(e.target===view)closeView()});
  renderMenuButtons();
  overlay.addEventListener('pointerdown' ,e=>{if(e.target===overlay)closePanel()});
  overlay.addEventListener('keydown',e=>{
   e.stopImmediatePropagation();
   if(e.key==='Escape'){e.preventDefault();closePanel()}
   if(e.key==='Tab'){
    const items=[...overlay.querySelectorAll('button,input,label')].filter(el=>el.getClientRects().length&&el.tagName!=='LABEL');
    if(!items.length)return;
    const index=items.indexOf(document.activeElement);
    if(e.shiftKey&&index<=0){e.preventDefault();items[items.length-1].focus()}
    else if(!e.shiftKey&&index===items.length-1){e.preventDefault();items[0].focus()}
   }
  },true);
  document.getElementById('riftModsClose').addEventListener('click',closePanel);
  const fileInput=document.getElementById('riftModFiles');fileInput.addEventListener('change',async()=>{await importFiles(fileInput.files);fileInput.value=''});
  document.getElementById('riftModDocs').addEventListener('click',()=>downloadText('echo_rift_modding_guide.md',MOD_DOCUMENTATION,'text/markdown'));
  document.getElementById('riftModExample').addEventListener('click',()=>downloadText('example_requiem_mod.js',MOD_EXAMPLE,'text/javascript'));
  new MutationObserver(refreshLauncher).observe(document.getElementById('menu'),{attributes:true,attributeFilter:['class']});refreshLauncher();render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createUI,{once:true});else createUI();
})();

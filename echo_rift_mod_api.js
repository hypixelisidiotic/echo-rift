/*
 * ECHO//RIFT: REQUIEM // Public Mod API v1.0
 * Separate, versioned mod service. The main game only connects event hooks
 * and a narrowly scoped command dispatcher. Mods run in opaque-origin frames.
 *
 * DO NOT EDIT core owner-controlled source without permission. This API is
 * deliberately open for third-party mod files through documented hooks.
 */
(() => {
 'use strict';
 if(window.EchoRiftMods)return;
 const SANDBOX_DOCUMENT="<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; style-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'\"></head><body><script>/* Runs ONLY inside a sandboxed, opaque-origin mod frame. */\n(() => {\n 'use strict';\n const CHANNEL='ECHO_RIFT_MOD_V1';\n const subscriptions=new Map(),pending=new Map();\n let initialized=false,seq=0;\n const send=(type,payload={})=>parent.postMessage({channel:CHANNEL,type,...payload},'*');\n const report=error=>send('error',{error:String(error?.stack||error).slice(0,400)});\n const API=Object.freeze({\n  version:'1.0.0',\n  register(meta){send('meta',{data:{id:String(meta?.id||'').slice(0,80),name:String(meta?.name||'').slice(0,70),version:String(meta?.version||'1.0').slice(0,30),description:String(meta?.description||'').slice(0,180)}})},\n  on(event,callback){if(typeof callback!=='function')throw new TypeError('Callback must be a function');let list=subscriptions.get(event);if(!list){list=new Set();subscriptions.set(event,list)}list.add(callback);return ()=>API.off(event,callback)},\n  once(event,callback){const off=API.on(event,p=>{off();callback(p)});return off},\n  off(event,callback){subscriptions.get(event)?.delete(callback)},\n  getState(){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});send('snapshot',{id})})},\n  toast(text,seconds=2){send('command',{action:'toast',data:{text,seconds}})},\n  heal(amount){send('command',{action:'heal',data:{amount}})},\n  addScore(points){send('command',{action:'score',data:{points}})},\n  spawnEnemy(type,options={}){send('command',{action:'spawnEnemy',data:{type,...options}})},\n  defineEnemy(options){send('command',{action:'defineEnemy',data:options})},\n  defineUpgrade(options){send('command',{action:'defineUpgrade',data:options})},\n  ring(options){send('command',{action:'ring',data:options})},\n  fire(options){send('command',{action:'fire',data:options})},\n  damageNearby(options){send('command',{action:'damageNearby',data:options})},\n  slowNearby(options){send('command',{action:'slowNearby',data:options})},\n  boost(options){send('command',{action:'boost',data:options})}\n });\n Object.defineProperty(window,'RequiemMod',{value:API,writable:false,configurable:false});\n window.addEventListener('error',e=>report(e.error||e.message));\n window.addEventListener('unhandledrejection',e=>report(e.reason));\n window.addEventListener('message',e=>{\n  if(e.source!==parent||!e.data||e.data.channel!==CHANNEL)return;\n  const msg=e.data;\n  if(msg.type==='init'&&!initialized){\n   initialized=true;\n   try{\n    const script=document.createElement('script');\n    script.textContent=msg.code;\n    document.head.appendChild(script);\n    send('ready');\n   }catch(err){report(err)}\n  }else if(msg.type==='event'){\n   for(const cb of [...(subscriptions.get(msg.event)||[])]){\n    try{cb(msg.data)}catch(err){report(err)}\n   }\n  }else if(msg.type==='snapshotResult'){\n   const request=pending.get(msg.id);\n   if(request){pending.delete(msg.id);request.resolve(msg.data)}\n  }\n });\n send('boot');\n})();\n</script></body></html>";
 const MOD_STYLE="#riftModLauncher{position:fixed;bottom:19px;right:22px;z-index:37;padding:11px 17px;border:1px solid #90e6ff98;background:#0e2b40e8;color:#d7fbff;font:800 11px ui-monospace,monospace;letter-spacing:.14em;box-shadow:0 0 24px #2ecbef25;transition:border-color .15s,transform .15s;cursor:pointer}\n#riftModLauncher:hover{border-color:#c1ffff;transform:translateY(-2px)}#riftModLauncher.hidden,#riftModsOverlay.hidden{display:none!important}\n#riftModsOverlay{position:fixed;inset:0;z-index:65;display:flex;align-items:center;justify-content:center;background:#030917f0;backdrop-filter:blur(12px);padding:clamp(10px,4vw,33px);color:#e9f8ff;font-family:Inter,system-ui,sans-serif}\n.riftModsShell{display:flex;flex-direction:column;width:min(800px,100%);max-height:min(92dvh,840px);min-height:300px;border:1px solid #7bcce277;background:linear-gradient(145deg,#152a3c,#071221 80%);box-shadow:0 22px 80px #000b,inset 0 1px #ffffff12;overflow:hidden}\n.riftModsHeader{display:flex;justify-content:space-between;gap:20px;align-items:start;padding:25px 27px 19px;border-bottom:1px solid #6eb8d833}.riftModsEyebrow{color:#8ecde1;font:800 10px ui-monospace,monospace;letter-spacing:.16em}.riftModsHeader h2{margin:8px 0;font-size:clamp(30px,6vw,49px);letter-spacing:-.055em;line-height:.95}.riftModsHeader h2 span{color:#80eeff}.riftModsHeader p{color:#91adc1;font-size:12px;margin:8px 0 0}\n.riftModsTools{display:flex;gap:9px;padding:20px 27px 11px;flex-wrap:wrap}.riftUpload,.riftModButton{display:inline-flex;align-items:center;justify-content:center;border:1px solid #527d94;background:#143149;color:#d4f7ff;cursor:pointer;font:800 10px ui-monospace,monospace;letter-spacing:.065em;padding:11px 13px;min-height:40px;text-align:center}.riftUpload{border-color:#9be8fb;color:#091825;background:#acf3ff}.riftUpload:hover,.riftModButton:hover{filter:brightness(1.17)}.riftModButton.active{border-color:#8be9c0;background:#1b554c}.riftModButton.danger{border-color:#684d62;color:#e3b7c7;background:#291b2b}\n.riftModsNote{padding:0 27px 18px;color:#91aabc;font:11px/1.65 ui-monospace,monospace}.riftModsBar{border-top:1px solid #537b933d;border-bottom:1px solid #537b933d;background:#0c2233;display:flex;justify-content:space-between;padding:12px 27px;gap:10px;font:800 10px ui-monospace,monospace;letter-spacing:.08em;color:#b8deed}.riftModsBar span{color:#8ba8b8}\n#riftModList{min-height:60px;overflow:auto;scrollbar-color:#477f91 transparent;max-height:46dvh}.riftEmpty{padding:35px 25px;color:#668ba1;text-align:center;font:11px ui-monospace,monospace}.riftModRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 27px;border-bottom:1px solid #52799240}.riftModInfo{display:flex;flex-direction:column;gap:5px;min-width:0}.riftModInfo strong{font-size:15px;overflow:hidden;text-overflow:ellipsis}.riftModInfo span{font:10px ui-monospace,monospace;color:#91cbdd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.riftModInfo small{color:#8aa2b6;font-size:11px}.riftModActions{display:flex;gap:6px;flex-shrink:0}#riftModLog{padding:13px 27px;background:#081727;border-top:1px solid #4f768a46;color:#88b6c9;font:10px ui-monospace,monospace;min-height:39px;overflow:hidden;text-overflow:ellipsis}\n@media(max-width:600px){#riftModLauncher{right:12px;bottom:10px}.riftModsHeader{padding:18px 15px 12px}.riftModsHeader p{font-size:10px}.riftModsTools{padding:13px 15px 10px}.riftModsNote{padding:0 15px 12px;font-size:10px}.riftModsBar{padding:12px 15px;font-size:9px}.riftModRow{padding:11px 15px;align-items:start;flex-direction:column}.riftModActions{align-self:flex-end}.riftModsHeader h2{font-size:31px}#riftModLog{padding:11px 15px}}\n";
 const MOD_DOCUMENTATION="# ECHO//RIFT: REQUIEM — Modding API\n\n**Mod API version:** 1.0 (experimental)  \n**Format:** a standalone `.js` file  \n**Load:** main menu → **MODS** → **INSTALL .JS** → **ENABLE**  \n**No external packages or build tools required.**\n\n## Before you start\n\nMods are optional and never run automatically when the page loads. Installed source is stored locally in your browser; enable it again after refreshing. Save files, Wordle progress and the unmodified campaign all remain usable without mods. Remove or disable mods from the manager if a run behaves unexpectedly.\n\n**Security model:** Mod code executes in a hidden, sandboxed iframe with a unique opaque origin. It cannot directly read the host game's DOM, cookies, localStorage, or internal game variables. It sees only the information provided in API events and state snapshots, and can issue only supported commands. The sandbox is not a guarantee against malicious scripts: malicious mods can consume CPU, and external messaging or network behaviour may differ between browsers. Only install files from people you trust. A mod that misbehaves can be disabled, but save changes it made to gameplay results are not automatically undone. Keep a copy of your game and source.\n\nAll APIs described below are available through the **`RequiemMod`** global *inside your mod file*. They are **not** attached to the game page's `window` and you cannot access the game engine's private variables directly.\n\n## 1. Your first mod\n\nSave the following as `first_mod.js`:\n\n```js\nRequiemMod.register({\n  id: 'ham.first-mod',\n  name: 'First Mod',\n  version: '1.0.0',\n  description: 'A small starter mod.'\n});\n\nRequiemMod.on('run:start', () => {\n  RequiemMod.toast('FIRST MOD IS ACTIVE!', 3);\n});\n\nRequiemMod.on('enemy:kill', (enemy) => {\n  // One extra point per enemy destroyed.\n  RequiemMod.addScore(1);\n});\n```\n\nOpen REQUIEM's main menu. Click **MODS** in the bottom-right corner, import `first_mod.js`, click **ENABLE**, and start a run. The mod's name and status appear in the panel.\n\n## 2. Lifecycle and events\n\n| Event | When it fires | Event payload |\n| --- | --- | --- |\n| `mod:enabled` | This mod has started | `{}` |\n| `run:start` | A new normal run begins | `{cycle, difficulty}` |\n| `room:start` | An encounter starts or resumes | `{cycle, act, bossRoom}` |\n| `room:clear` | Advance from a completed encounter | `{cycle, act}` |\n| `enemy:spawn` | A hostile appears | `{id, type, baseType, x, y, hp}` |\n| `enemy:kill` | A hostile is destroyed | `{id, type, baseType, x, y, value}` |\n| `player:damage` | The player takes a successful hit | `{damage, health, maxHealth}` |\n| `player:shoot` | Player fires a volley | `{x, y, angle}` |\n| `upgrade:chosen` | An upgrade is installed | `{id, name}` |\n| `boss:start` | A Warden fight begins | `{act, hp, maxHp}` |\n| `boss:phase` | A Warden changes phase | `{act, phase, healthFraction}` |\n| `boss:defeated` | A Warden is defeated | `{act}` |\n| `run:end` | The run ends | `{won, score, cycle}` |\n| `tick` | At most five times per second during combat | `{dt, elapsed, cycle}` |\n\nNote: after selecting an upgrade, some encounters resume without a new `room:start` event. For room progression use `room:start`; for new run state use `run:start`.\n\nSubscribe with:\n\n```js\nfunction onKill(enemy) { RequiemMod.toast('Destroyed ' + enemy.type, 1); }\nRequiemMod.on('enemy:kill', onKill);\nRequiemMod.once('boss:start', (boss) => RequiemMod.toast('WARDEN!', 2));\nRequiemMod.off('enemy:kill', onKill);\n```\n\nOnly JSON-compatible data is delivered; do not expect game objects, functions or mutable references. Event handlers should finish quickly to keep gameplay responsive.\n\n## 3. Reading the game\n\n`RequiemMod.getState()` returns a Promise with a read-only snapshot:\n\n```js\nRequiemMod.getState().then((s) => {\n  // s.state: 'menu', 'playing', 'paused', etc.\n  // s.cycle, s.act, s.difficulty, s.score, s.kills\n  // s.width, s.height (game-world units)\n  // s.player: {x, y, hp, maxHp, damage, speed, fireRate, res}\n  // s.boss: null or {act, x, y, hp, maxHp, phase}\n  // s.enemies: array of {id, type, baseType, x, y, hp, maxHp}\n  console.log(s);\n});\n```\n\nSnapshots describe the game when the request is handled, not necessarily the exact frame where you requested them. If you need periodic information, use `tick` with `getState()` sparingly.\n\n## 4. Supported gameplay actions\n\nCommands are **asynchronous fire-and-forget**, applied in the game loop when received. They are rate-limited and validated; excessive or invalid commands may be ignored.\n\n```js\nRequiemMod.toast('NEW SIGNAL', 2.5);         // short HUD notification\nRequiemMod.addScore(100);                    // add nonnegative score\nRequiemMod.heal(8);                          // heal up to max health\nRequiemMod.spawnEnemy('charger');            // spawns at a safe arena edge\nRequiemMod.spawnEnemy('wisp', {x:250, y:100}); // optional approximate position\nRequiemMod.ring({x:250,y:200,color:'#ff77aa',radius:12,end:90,life:.45});\nRequiemMod.fire({team:'hostile',x:200,y:100,angle:1.2,speed:230,count:3,spread:.2});\nRequiemMod.fire({team:'player',x:200,y:100,angle:1.2,speed:640,damage:5});\nRequiemMod.damageNearby({x:250,y:200,radius:110,damage:15});\nRequiemMod.slowNearby({x:250,y:200,radius:140,seconds:2});\nRequiemMod.boost({damage:1.1,speed:1.08,fireRate:0.95});\n```\n\n`boost` multipliers apply to current player stats: `damage > 1` increases damage, `speed > 1` increases movement speed, and `fireRate < 1` makes firing faster. These multipliers are deliberately clamped to prevent invalid physics. Player bonuses reset on a new run; reapply them on `run:start` if needed.\n\nThe `fire` command creates ordinary game projectiles using the supplied position (with bounded damage, count, speed, and radius); no bypass of invulnerability or collision rules is provided. `spawnEnemy` is limited to active gameplay and a total active hostile cap. Enemy types available by default: `wisp`, `shooter`, `charger`, `bulwark`, `splitter`, `sniper`, `weaver`, `spinner`, `corsair`, `obelisk`, `interceptor`, `needle`, `prism`, `vesper`.\n\n## 5. Defining a custom enemy variant\n\nYou can register a unique enemy with different stats and sprite colour while reusing an existing built-in AI and underlying procedural hull. It can spawn explicitly or join normal room spawn pools. **Fully bespoke AI scripts, new shaders, sprite image imports and custom boss replacements are not supported in API v1.**\n\n```js\nRequiemMod.register({id:'ham.neon-hunter',name:'Neon Hunter',version:'1.0'});\n\nRequiemMod.defineEnemy({\n  id: 'hunter',                // ID local to THIS mod\n  base: 'charger',            // built-in movement / attack AI\n  name: 'Neon Hunter',\n  color: '#8bffea',           // procedural hull tint\n  hpScale: 1.35,             // 0.25..5\n  speedScale: 1.20,          // 0.25..3\n  radiusScale: 1.05,         // 0.6..1.8\n  spawnChance: 0.07         // 0..0.25 chance in ordinary rooms\n});\n\nRequiemMod.on('run:start', () => {\n  RequiemMod.toast('Neon Hunters have arrived', 3);\n});\n\nRequiemMod.on('enemy:kill', (e) => {\n  if (e.type.endsWith(':hunter')) RequiemMod.addScore(15);\n});\n```\n\nCall `RequiemMod.spawnEnemy('hunter')` to spawn your custom type. The public event `type` is namespaced as `<installed-mod-id>:hunter`, while `baseType` remains `charger`. Spawn pools still respect normal enemy population limits. In the Hostile Index, kills count towards the underlying built-in enemy rather than creating new codex records.\n\nThe game does not synchronize game scores, installed mods or metadata to a server. A modded score is not proof of unmodified play.\n\n## 6. Adding custom upgrade cards\n\nMods can add upgrade cards directly into the ordinary Acts I–III draft pool. You supply metadata and bounded effects; the core game renders the card and applies the effects. Custom cards are deliberately omitted from the inherited-legacy upgrade pool for now, and do not appear during Act IV severance.\n\n```js\nRequiemMod.defineUpgrade({\n  id: 'neon-accelerator',            // unique within this mod\n  name: 'NEON ACCELERATOR',\n  symbol: '✧',\n  description: '+12% movement speed and +8% projectile damage.',\n  tag: 'KINETIC',                   // BALLISTICS | KINETIC | CIRCUIT | TEMPORAL\n  rarity: 'RARE',                   // COMMON | RARE | PROTOTYPE\n  max: 2,                          // maximum ranks (1 to 3)\n  effects: {\n    damage: 1.08,                  // multiplier 0.7..1.5\n    speed: 1.12,                   // multiplier 0.7..1.5\n    fireRate: 1,                   // multiplier 0.7..1.5 (lower is faster)\n    heal: 0                        // hull restored on pick (0 to 40)\n  }\n});\n\nRequiemMod.on('upgrade:chosen', u => {\n  // Community upgrade IDs are namespaced with an installation-specific ID.\n  if (u.name === 'NEON ACCELERATOR') RequiemMod.toast('ACCELERATOR ENGAGED', 2);\n});\n```\n\nEach card is only a single upgrade selection: effects are applied once per rank when chosen and automatically reset when a new pilot begins. Card names, symbols and descriptions are sanitized before being rendered. Because this is a sandboxed, declarative interface, cards cannot provide arbitrary synchronous `apply()` functions; for extra behaviour, listen to the existing `upgrade:chosen` event.\n\n## 7. Example: a new difficulty mutator\n\n```js\nRequiemMod.register({\n  id:'example.double-trouble', name:'Double Trouble', version:'1.0.0',\n  description:'Every sixth normal kill spawns a charger.'\n});\nlet normalKills = 0;\nRequiemMod.on('run:start', () => { normalKills = 0; });\nRequiemMod.on('enemy:kill', (e) => {\n  if (e.baseType === 'charger') return;\n  if (++normalKills % 6 === 0) {\n    RequiemMod.spawnEnemy('charger', {x:e.x, y:e.y});\n    RequiemMod.ring({x:e.x,y:e.y,color:'#ff7788',radius:10,end:85,life:.5});\n  }\n});\n```\n\n## 8. Common pitfalls\n\n- **Nothing happens:** Importing a file does not mean it has been enabled; check the mod manager for its status. Mods enabled while on the main menu will receive future run events.\n- **The mod shows an error:** Open browser developer tools. The mod manager shows script/load errors when the sandbox reports them.\n- **Your mod references `window.player` or `document.getElementById('game')`:** The sandbox intentionally isolates that; use `getState()` and supported actions instead.\n- **Your API commands do nothing on the main menu:** Gameplay commands work only during an active run; metadata registration is allowed before entering gameplay.\n- **You refreshed and the mod is disabled:** Intentional. Saved mods require explicit enablement per page load.\n- **Update the API version:** Use `RequiemMod.version` to check the supported major release. v1 does not promise undocumented internals will be stable.\n- **Running with a GitHub loader:** Publish `echo_rift_requiem.html` AND `echo_rift_mod_api.js` at the repository root, and update the website's `index.html` GitHub loader to the compatible version once. The loader fetches both files. Local/offline builds require the files side by side. If the API file is absent, the main game should still run, but no mods button appears.\n\n## 9. Source-file convention\n\n```text\necho-rift/\n├── echo_rift_requiem.html       # game and engine bridge\n├── echo_rift_mod_api.js         # independent mod loader + sandbox + UI\n├── echo_rift_modding_guide.md   # this document\n└── example_requiem_mod.js       # optional reference mod\n```\n\nInstall the GitHub-compatible loader on your Apache server at `/var/www/html/game/index.html` **only once**. It downloads the game and its API module from your public GitHub `main` branch with cache-busting. GitHub itself remains the source of truth for later patches.\n\n## 10. Boundaries and compatibility\n\nThe API exists so modders can extend REQUIEM without changing its core source. It isn't a way to secretly install background scripts on other visitors: every player must import and explicitly enable mods in their own browser. A file selected on one machine doesn't automatically appear on another.\n\nThis is **v1.0**. The stable contract is the events, snapshots and commands described above. Other names in the game's source are private implementation details and may change. Contact the game maintainer when a new hook is needed.\n";
 const MOD_EXAMPLE="// ECHO//RIFT: REQUIEM // Example community mod\n// Install from the main menu MODS panel, then ENABLE it.\nRequiemMod.register({\n  id: 'example.neon-hunters',\n  name: 'Neon Hunters',\n  version: '1.0.0',\n  description: 'Adds an aqua hunter that sometimes replaces a normal room spawn.'\n});\nRequiemMod.defineEnemy({\n  id: 'hunter',\n  name: 'Neon Hunter',\n  base: 'charger',\n  color: '#8bffea',\n  hpScale: 1.3,\n  speedScale: 1.23,\n  radiusScale: 1,\n  spawnChance: 0.08\n});\n// Also contributes a new optional Kinetic upgrade to normal room drafts.\nRequiemMod.defineUpgrade({\n  id:'aqua-drive',name:'AQUA DRIVE',symbol:'✧',\n  description:'Faster movement and slightly stronger shots.',\n  tag:'KINETIC',rarity:'RARE',max:2,\n  effects:{speed:1.12,damage:1.07,fireRate:1,heal:0}\n});\nRequiemMod.on('run:start', () => {\n  RequiemMod.toast('NEON HUNTERS // TRANSMISSION ACTIVE', 2.8);\n});\nRequiemMod.on('enemy:kill', e => {\n  if (e.type.endsWith(':hunter')) {\n    RequiemMod.addScore(30);\n    RequiemMod.ring({x:e.x,y:e.y,color:'#8bffea',radius:9,end:80,life:0.38});\n  }\n});\n";
 const CHANNEL='ECHO_RIFT_MOD_V1',KEY='echoRiftCommunityModsV1',MAX_MODS=8,MAX_BYTES=240000;
 const BUILTIN=new Set('wisp shooter charger bulwark splitter sniper weaver spinner corsair obelisk interceptor needle prism vesper'.split(' '));
 const safeNumber=(x,min,max,def=min)=>Number.isFinite(Number(x))?Math.min(max,Math.max(min,Number(x))):def;
 const safeColor=s=>typeof s==='string'&&/^#[\da-fA-F]{6}$/.test(s)?s:'#a3f6ff';
 const state={stored:[],active:new Map(),custom:new Map(),upgrades:new Map(),game:null,open:false,logs:[]};
 const toId=()=>Math.random().toString(36).slice(2,11)+Date.now().toString(36).slice(-4);
 const log=(msg)=>{state.logs.push(msg);if(state.logs.length>25)state.logs.shift();const el=document.getElementById('riftModLog');if(el)el.textContent=msg;console.info('[REQUIEM Mods]',msg)};
 const getStore=()=>{try{const entries=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(entries))return entries.filter(v=>v&&typeof v.uid==='string'&&typeof v.code==='string'&&v.code.length<=MAX_BYTES).slice(0,MAX_MODS)}catch{}return []};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state.stored))}catch(e){log('Storage limit reached; installed mod list may not persist.')}};
 const getMod=uid=>state.stored.find(v=>v.uid===uid);
 const anyActive=()=>state.active.size>0;
 const isMenu=()=>state.game?.snapshot()?.state==='menu';
 const allClear=()=>document.getElementById('adminOverlay')?.classList.contains('hidden')&&document.getElementById('wordleOverlay')?.classList.contains('hidden')&&document.getElementById('codexOverlay')?.classList.contains('hidden');
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
 function disable(uid){
  const mod=state.active.get(uid);if(!mod)return;
  mod.frame.remove();state.active.delete(uid);
  for(const key of [...state.custom.keys()])if(key.startsWith(uid+':'))state.custom.delete(key);
  for(const key of [...state.upgrades.keys()])if(key.startsWith(uid+':'))state.upgrades.delete(key);
  log('Disabled '+(mod.meta?.name||mod.filename));render();
 }
 function removeMod(uid){disable(uid);state.stored=state.stored.filter(v=>v.uid!==uid);save();render();log('Removed mod.');}
 function enable(uid){
  if(!isMenu()){log('Mods may only be enabled from the main menu.');return}
  if(state.active.has(uid))return;
  const saved=getMod(uid);if(!saved)return;
  // An opaque-origin frame receives only serializable snapshots and whitelisted actions.
  const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.style.cssText='display:none!important';
  frame.srcdoc=SANDBOX_DOCUMENT;
  const mod={uid,frame,filename:saved.filename,code:saved.code,meta:null,lastWindow:performance.now(),actions:0,ready:false};
  state.active.set(uid,mod);document.body.appendChild(frame);
  log('Starting '+saved.filename+'…');render();
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
  if(msg.type==='command'){
   const now=performance.now();if(now-mod.lastWindow>1000){mod.lastWindow=now;mod.actions=0}
   if(++mod.actions>42)return; // per-mod flood prevention
   if(!msg.data||typeof msg.data!=='object'||Array.isArray(msg.data))return;
   if(JSON.stringify(msg.data).length>2000)return;
   const d=msg.data;
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
    const type=String(d.type||'');d.type=state.custom.has(mod.uid+':'+type)?mod.uid+':'+type:type;
   }
   if(state.game?.apply)try{state.game.apply(msg.action,d)}catch(err){log('Command failed: '+String(err.message||err).slice(0,90))}
  }
 }
 function emit(event,data={}){
  if(!state.active.size)return;
  for(const mod of state.active.values())if(mod.ready)send(mod,{type:'event',event,data});
 }
 function enemyDefinition(id){return state.custom.get(id)||null}
 function upgradeDefinitions(){return [...state.upgrades.values()]}
 function rollEnemy(){
  if(!state.custom.size)return null;
  for(const spec of state.custom.values())if(spec.spawnChance&&Math.random()<spec.spawnChance)return spec.id;
  return null;
 }
 const api=Object.freeze({
  version:'1.0.0',connect(game){state.game=game},emit,enemyDefinition,rollEnemy,upgradeDefinitions,
  // Read-only control-plane diagnostics for QA and support.
  status(){return {enabled:state.active.size,installed:state.stored.length,customEnemies:state.custom.size,customUpgrades:state.upgrades.size,open:state.open}},
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
 function createUI(){
  const style=document.createElement('style');style.textContent=MOD_STYLE;document.head.appendChild(style);
  const launcher=document.createElement('button');launcher.id='riftModLauncher';launcher.type='button';launcher.textContent='◈ MODS';launcher.setAttribute('aria-label','Open REQUIEM mod manager');launcher.addEventListener('click',openPanel);document.body.appendChild(launcher);
  const overlay=document.createElement('div');overlay.id='riftModsOverlay';overlay.className='hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','REQUIEM Mod Manager');
  overlay.innerHTML=`<div class="riftModsShell"><header class="riftModsHeader"><div><span class="riftModsEyebrow">COMMUNITY INTERFACE // API v1.0</span><h2>MOD<span>//</span>RIFT.</h2><p>Extend the arena without editing the main game.</p></div><button id="riftModsClose" type="button" class="riftModButton">✕ CLOSE</button></header><div class="riftModsTools"><label class="riftUpload" for="riftModFiles">+ INSTALL .JS MODS</label><input type="file" id="riftModFiles" accept=".js,text/javascript,application/javascript" multiple hidden><button type="button" id="riftModDocs" class="riftModButton">↓ DOCUMENTATION .MD</button><button type="button" id="riftModExample" class="riftModButton">↓ EXAMPLE MOD .JS</button></div><div class="riftModsNote">Imported JavaScript runs inside an isolated sandbox. It can control game features through the mod API, but cannot directly access your website or saves. Only enable mods you trust. Saved mods must be enabled again after a page refresh.</div><div class="riftModsBar"><strong>INSTALLED MODULES</strong><span id="riftModCount">0 ENABLED / 0 INSTALLED</span></div><div id="riftModList"></div><footer id="riftModLog" role="status" aria-live="polite">AWAITING COMMUNITY MODULES.</footer></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)closePanel()});
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

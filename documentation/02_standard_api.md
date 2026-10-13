# 02 · Standard API reference

REQUIEM developer manual · API 3.1 · generated against the supplied game build. Internal game functions are not stable public API.

The global `RequiemMod` exists **inside installed mod sandboxes**, not in the parent window. Unless stated otherwise, calls dispatch asynchronous commands. Avoid assuming an immediate side effect from a command; use event callbacks and state snapshots.

## Register and subscribe

```js
RequiemMod.register({id:'example.mod',name:'Example',version:'1.0.0'});
const unsubscribe=RequiemMod.on('simulation:tick', frame=>{});
RequiemMod.once('run:start',()=>{});
unsubscribe();
const state=await RequiemMod.getState();
```

## All exported capabilities

| Namespace | Methods | Purpose |
|---|---|---|
| Core | `register`, `on`, `once`, `off`, `getState` | Identity, lifecycle and observation |
| Game | `toast`, `heal`, `addScore`, `boost`, `teleport`, `ring`, `fire`, `hazard`, `draw` | Combat/UI/gameplay actions |
| Combat | `damageNearby`, `slowNearby`, `spawnEnemy`, `defineEnemy`, `defineUpgrade` | Damage, slowing, variants, upgrades |
| Actors | `defineActor`, `spawnActor`, `steerActor`, `actor.set`, `actor.damage`, `actor.remove` | Custom AI, steering and lifetime |
| Content | `defineCampaign`, `playCampaign` | Alternate acts/rooms and launching |
| Interface | `menu.addButton`, `menu.removeButton`, `ui.open`, `ui.close`, `hud.set`, `hud.remove` | Buttons, custom screens and HUD |
| Systems | `audio.tone`, `player.impulse`, `player.shield` | Synth sound and player abilities |
| Storage | `storage.get`, `storage.set`, `storage.remove`, `storage.keys` | JSON settings per mod |

## Event-driven implementation

```js
RequiemMod.on('input:press', async ({key}) => {
 if (key !== 'q') return;
 const snapshot = await RequiemMod.getState();
 if (snapshot?.state !== 'playing') return;
 const {x,y}=snapshot.player;
 RequiemMod.damageNearby({x,y,radius:120,damage:16});
 RequiemMod.ring({x,y,radius:16,end:120,life:.55,color:'#b1eefe'});
 RequiemMod.audio.tone({frequency:340,duration:.12,volume:.2});
});
```

## Limits and stability

The standard API validates command fields and limits rates, counts and sizes. This is an ergonomic interface for supported mechanics, not an arbitrary code-replacement facility. For mechanics or presentation it does not expose, use Full Engine Mode—**it is intentionally not constrained by this method inventory**. Consult the shipped `echo_rift_modding_guide.md` for the exact validated ranges, event shapes and actor sprite part format.

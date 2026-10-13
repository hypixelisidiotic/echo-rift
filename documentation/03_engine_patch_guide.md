# 03 · Full Engine Mode

REQUIEM developer manual · API 3.1 · generated against the supplied game build. Internal game functions are not stable public API.

## Launching a direct engine patch

1. Open the main menu → **MODS** → **FULL ENGINE MODE**.
2. Import a `.js` patch (up to the current per-file upload limit).
3. Launch. The host creates a new cloned, isolated game frame.
4. Play and test inside the frame. Exit the lab to discard it.

Unlike a standard mod, the patch runs **inside the lexical scope of the game engine IIFE**. You can read shared game state, invoke internal helpers, assign new implementations to writable function bindings, mutate arrays/objects and modify that cloned game's DOM/canvas. This approach has approximately the flexibility of editing the full vanilla source at runtime after initialization.

```js
// Override rather than merely subscribe to a boss's attack logic.
const previous = silenceAttack;
silenceAttack = function(boss){
  previous(boss); // optional: omit to fully replace
  // Add original attacks here using enemyFire, hazards, etc.
};
```

### Common patterns

**Wrap a function:** `const old=someFunction; someFunction=function(...args){ ...; return old(...args) }`.

**Replace outright:** `someFunction=function(...args){ /* own system */ }` for function bindings that permit reassignment.

**Create a new subsystem:** use `requestAnimationFrame`, custom state and canvas draw routines; use vanilla arrays and collision helpers only where you want interoperability.

**Rewrite a menu:** construct DOM nodes, attach listeners, modify CSS inside the cloned game. You are not limited to the regular mod-screen shell.

**Own bosses/acts:** replace relevant campaign/spawn/transition routines; use cloned engine functions as a reference or route through your own state machine.

### Real technical boundaries

- `const` variables cannot be reassigned; you can generally mutate mutable objects they reference.
- Patches run *after* initial engine initialization, so side effects that already occurred cannot be retroactively undone; intercept subsequent calls or create a new start flow.
- Invasive patches are version-specific. Prefer detecting required function names and failing with a clear visible message if they change.
- The modded game is inside a frame with a distinct opaque origin; it does not get the host page's DOM, origin storage or cookies. There are still risks from arbitrary JavaScript, malicious network connections, performance abuse and browser bugs.
- Cloned gameplay and its state are temporary in current Full Engine Mode; it is not automatically published as a normal campaign and is not bridged to vanilla progress.

**For exact vanilla replication**, use the functions indexed in `05_function_index.md` together with their complete implementations in `echo_rift_requiem.html`. Those source implementations—not paraphrased pseudocode—define the authoritative behaviour.

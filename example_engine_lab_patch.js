// REQUIEM Full Engine Mode patch, executed inside an isolated game copy.
// Override a vanilla mechanic with direct engine-scope access.
const oldSilenceAttack = silenceAttack;
silenceAttack = function (boss) {
  oldSilenceAttack(boss);
  // Use any exposed engine variables/functions in this lexical scope.
};
const engineNotice = document.createElement('div');
engineNotice.textContent = 'ENGINE PATCH ENABLED';
engineNotice.style.cssText = 'position:fixed;left:20px;top:15px;z-index:1000;color:#8fffe9;font:700 13px monospace;pointer-events:none';
document.body.append(engineNotice);

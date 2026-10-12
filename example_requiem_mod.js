// ECHO//RIFT: REQUIEM // Example community mod
// Install from the main menu MODS panel, then ENABLE it.
RequiemMod.register({
  id: 'example.neon-hunters',
  name: 'Neon Hunters',
  version: '1.0.0',
  description: 'Adds an aqua hunter that sometimes replaces a normal room spawn.'
});
RequiemMod.defineEnemy({
  id: 'hunter',
  name: 'Neon Hunter',
  base: 'charger',
  color: '#8bffea',
  hpScale: 1.3,
  speedScale: 1.23,
  radiusScale: 1,
  spawnChance: 0.08
});
// Also contributes a new optional Kinetic upgrade to normal room drafts.
RequiemMod.defineUpgrade({
  id:'aqua-drive',name:'AQUA DRIVE',symbol:'✧',
  description:'Faster movement and slightly stronger shots.',
  tag:'KINETIC',rarity:'RARE',max:2,
  effects:{speed:1.12,damage:1.07,fireRate:1,heal:0}
});
RequiemMod.on('run:start', () => {
  RequiemMod.toast('NEON HUNTERS // TRANSMISSION ACTIVE', 2.8);
});
RequiemMod.on('enemy:kill', e => {
  if (e.type.endsWith(':hunter')) {
    RequiemMod.addScore(30);
    RequiemMod.ring({x:e.x,y:e.y,color:'#8bffea',radius:9,end:80,life:0.38});
  }
});

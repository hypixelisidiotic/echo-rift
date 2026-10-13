// ECHO//RIFT: REQUIEM // API 3.0 showcase mod
// Requires game + echo_rift_mod_api.js v3.0. Original campaign is unaffected.
RequiemMod.register({id:'example.v3-toolkit',name:'Pulse Workshop',version:'3.0.0',description:'Custom UI, HUD, settings, sounds, and a pulse ability.'});
let charges=3,enabled=true,lastRefill=0;
const refresh=()=>RequiemMod.hud.set('pulse',{label:'WORKSHOP PULSE',value:enabled?charges+' / 3':'OFF',color:'#96ffe4'});
RequiemMod.storage.get('enabled').then(value=>{if(typeof value==='boolean')enabled=value;refresh()});
const style=document.createElement('style');style.textContent='body{background:#06131c;color:#c5fff1;font:15px system-ui;padding:25px}button{padding:15px;background:#173b48;color:white;border:1px solid #8fffe3;cursor:pointer}';document.head.appendChild(style);
const heading=document.createElement('h1');heading.textContent='PULSE WORKSHOP';document.body.appendChild(heading);
const description=document.createElement('p');description.textContent='A mod-owned settings screen. Press Q in combat to unleash a short-range pulse. Charges refill over time.';document.body.appendChild(description);
const button=document.createElement('button');document.body.appendChild(button);
function sync(){button.textContent=enabled?'DISABLE PULSE':'ENABLE PULSE';refresh()};sync();
button.addEventListener('click',async()=>{enabled=!enabled;await RequiemMod.storage.set('enabled',enabled);sync()});
RequiemMod.menu.addButton({id:'settings',label:'◈ PULSE WORKSHOP',description:'CUSTOM ABILITY · SETTINGS'});
RequiemMod.on('menu:click',({id})=>{if(id==='settings')RequiemMod.ui.open({title:'PULSE WORKSHOP'})});
RequiemMod.on('run:start',()=>{charges=3;refresh()});
RequiemMod.on('run:end',()=>RequiemMod.hud.remove('pulse'));
RequiemMod.on('input:press',async({key})=>{
 if(key!=='q'||!enabled||charges<=0)return;
 const state=await RequiemMod.getState();if(state?.state!=='playing'||!state.player)return;
 charges--;refresh();const {x,y}=state.player;
 RequiemMod.damageNearby({x,y,radius:125,damage:15});
 RequiemMod.slowNearby({x,y,radius:140,seconds:1.2});
 RequiemMod.ring({x,y,radius:18,end:135,life:.45,color:'#96ffe4'});
 RequiemMod.draw({kind:'polygon',x,y,sides:6,radius:50,color:'#d5ffb6',life:.3,width:2});
 RequiemMod.player.shield(.25);
 RequiemMod.audio.tone({frequency:700,endFrequency:215,duration:.22,wave:'triangle',volume:.035});
});
RequiemMod.on('simulation:tick',({time})=>{
 if(time-lastRefill>8){lastRefill=time;if(charges<3){charges++;refresh()}}
});

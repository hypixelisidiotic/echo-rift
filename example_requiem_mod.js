// ECHO//RIFT: REQUIEM — V2 COMMUNITY EXPEDITION EXAMPLE
// Import via MODS → INSTALL .JS → ENABLE. This is a real 2-act mini-campaign.
// It also demonstrates a CUSTOM HTML/CSS main-menu screen and new actor AI.
RequiemMod.register({
  id:'example.eclipse-expedition',name:'Eclipse Expedition',version:'2.0.0',
  description:'Two new acts, a custom menu, script-driven enemies, and a phase-changing final guardian.'
});

// No built-in behaviour is inherited: the mod controls these units every 100ms.
RequiemMod.defineActor({id:'seek',name:'Eclipse Seeker',hp:44,speed:155,radius:17,color:'#5dffe0',sides:3,score:160,sprite:{rotation:'face-player',parts:[{kind:'polygon',sides:3,radius:1.2,color:'#274e58'},{kind:'polygon',sides:3,radius:.76,color:'#54eacb'},{kind:'circle',y:.16,radius:.26,color:'#e1fff9',stroke:false},{kind:'line',x:-.86,y:.42,x2:.86,y2:.42,color:'#b4fff3',lineWidth:2}]}});
RequiemMod.defineActor({id:'orbit',name:'Orbit Sentinel',hp:110,speed:120,radius:23,color:'#ffd28a',sides:7,score:280,sprite:{rotation:'spin',spin:.65,parts:[{kind:'circle',radius:1.2,color:'#f6af61',fill:false,lineWidth:3},{kind:'rect',w:1.4,h:.36,color:'#ffc972',angle:.785},{kind:'rect',w:1.4,h:.36,color:'#ffc972',angle:-.785},{kind:'polygon',sides:6,radius:.57,color:'#33263e'},{kind:'circle',radius:.22,color:'#fff1cb',stroke:false}]}});
RequiemMod.defineActor({id:'crown',name:'Eclipse Crown',hp:850,speed:62,radius:54,color:'#e49cff',sides:9,score:1800,boss:true,sprite:{rotation:'spin',spin:-.18,parts:[{kind:'polygon',sides:5,radius:1.15,color:'#8e49b0',fill:false,lineWidth:4},{kind:'polygon',sides:5,radius:.92,color:'#24203f',angle:.628},{kind:'circle',radius:.65,color:'#d39aff',fill:false,lineWidth:3,spin:.9},{kind:'polygon',sides:3,radius:.57,color:'#eabaed',angle:3.14},{kind:'circle',radius:.18,color:'#ffffff',stroke:false}]}});

RequiemMod.defineCampaign({
 id:'eclipse',name:'ECLIPSE EXPEDITION',
 acts:[
  {name:'ACT V // DARKLIGHT',rooms:[
   {name:'UNWELCOME SIGNAL',duration:14,spawns:[
    {at:1,type:'seek',count:3},{at:5,type:'orbit',count:1},{at:8,type:'seek',count:3}]},
   {name:'THE HOLLOW STAR',duration:17,spawns:[
    {at:1,type:'orbit',count:2},{at:6,type:'seek',count:4},{at:10,type:'orbit',count:1}]}
  ]},
  {name:'ACT VI // OCCLUSION',rooms:[
   {name:'FADING ORBIT',duration:19,spawns:[
    {at:1,type:'orbit',count:3},{at:5,type:'seek',count:5},{at:10,type:'orbit',count:2}]},
   {name:'THE LAST CORONA',duration:20,spawns:[
    {at:2,type:'crown',count:1},{at:6,type:'seek',count:3},{at:11,type:'orbit',count:2}]}
  ]}
 ]
});

RequiemMod.menu.addButton({id:'eclipse',label:'✦ ECLIPSE EXPEDITION',description:'TWO NEW ACTS · CUSTOM AI · NEW BOSS'});

// The following DOM and CSS belong to the SANDBOXED MOD FRAME ONLY.
// The mod cannot edit the REQUIEM menu/host document itself.
const style=document.createElement('style');
style.textContent=`
 *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:system-ui,sans-serif;color:#e3ffff;background:#061424}
 .scene{min-height:100%;padding:clamp(20px,6vw,48px);display:flex;flex-direction:column;align-items:start;justify-content:center;background:radial-gradient(ellipse at 75% 26%,#2e2356 0%,transparent 55%)}
 small{color:#85dece;font:700 11px ui-monospace,monospace;letter-spacing:.28em}
 h1{font-size:clamp(36px,7vw,74px);line-height:.98;letter-spacing:-.06em;margin:20px 0;color:#fff1fa;text-shadow:0 0 32px #c18bff65}
 p{font-size:15px;line-height:1.75;color:#a7c1d2;max-width:580px}
 .pill{border:1px solid #9df3da67;padding:9px 13px;margin:18px 0;color:#8deecf;font:700 11px ui-monospace,monospace}
 button{padding:17px 25px;border:1px solid #b1fce9;background:#bcffee;color:#09202b;font:900 13px ui-monospace,monospace;letter-spacing:.12em;cursor:pointer}
 button:hover{background:white}
`;
document.head.appendChild(style);
const ui=document.createElement('main');ui.className='scene';
ui.innerHTML=`<small>COMMUNITY CONTENT / CUSTOM EXPEDITION</small>
<h1>THE ECLIPSE<br>EXPEDITION.</h1>
<p>Four new encounters across two acts. Seekers hunt you in sharp bursts, Sentinels orbit and fire in calculated patterns, and the Eclipse Crown changes its attack logic as its health drops.</p>
<div class="pill">SCRIPTED AI · Q CORONA PULSE · MOD-OWNED CAMPAIGN</div>
<button id="beginEclipse" type="button">▶ BEGIN EXPEDITION</button>`;
document.body.appendChild(ui);
document.getElementById('beginEclipse').addEventListener('click',()=>RequiemMod.playCampaign('eclipse'));

RequiemMod.on('menu:click',({id})=>{if(id==='eclipse')RequiemMod.ui.open({title:'ECLIPSE EXPEDITION'})});

const shotTimers=new Map();
let corona=0,abilityReady=0,expeditionLive=false;
// A completely NEW player ability, implemented exclusively in mod code.
// Q sends a short-range disruption pulse with its own cooldown and visuals.
RequiemMod.on('input:press',async({key})=>{
 if(key!=='q'||!expeditionLive||Date.now()<abilityReady)return;
 const game=await RequiemMod.getState();
 if(!game||game.state!=='playing'||!game.campaign||!game.player)return;
 abilityReady=Date.now()+6000;
 const {x,y}=game.player;
 RequiemMod.damageNearby({x,y,radius:155,damage:24});
 RequiemMod.slowNearby({x,y,radius:180,seconds:2.4});
 RequiemMod.ring({x,y,color:'#8fffe9',radius:25,end:175,life:.55});
 RequiemMod.draw({kind:'text',x,y:y-70,text:'CORONA PULSE',color:'#a7fff0',size:18,life:.9});
 RequiemMod.toast('CORONA PULSE // RECHARGING 6 SEC',1.8);
});
RequiemMod.on('run:end',()=>{expeditionLive=false});
RequiemMod.on('campaign:start',()=>{shotTimers.clear();corona=0;expeditionLive=true;abilityReady=0;RequiemMod.toast('ECLIPSE ACQUIRED // PRESS Q FOR CORONA PULSE',3)});
RequiemMod.on('campaign:room',r=>{
 RequiemMod.toast('NEW SECTOR // '+r.name,2.2);
 shotTimers.clear();
});
RequiemMod.on('actor:death',a=>{shotTimers.delete(a.id);RequiemMod.ring({x:a.x,y:a.y,color:'#a8ffde',radius:15,end:110,life:.5})});
RequiemMod.on('campaign:complete',()=>RequiemMod.toast('THE ECLIPSE HAS ENDED',3));

// All mechanics here are mod code, not switches on an existing enemy's AI.
RequiemMod.on('simulation:tick',frame=>{
 if(!frame.campaign||!frame.player)return;
 const p=frame.player;
 for(const actor of frame.actors){
  const tag=actor.type.split(':').pop(),dx=p.x-actor.x,dy=p.y-actor.y;
  const dist=Math.max(1,Math.hypot(dx,dy)),nx=dx/dist,ny=dy/dist;
  const t=frame.time;
  if(tag==='seek'){
   // Zig-zag interceptors that accelerate sideways, without built-in AI.
   const wobble=Math.sin(t*3+actor.id*43)*.8;
   RequiemMod.steerActor(actor.id,nx-ny*wobble,ny+nx*wobble);
  }else if(tag==='orbit'){
   // Tangential defenders that strafe at range and periodically aim at the pilot.
   const forward=dist<170?-.5:dist>380?.7:.1;
   RequiemMod.steerActor(actor.id,nx*forward-ny*.95,ny*forward+nx*.95);
   if(t>=(shotTimers.get(actor.id)||0)){
    RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),count:3,spread:.24,speed:210,color:'#ffd28a'});
    shotTimers.set(actor.id,t+1.8);
   }
  }else if(tag==='crown'){
   // An entirely mod-scripted miniboss with 3 health-triggered phases.
   const phase=actor.hp/actor.maxHp>.65?1:actor.hp/actor.maxHp>.32?2:3;
   const side=Math.sin(t*.8)*.75;
   RequiemMod.steerActor(actor.id,-ny*side+nx*.1,nx*side+ny*.1);
   if(t>=(shotTimers.get(actor.id)||0)){
    if(phase===1){
     RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),count:5,spread:.21,speed:215,color:'#d6a4ff'});
    }else if(phase===2){
     for(let i=0;i<6;i++)RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:corona+i*Math.PI/3,count:1,speed:190,color:'#d6a4ff'});
    }else{
     RequiemMod.fire({team:'hostile',x:actor.x,y:actor.y,angle:Math.atan2(dy,dx),count:7,spread:.17,speed:270,color:'#f69bbd'});
     RequiemMod.hazard({x:p.x+Math.sin(t)*95,y:p.y+Math.cos(t)*70,radius:44,warning:1.25});
    }
    RequiemMod.draw({kind:'circle',x:actor.x,y:actor.y,radius:actor.maxHp?60:35,color:'#d89cff',life:.35});
    corona+=.3;shotTimers.set(actor.id,t+(phase===3?2.1:phase===2?2.5:3.1));
   }
  }
 }
});

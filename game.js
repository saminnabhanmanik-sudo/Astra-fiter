'use strict';
/* ASTRA FIGHTERS — 2D retro arcade fighter. Pure HTML5 Canvas, zero external libraries (100% offline). */
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const FLOOR=430,WORLD=1280,BL=70,BR=1210,GRAV=.78;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rnd=(a,b)=>a+Math.random()*(b-a),ri=n=>Math.floor(Math.random()*n);
const hsh=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
function shade(h,k){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=k<0?0:255,p=Math.abs(k);return`rgb(${Math.round(lerp(r,f,p))},${Math.round(lerp(g,f,p))},${Math.round(lerp(b,f,p))})`}

/* ---------- CONFIG (overridable by game.json) ---------- */
const CFG={rounds:3,timer:60,hp:200,st:100,pts:5,dmg:{lp:8,hp:15,lk:10,hk:18,air:14,sp:25,fin:30},cost:{hp:7,hk:10,sp:28,fin:12},run:18,idle:15,move:4,dodge:10};
let MV={};
function buildMoves(){const d=CFG.dmg,c=CFG.cost;MV={
 lp:{dmg:d.lp,s:4,a:3,r:9,reach:72,y1:-150,y2:-100,lvl:1,snd:'lp'},
 hp:{dmg:d.hp,s:8,a:4,r:16,reach:82,y1:-142,y2:-92,lvl:2,cost:c.hp,snd:'hp'},
 lk:{dmg:d.lk,s:6,a:3,r:11,reach:92,y1:-118,y2:-64,lvl:1,snd:'lk'},
 hk:{dmg:d.hk,s:10,a:4,r:20,reach:104,y1:-152,y2:-70,lvl:3,kd:1,cost:c.hk,snd:'hk'},
 fp:{dmg:Math.round((d.lp+d.hp)/2),s:8,a:4,r:14,reach:92,y1:-128,y2:-76,lvl:2,lunge:5,snd:'hp'},
 bk:{dmg:d.lk,s:9,a:4,r:18,reach:98,y1:-36,y2:0,lvl:2,kd:1,low:1,snd:'lk'},
 air:{dmg:d.air,s:2,a:12,r:6,reach:76,y1:-96,y2:-10,lvl:2,air:1,snd:'hp'},
 sp:{dmg:d.sp,s:14,a:6,r:26,reach:135,y1:-135,y2:-50,lvl:4,kd:1,cost:c.sp,lunge:4,end:1,snd:'sp'},
 fin:{dmg:d.fin,s:10,a:5,r:24,reach:108,y1:-145,y2:-60,lvl:4,kd:1,cost:c.fin,end:1,snd:'hk'}}}
buildMoves();

/* ---------- ROSTER (10 original fighters) ---------- */
const CH=[
 {id:'nova',name:'NOVA',style:'Balanced martial arts',attack:7,speed:8,defense:7,special:'Prism Strike',c1:'#2f7cf6',c2:'#ffd23f',skin:'#f0c08a',hair:'#1c1c2b',hs:1,sc:1,w:1,slv:0},
 {id:'volt',name:'VOLT',style:'Kickboxing',attack:8,speed:9,defense:6,special:'Thunder Rush',c1:'#f2b705',c2:'#222a3a',skin:'#c98b5a',hair:'#111',hs:3,sc:1,w:1,slv:0},
 {id:'orion',name:'ORION',style:'Karate',attack:8,speed:7,defense:8,special:'Meteor Fist',c1:'#f4f4f4',c2:'#d62d2d',skin:'#e8b88a',hair:'#2a1a10',hs:4,sc:1.02,w:1.05,slv:1},
 {id:'lyra',name:'LYRA',style:'Taekwondo',attack:7,speed:10,defense:6,special:'Sky Arc',c1:'#e8e8f2',c2:'#2fc7c0',skin:'#f4cfa8',hair:'#3b2a6b',hs:2,sc:1.04,w:.9,slv:0},
 {id:'kairo',name:'KAIRO',style:'Jeet Kune Do',attack:8,speed:9,defense:7,special:'Rapid Pulse',c1:'#222831',c2:'#e5372f',skin:'#a8714a',hair:'#0b0b0b',hs:4,sc:1,w:1,slv:0},
 {id:'ember',name:'EMBER',style:'Muay Thai',attack:9,speed:7,defense:7,special:'Blazing Elbow',c1:'#e8541f',c2:'#fff1c2',skin:'#d9a070',hair:'#7a2410',hs:2,sc:1,w:1.05,slv:0},
 {id:'zenith',name:'ZENITH',style:'Wushu',attack:7,speed:9,defense:7,special:'Wind Spiral',c1:'#2aa876',c2:'#f0e6a8',skin:'#efc89a',hair:'#161616',hs:5,sc:.98,w:.95,slv:1},
 {id:'mira',name:'MIRA',style:'Capoeira',attack:7,speed:9,defense:8,special:'Comet Sweep',c1:'#f5f1e4',c2:'#2f9e44',skin:'#8a5a3a',hair:'#1a0f0a',hs:6,sc:1,w:.95,slv:0},
 {id:'titan',name:'TITAN',style:'Power wrestling',attack:10,speed:5,defense:10,special:'Ground Breaker',c1:'#6a1fb0',c2:'#f5c542',skin:'#b97a55',hair:'#222',hs:0,sc:1.1,w:1.3,slv:0},
 {id:'nyx',name:'NYX',style:'Ninja-inspired martial arts',attack:8,speed:10,defense:5,special:'Shadow Flash',c1:'#1b1b2a',c2:'#7b3ff0',skin:'#e0b48a',hair:'#1b1b2a',hs:7,sc:.98,w:.92,slv:0}];
const ARENAS=['Neon City','Ancient Temple','Japanese Dojo','Mountain Arena','Futuristic Arena'];

/* ---------- SETTINGS ---------- */
const SDEF={music:35,sfx:55,opacity:48,btn:50,joy:50,gfx:'high',timer:60,ai:'normal',perf:false,arena:0,p1:0,p2:1};
let S=Object.assign({},SDEF);try{Object.assign(S,JSON.parse(localStorage.getItem('astra.settings')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('astra.settings',JSON.stringify(S))}catch(e){}};
const LOW=()=>S.perf||S.gfx==='low';
function applySettings(){const r=document.documentElement.style;r.setProperty('--ctl-op',S.opacity/100);r.setProperty('--btn',S.btn+'px');AU.vol();CFG.timer=+S.timer;resize()}

/* ---------- AUDIO (procedural) ---------- */
const AU=(()=>{let ctx,mg,sg,nb,tm=null,cur=null,step=0,nxt=0;
 const init=()=>{if(ctx){if(ctx.state==='suspended')ctx.resume();return}try{ctx=new(window.AudioContext||window.webkitAudioContext)();mg=ctx.createGain();sg=ctx.createGain();mg.connect(ctx.destination);sg.connect(ctx.destination);nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;vol();if(cur)music(cur,1)}catch(e){ctx=null}};
 const vol=()=>{if(!ctx)return;mg.gain.value=S.music/100*.2;sg.gain.value=S.sfx/100*.6};
 const tone=(f,d,type='square',v=.3,to=null,at=0,out)=>{if(!ctx)return;const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(out||sg);o.start(t);o.stop(t+d+.03)};
 const noise=(d,v=.3,fq=2000,at=0)=>{if(!ctx)return;const t=ctx.currentTime+at,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=nb;f.type='bandpass';f.frequency.value=fq;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(sg);s.start(t,Math.random()*.5,d+.02)};
 const SF={lp:()=>{noise(.07,.35,3000);tone(300,.06,'triangle',.25,150)},hp:()=>{noise(.1,.5,1800);tone(200,.1,'sawtooth',.3,80)},lk:()=>{noise(.08,.4,2500);tone(220,.08,'triangle',.3,110)},hk:()=>{noise(.14,.6,1200);tone(160,.14,'sawtooth',.4,60)},
  sp:()=>{tone(300,.35,'sawtooth',.35,1200);tone(150,.4,'square',.3,40);noise(.3,.4,800)},block:()=>{tone(900,.05,'square',.25,500);noise(.05,.3,4000)},hit:()=>tone(120,.1,'square',.3,60),
  fall:()=>{tone(180,.3,'sine',.6,40);noise(.2,.5,300)},getup:()=>tone(200,.15,'triangle',.25,400),ko:()=>{tone(500,.9,'sawtooth',.4,50);noise(.5,.6,600)},whoosh:()=>noise(.15,.25,1500),
  win:()=>[0,4,7,12].forEach((n,i)=>tone(262*2**(n/12),.25,'square',.25,null,i*.12)),lose:()=>[7,4,0,-5].forEach((n,i)=>tone(262*2**(n/12),.3,'triangle',.3,null,i*.18)),
  click:()=>tone(700,.04,'square',.2),pause:()=>{tone(500,.08,'square',.2);tone(350,.1,'square',.2,null,.07)},resume:()=>{tone(350,.08,'square',.2);tone(500,.1,'square',.2,null,.07)},deny:()=>tone(120,.1,'square',.3),
  fight:()=>{tone(220,.3,'sawtooth',.4,440);noise(.2,.4,1000)},round:()=>tone(330,.2,'square',.3)};
 const sfx=n=>{if(ctx&&SF[n])SF[n]()};
 const TR={menu:{bpm:92,root:220,lead:[0,-1,2,-1,3,-1,2,-1,4,-1,3,-1,2,-1,0,-1],bass:[0,-1,-1,0,-1,-1,0,-1,3,-1,-1,3,-1,-1,2,-1],w:'triangle'},
  0:{bpm:132,root:164.8,lead:[0,2,4,2,0,2,5,4,0,2,4,2,5,4,2,1],bass:[0,0,-1,0,0,-1,0,0,3,3,-1,3,2,-1,2,2],w:'sawtooth'},
  1:{bpm:84,root:146.8,lead:[0,-1,-1,2,-1,-1,3,-1,2,-1,-1,0,-1,-1,-1,-1],bass:[0,-1,-1,-1,0,-1,-1,-1,3,-1,-1,-1,2,-1,-1,-1],w:'triangle'},
  2:{bpm:96,root:196,lead:[0,-1,2,-1,4,-1,2,-1,0,-1,-1,-1,3,-1,2,-1],bass:[0,-1,0,-1,0,-1,0,-1,2,-1,2,-1,3,-1,3,-1],w:'square'},
  3:{bpm:112,root:174.6,lead:[4,-1,2,0,-1,2,4,-1,5,-1,4,2,-1,0,-1,-1],bass:[0,-1,-1,0,2,-1,-1,2,3,-1,-1,3,2,-1,-1,0],w:'sawtooth'},
  4:{bpm:140,root:130.8,lead:[0,0,3,0,5,0,3,0,0,0,4,0,6,0,4,0],bass:[0,-1,0,0,-1,0,0,-1,2,-1,2,2,-1,2,2,-1],w:'square'},
  victory:{bpm:118,root:261.6,lead:[0,2,4,7,4,2,4,-1,5,4,2,0,2,4,-1,-1],bass:[0,-1,-1,-1,3,-1,-1,-1,4,-1,-1,-1,0,-1,-1,-1],w:'square'}};
 const SC=[0,2,4,7,9,12,14,16];
 const music=(n,force)=>{if(cur===n&&!force&&tm)return;cur=n;if(tm){clearInterval(tm);tm=null}if(!ctx)return;step=0;nxt=ctx.currentTime+.05;const T=TR[n];if(!T)return;tm=setInterval(()=>{const d=60/T.bpm/2;while(nxt<ctx.currentTime+.25){const k=step%16,l=T.lead[k],b=T.bass[k],at=nxt-ctx.currentTime;
  if(l>=0)tone(T.root*2*2**(SC[l]/12),d*1.6,T.w,.22,null,Math.max(0,at),mg);if(b>=0)tone(T.root/2*2**(SC[b]/12),d*1.8,'triangle',.4,null,Math.max(0,at),mg);if(k%4===0)tone(110,.12,'sine',.55,40,Math.max(0,at),mg);if(k%4===2)tone(5000,.03,'square',.06,null,Math.max(0,at),mg);nxt+=d;step++}},60)};
 return{init,vol,sfx,music}})();

/* ---------- STATE ---------- */
const cv=$('#game'),ctx=cv.getContext('2d'),shell=$('#game-shell');
const G={playing:false,paused:false,hard:false,phase:'idle',pt:0,round:1,pts:[0,0,0],wins:[0,0,0],timer:60,tf:0,mode:'two',hs:0,shake:0,cam:{cx:640,z:1.1},aiLvl:'normal'};
let FR=0,P=[null,null,null];
const FX={sp:[],fl:[],nm:[]};
const FREE=new Set(['idle','walkF','walkB','run','crouch','block','cblock']);
const NOHIT=new Set(['fall','ground','getup','ko','win','lose']);

class F{constructor(p,ch){this.p=p;this.ch=ch;this.reset(p===1?500:780,p===1?1:-1)}
 reset(x,face){Object.assign(this,{x,y:FLOOR,vx:0,vy:0,face,hp:CFG.hp,st:CFG.st,state:'idle',t:0,f:0,mv:null,mn:'',hit:false,chain:0,inv:0,stD:0,stun:0,flash:0,heavy:false,fallBack:false,ko:false,cn:0,cd:0,cshow:0,ctxt:'',psg:0,tf:-99,tb:-99,runArm:false,dodgeReq:false,deny:0,trail:CFG.hp,cb:false,ai:null})}}

/* ---------- INPUT ---------- */
const IN=[null,0,0].map((_,p)=>p?{sx:0,sy:0,kx:0,ky:0,ax:0,ay:0,cpu:false,held:{},q:[],kd:{}}:null);
const ACT={punch:'p',heavyPunch:'hp',kick:'k',heavyKick:'hk'};
function press(p,a){if(!G.playing||G.paused||G.hard||G.phase!=='fight'||IN[p].cpu)return;IN[p].held[a]=1;IN[p].q.push({a,t:FR})}
function releaseInputs(){for(const p of[1,2]){const i=IN[p];i.sx=i.sy=i.kx=i.ky=0;i.held={};i.q.length=0;i.kd={}}$$('.pressed').forEach(e=>e.classList.remove('pressed'));$$('.knob').forEach(k=>k.style.transform='')}
$$('[data-action]').forEach(b=>{const p=+b.dataset.player,a=ACT[b.dataset.action];
 b.addEventListener('pointerdown',e=>{e.preventDefault();AU.init();try{b.setPointerCapture(e.pointerId)}catch(_){}b.classList.add('pressed');press(p,a)});
 const up=()=>{b.classList.remove('pressed');IN[p].held[a]=0};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up))});
$$('.stick').forEach(el=>{const p=+el.dataset.player,k=el.querySelector('.knob');let id=null;
 const move=e=>{const r=el.getBoundingClientRect(),R=r.width/2;let dx=(e.clientX-r.left-R)/R,dy=(e.clientY-r.top-R)/R;const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}
  k.style.transform=`translate(${dx*R*.55}px,${dy*R*.55}px)`;const sc=.7+S.joy/100*.9,f=v=>{v*=sc;return Math.abs(v)<.25?0:clamp(v,-1,1)};IN[p].sx=f(dx);IN[p].sy=f(dy)};
 el.addEventListener('pointerdown',e=>{e.preventDefault();AU.init();if(id!==null)return;id=e.pointerId;try{el.setPointerCapture(id)}catch(_){}move(e)});
 el.addEventListener('pointermove',e=>{if(e.pointerId===id)move(e)});
 const end=e=>{if(e.pointerId!==id)return;id=null;IN[p].sx=IN[p].sy=0;k.style.transform=''};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,end))});
const KM={KeyA:[1,'l'],KeyD:[1,'r'],KeyW:[1,'u'],KeyS:[1,'d'],KeyF:[1,'p'],KeyG:[1,'hp'],KeyV:[1,'k'],KeyB:[1,'hk'],ArrowLeft:[2,'l'],ArrowRight:[2,'r'],ArrowUp:[2,'u'],ArrowDown:[2,'d'],KeyJ:[2,'p'],KeyK:[2,'hp'],KeyN:[2,'k'],KeyM:[2,'hk']};
const setK=(i,d)=>{i.kx=(d.r?1:0)-(d.l?1:0);i.ky=(d.d?1:0)-(d.u?1:0)};
addEventListener('keydown',e=>{const m=KM[e.code];if(!m)return;e.preventDefault();AU.init();if(e.repeat)return;const i=IN[m[0]];if('lrud'.includes(m[1])&&m[1].length===1){i.kd[m[1]]=1;setK(i,i.kd)}else press(m[0],m[1])});
addEventListener('keyup',e=>{const m=KM[e.code];if(!m)return;const i=IN[m[0]];if('lrud'.includes(m[1])&&m[1].length===1){i.kd[m[1]]=0;setK(i,i.kd)}});
['touchmove','gesturestart','contextmenu','dblclick'].forEach(ev=>addEventListener(ev,e=>e.preventDefault(),{passive:false}));
const ctrl=p=>{const i=IN[p];if(i.cpu)return{x:i.ax,y:i.ay};return{x:i.sx||i.kx,y:i.sy||i.ky}};

/* ---------- POSES & FIGURE DRAWING ---------- */
function pose(f){const s=f.state,t=f.t||0,ph=t*.22,br=Math.sin(t*.1)*.03;
 const P={lean:.14,fa:[.7,1.6],ba:[.4,1.9],fl:[.42,-.55],bl:[-.5,-.45],rot:0,head:0,hy:0};
 switch(s){
 case'idle':P.lean=.14+br;P.fa=[.7+br,1.6];P.fl=[.42,-.55+br*2];break;
 case'walkF':case'walkB':{const d=s==='walkF'?1:-1,w=Math.sin(ph*d),cw=Math.cos(ph*d);P.fl=[.35+w*.5,-.4-Math.max(0,cw)*.5];P.bl=[-.35-w*.5,-.4-Math.max(0,-cw)*.5];P.lean=.12;break}
 case'run':{const w=Math.sin(t*.42),cw=Math.cos(t*.42);P.lean=.4;P.fl=[.6+w*.9,-.7-Math.max(0,cw)*.8];P.bl=[-.6-w*.9,-.7-Math.max(0,-cw)*.8];P.fa=[.9-w*.9,1.5];P.ba=[-.2+w*.9,1.5];break}
 case'crouch':case'cblock':P.lean=.3;P.fl=[1.05,-1.7];P.bl=[-.35,-1.5];P.fa=[.9,1.9];P.ba=[.6,2.1];if(s==='cblock'){P.fa=[.7,2.5];P.ba=[.6,2.6]}break;
 case'block':case'bhit':P.lean=.02;P.fa=[.5,2.3];P.ba=[.35,2.5];P.fl=[.3,-.4];P.bl=[-.35,-.4];if(f.cb){P.lean=.3;P.fl=[1.05,-1.7];P.bl=[-.35,-1.5]}break;
 case'jump':P.lean=.05;P.fl=[.9,-1.4];P.bl=[.2,-1.4];P.fa=[2.2,.5];P.ba=[1.8,.6];break;
 case'land':P.lean=.35;P.fl=[1.0,-1.7];P.bl=[-.3,-1.6];break;
 case'dodge':P.lean=-.35;P.fl=[.7,-.9];P.bl=[-.7,-.6];P.fa=[.3,1.8];P.ba=[.1,2];break;
 case'hit':P.lean=-.3-(f.heavy?.25:0);P.head=-.25;P.fa=[-.4,.3];P.ba=[-.6,.2];P.fl=[.1,-.3];P.bl=[-.5,-.3];break;
 case'fall':P.lean=-.2;P.fa=[-1.4+Math.sin(t*.5)*.3,.2];P.ba=[-1.8,.3];P.fl=[.6,-.8];P.bl=[-.2,-.5];P.rot=(f.fallBack?-1:1)*clamp(t/16,0,1)*1.5;break;
 case'ground':case'ko':P.lean=0;P.fa=[.3,.2];P.ba=[-.3,.2];P.fl=[.15,-.1];P.bl=[-.1,-.1];P.rot=(f.fallBack?-1:1)*1.55;break;
 case'getup':{const g=clamp(t/26,0,1);P.lean=.3;P.fl=[1.05,-1.7];P.bl=[-.35,-1.5];P.rot=(f.fallBack?-1:1)*1.55*(1-g);break}
 case'win':P.fa=[2.9,.3];P.ba=[.6,1.8];P.lean=.05+Math.sin(t*.2)*.03;P.fl=[.3,-.3];P.bl=[-.3,-.3];break;
 case'lose':P.lean=.45;P.head=.3;P.fa=[.1,.2];P.ba=[.05,.2];P.fl=[.15,-.2];P.bl=[-.15,-.2];break;
 case'attack':{const m=f.mv,fr=f.f,e=fr<m.s?fr/m.s:fr<m.s+m.a?1:Math.max(0,1-(fr-m.s-m.a)/m.r),n=f.mn;
  if(n==='lp'||n==='fp'){P.fa=[lerp(.7,1.55,e),lerp(1.6,.05,e)];P.lean+=e*.12}
  else if(n==='hp'){P.ba=[lerp(.4,1.5,e),lerp(1.9,.05,e)];P.lean=.14+e*.3}
  else if(n==='lk'){P.fl=[lerp(.4,1.45,e),lerp(-.55,-.05,e)];P.lean=.14-e*.15}
  else if(n==='hk'){P.bl=[lerp(-.5,1.95,e),lerp(-.45,-.05,e)];P.lean=.14-e*.3;P.fa=[1.2,1.2]}
  else if(n==='bk'){P.lean=.35;P.fl=[1.05,-1.7];P.bl=[lerp(-.35,1.3,e),lerp(-1.5,-.1,e)]}
  else if(n==='air'){P.fl=[lerp(.9,1.15,e),lerp(-1.4,-.05,e)];P.bl=[.3,-1.2];P.fa=[2,.6];P.ba=[1.8,.6]}
  else if(n==='sp'){P.fa=[1.5,lerp(1.5,.05,e)];P.ba=[1.45,lerp(1.8,.05,e)];P.lean=.2+e*.25;P.fl=[.8,-.9]}
  else if(n==='fin'){P.bl=[lerp(-.5,2.1,e),-.05];P.lean=.1-e*.35;P.fa=[1.8,.4];P.rot=e*.1}
  P.e=e;break}}
 return P}

function drawFig(c,ch,Pz,face,flash,col2){
 const K=(h,k=0)=>flash>0?shade(h,.78):(k?shade(h,k):h),W=ch.w;
 c.save();c.scale(face*ch.sc,ch.sc);c.lineCap='round';c.lineJoin='round';
 c.translate(0,-8);c.rotate(Pz.rot);c.translate(0,8);
 const lim=(ox,oy,a,b,l1,l2)=>{const kx=ox+Math.sin(a)*l1,ky=oy+Math.cos(a)*l1,a2=a+b;return[kx,ky,kx+Math.sin(a2)*l2,ky+Math.cos(a2)*l2]};
 const fl=lim(0,0,Pz.fl[0],Pz.fl[1],38,40),bl=lim(0,0,Pz.bl[0],Pz.bl[1],38,40),drop=Math.max(fl[3],bl[3]);
 const hx=0,hy=-drop+(Pz.hy||0),sx=hx+Math.sin(Pz.lean)*50,sy=hy-Math.cos(Pz.lean)*50;
 const leg=(l,dark)=>{c.strokeStyle=K(ch.c1,dark?-.35:-.15);c.lineWidth=13*W;c.beginPath();c.moveTo(hx,hy);c.lineTo(hx+l[0],hy+l[1]);c.lineTo(hx+l[2],hy+l[3]);c.stroke();c.fillStyle=K(ch.c2,dark?-.3:0);c.beginPath();c.ellipse(hx+l[2]+5,hy+l[3]-2,9,5.5,0,0,7);c.fill()};
 const arm=(a,dark)=>{const e=lim(sx,sy,a[0],a[1],26,26),[ex,ey,hx2,hy2]=[e[0],e[1],e[2],e[3]];c.strokeStyle=ch.slv?K(ch.skin,dark?-.25:0):K(ch.c1,dark?-.35:-.05);c.lineWidth=10.5*W;c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();c.strokeStyle=K(ch.skin,dark?-.25:0);c.lineWidth=9*W;c.beginPath();c.moveTo(ex,ey);c.lineTo(hx2,hy2);c.stroke();c.fillStyle=K(ch.c2,dark?-.2:0);c.beginPath();c.arc(hx2,hy2,6.2*W,0,7);c.fill();return[hx2,hy2]};
 leg(bl,1);arm(Pz.ba,1);
 c.strokeStyle=K(ch.c1);c.lineWidth=27*W;c.beginPath();c.moveTo(hx,hy);c.lineTo(sx,sy);c.stroke();
 c.strokeStyle=K(ch.c2);c.lineWidth=7;c.beginPath();c.moveTo(hx-12*W,hy-1);c.lineTo(hx+12*W,hy-1);c.stroke();
 c.strokeStyle=K(ch.c2,-.1);c.lineWidth=3;c.beginPath();c.moveTo(sx-8*W,sy+3);c.lineTo(hx-3,hy-16);c.stroke();
 leg(fl,0);
 const ha=Pz.lean+Pz.head,hx0=sx+Math.sin(ha)*21,hy0=sy-Math.cos(ha)*21;
 c.save();c.translate(hx0,hy0);c.fillStyle=K(ch.skin);c.beginPath();c.arc(0,0,13.5,0,7);c.fill();
 c.save();c.beginPath();c.arc(0,0,13.5,0,7);c.clip();const hr=K(ch.hair);c.fillStyle=hr;
 switch(ch.hs){
  case 1:c.beginPath();for(let i=0;i<5;i++){c.moveTo(-14+i*7,-6);c.lineTo(-11+i*7,-24);c.lineTo(-7+i*7,-6)}c.fill();c.fillRect(-14,-14,28,8);break;
  case 2:c.fillRect(-14,-15,28,9);c.beginPath();c.moveTo(-8,-12);c.quadraticCurveTo(-30,-6,-24,18);c.lineTo(-17,16);c.quadraticCurveTo(-20,-2,-6,-6);c.fill();break;
  case 3:c.fillRect(-3,-22,9,12);c.fillRect(-14,-13,28,6);break;
  case 4:c.fillRect(-14,-15,28,10);c.fillRect(-14,-8,5,9);break;
  case 5:c.fillRect(-14,-14,28,8);c.beginPath();c.arc(-1,-18,6,0,7);c.fill();break;
  case 6:for(let i=0;i<6;i++){c.beginPath();c.arc(-12+i*5,-10-(i%2)*3,6.5,0,7);c.fill()}break;
  case 7:c.fillStyle=K(ch.c1);c.fillRect(-15,-15,30,30);c.fillStyle=K(ch.skin);c.fillRect(-1,-5,16,6);c.fillStyle='#fff';c.fillRect(6,-4,6,2.5);break;
  default:c.fillStyle=K('#222');c.fillRect(-9,6,18,8)}
 if(ch.hs!==7){c.fillStyle='#fff';c.fillRect(5,-3,5,4);c.fillStyle='#111';c.fillRect(7.5,-2.5,2.6,3)}
 if(ch.hs!==0&&ch.hs!==7){c.fillStyle=K(ch.c2);c.fillRect(-15,-7,30,4)}
 c.restore();
 if(ch.hs===7){c.strokeStyle=K(ch.c2);c.lineWidth=5;c.beginPath();c.moveTo(-10,-2);c.quadraticCurveTo(-34,0,-30,14);c.stroke()}
 c.restore();
 const h=arm(Pz.fa,0);
 if(Pz.e>.6&&col2&&(Pz.sp)){c.fillStyle=col2;c.globalAlpha=.7;c.beginPath();c.arc(h[0]+14,h[1],16+Pz.e*6,0,7);c.fill();c.globalAlpha=1}
 c.restore();return h}

/* ---------- ARENAS ---------- */
function drawArena(c,id,t,cx,low){
 const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)},lg=(y0,y1,st)=>{const g=c.createLinearGradient(0,y0,0,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g};
 c.save();c.lineCap='butt';
 if(id===0){R(-700,-150,2800,FLOOR+150,lg(-150,FLOOR,[[0,'#0b0420'],[.6,'#35105a'],[1,'#7a1d6b']]));
  c.save();c.translate(cx*.6,0);for(let i=-8;i<26;i++){const bx=i*100,bh=140+hsh(i)*170;R(bx,FLOOR-bh-40,90,bh+40,'#160a33');if(!low)for(let j=0;j<bh/22;j++)for(let k=0;k<3;k++)if(hsh(i*50+j*7+k)>.62)R(bx+10+k*26,FLOOR-bh-30+j*22,12,10,hsh(i+j)>.5?'#ffb0e8':'#7ff3ff')}c.restore();
  c.save();c.translate(cx*.3,0);for(let i=-6;i<16;i++){const bx=i*170,bh=110+hsh(i+40)*120;R(bx,FLOOR-bh-10,150,bh+10,'#0d0620');const cl=['#ff3ea5','#27e9ff','#b5ff3d'][i%3];c.strokeStyle=cl;c.lineWidth=4;if(!low){c.shadowColor=cl;c.shadowBlur=14}c.globalAlpha=.65+.35*Math.sin(t*.07+i*2);c.strokeRect(bx+20,FLOOR-bh+10,110,34);c.globalAlpha=1;c.shadowBlur=0}c.restore();
  R(-700,FLOOR,2800,200,lg(FLOOR,540,[[0,'#2a1745'],[1,'#0b0618']]));for(let i=-4;i<18;i++){c.fillStyle=i%2?'rgba(255,62,165,.2)':'rgba(39,233,255,.2)';c.fillRect(i*90+((i*37)%50),FLOOR+10+((i*29)%80),110,3)}R(-700,FLOOR,2800,3,'#ff3ea5');
  c.strokeStyle='rgba(170,200,255,.35)';c.lineWidth=1;c.beginPath();for(let i=0;i<(low?25:80);i++){const x=cx-700+((i*97+t*5)%1400),y=((i*53+t*18)%540);c.moveTo(x,y);c.lineTo(x-4,y+14)}c.stroke()}
 else if(id===1){R(-700,-150,2800,FLOOR+150,lg(-150,FLOOR,[[0,'#0f1b2d'],[.7,'#2c3a46'],[1,'#6a5646']]));c.fillStyle='#e9e4c8';c.beginPath();c.arc(cx*.8+260,90,38,0,7);c.fill();
  c.save();c.translate(cx*.6,0);c.fillStyle='#17262e';c.beginPath();c.moveTo(-700,FLOOR);for(let i=-7;i<26;i++)c.lineTo(i*100,FLOOR-80-hsh(i)*150);c.lineTo(2400,FLOOR);c.fill();c.restore();
  c.save();c.translate(cx*.3,0);R(-700,FLOOR-330,2800,26,'#2c2a28');for(let i=-3;i<10;i++){const x=i*260;R(x,FLOOR-310,64,310,'#4f4b45');R(x-8,FLOOR-330,80,22,'#3b3834');c.strokeStyle='#2a2825';c.lineWidth=2;c.beginPath();c.moveTo(x+20,FLOOR-280);c.lineTo(x+30,FLOOR-230);c.lineTo(x+18,FLOOR-190);c.stroke();
   R(x+66,FLOOR-200,8,50,'#3a2a1a');const fk=Math.sin(t*.3+i*3)*4;const g=c.createRadialGradient(x+70,FLOOR-212,2,x+70,FLOOR-212,low?30:70);g.addColorStop(0,'rgba(255,170,60,.7)');g.addColorStop(1,'rgba(255,120,30,0)');c.fillStyle=g;c.fillRect(x-10,FLOOR-290,160,160);c.fillStyle='#ff9a2a';c.beginPath();c.ellipse(x+70,FLOOR-214,7,14+fk,0,0,7);c.fill();c.fillStyle='#ffe27a';c.beginPath();c.ellipse(x+70,FLOOR-211,3.5,8+fk/2,0,0,7);c.fill()}c.restore();
  R(-700,FLOOR,2800,200,lg(FLOOR,540,[[0,'#575349'],[1,'#2d2b27']]));c.strokeStyle='#2b2925';c.lineWidth=2;c.beginPath();for(const y of[FLOOR+22,FLOOR+50,FLOOR+88])c.moveTo(-700,y),c.lineTo(1900,y);for(let i=-12;i<30;i++){const x0=i*80;c.moveTo(x0,FLOOR);c.lineTo(640+(x0-640)*1.7,540)}c.stroke();
  if(!low)for(let i=0;i<7;i++){c.fillStyle='rgba(220,230,240,.07)';c.beginPath();c.ellipse(cx-700+((i*330+t*.5)%1800),FLOOR-10-i*9,260,38,0,0,7);c.fill()}}
 else if(id===2){R(-700,-150,2800,FLOOR+150,lg(-150,FLOOR,[[0,'#2c1a0c'],[1,'#4a2e17']]));
  c.save();c.translate(cx*.2,0);for(let i=-5;i<12;i++){const x=i*150;R(x+10,FLOOR-330,130,250,'#f3e3b8');c.strokeStyle='#6b4a28';c.lineWidth=3;c.beginPath();for(let k=1;k<4;k++){c.moveTo(x+10+k*32,FLOOR-330);c.lineTo(x+10+k*32,FLOOR-80)}for(let k=1;k<6;k++){c.moveTo(x+10,FLOOR-330+k*42);c.lineTo(x+140,FLOOR-330+k*42)}c.stroke();R(x-2,FLOOR-345,14,355,'#2a170a')}c.restore();
  R(-700,FLOOR-350,2800,22,'#1f1006');c.fillStyle='#b3201f';c.beginPath();c.arc(cx*.2+640,FLOOR-200,0,0,7);c.fill();
  for(let i=-2;i<8;i++){const x=cx*.2+i*320+80,sw=Math.sin(t*.03+i)*4;c.strokeStyle='#222';c.lineWidth=2;c.beginPath();c.moveTo(x,-10);c.lineTo(x+sw,FLOOR-360+60);c.stroke();const g=c.createRadialGradient(x+sw,FLOOR-290,3,x+sw,FLOOR-290,low?30:80);g.addColorStop(0,'rgba(255,150,60,.55)');g.addColorStop(1,'rgba(255,100,40,0)');c.fillStyle=g;c.fillRect(x+sw-90,FLOOR-380,180,180);R(x+sw-17,FLOOR-312,34,48,'#c9282b');R(x+sw-17,FLOOR-312,34,5,'#2a1a1a');R(x+sw-17,FLOOR-269,34,5,'#2a1a1a')}
  R(-700,FLOOR,2800,200,lg(FLOOR,540,[[0,'#b07a38'],[1,'#6e4519']]));c.strokeStyle='#5a3812';c.lineWidth=2;c.beginPath();for(const y of[FLOOR+12,FLOOR+30,FLOOR+54,FLOOR+88])c.moveTo(-700,y),c.lineTo(1900,y);for(let i=-12;i<30;i++){const x0=i*110;c.moveTo(x0,FLOOR);c.lineTo(640+(x0-640)*1.6,540)}c.stroke();R(-700,-150,2800,FLOOR+150,'rgba(255,190,110,.08)')}
 else if(id===3){R(-700,-150,2800,FLOOR+150,lg(-150,FLOOR,[[0,'#3f86d8'],[.7,'#bcdcff'],[1,'#eef6ff']]));c.fillStyle='#fff6c8';c.beginPath();c.arc(cx*.9+330,100,36,0,7);c.fill();
  c.save();c.translate(cx*.7,0);c.fillStyle='#7e9cc0';c.beginPath();c.moveTo(-700,FLOOR);for(let i=-7;i<26;i++){c.lineTo(i*110,FLOOR-110-hsh(i+3)*230);c.lineTo(i*110+55,FLOOR-60-hsh(i+9)*100)}c.lineTo(2600,FLOOR);c.fill();c.restore();
  c.save();c.translate(cx*.4,0);c.fillStyle='#566f8f';c.beginPath();c.moveTo(-700,FLOOR);for(let i=-5;i<18;i++){const px=i*160,py=FLOOR-90-hsh(i+20)*160;c.lineTo(px,py);c.lineTo(px+80,FLOOR-50)}c.lineTo(2600,FLOOR);c.fill();c.restore();
  c.fillStyle='rgba(255,255,255,.88)';for(let i=0;i<7;i++){const x=((i*340-t*(.35+i%3*.25))%2000+2000)%2000-400+cx*.2,y=50+(i*47)%170;for(let k=0;k<4;k++){c.beginPath();c.ellipse(x+k*34,y+(k%2)*8,44,20,0,0,7);c.fill()}}
  R(-700,FLOOR,2800,200,lg(FLOOR,540,[[0,'#7b7873'],[1,'#403d39']]));c.strokeStyle='#3a3733';c.lineWidth=2;c.beginPath();for(let i=0;i<14;i++){const x=i*110-100;c.moveTo(x,FLOOR+8+i%3*8);c.lineTo(x+36,FLOOR+30+(i%4)*14);c.lineTo(x+22,FLOOR+60+(i%3)*10)}c.stroke();R(-700,FLOOR,2800,4,'#a8a49c');
  if(!low){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();for(let i=0;i<10;i++){const x=cx-700+((i*230+t*14)%1400),y=100+i*28;c.moveTo(x,y);c.lineTo(x-60,y+4)}c.stroke()}}
 else{R(-700,-150,2800,FLOOR+150,lg(-150,FLOOR,[[0,'#03061a'],[1,'#143066']]));
  if(!low)for(let i=0;i<3;i++){const x=cx*.3+200+i*420+Math.sin(t*.02+i*2)*130,g=c.createLinearGradient(x,-20,x,FLOOR);g.addColorStop(0,'rgba(180,230,255,.28)');g.addColorStop(1,'rgba(180,230,255,0)');c.fillStyle=g;c.beginPath();c.moveTo(x-8,-20);c.lineTo(x+8,-20);c.lineTo(x+120,FLOOR);c.lineTo(x-120,FLOOR);c.fill()}
  for(let r=0;r<3;r++)for(let i=-10;i<100;i+=1){const x=i*14+r*5,y=FLOOR-170+r*30+Math.sin(t*.1+i)*(low?0:1.5);c.fillStyle=['#4aa3ff','#ff5ac8','#ffd23f','#6dffb2'][(i*7+r)%4];c.globalAlpha=.55;c.fillRect(x,y,6,9);c.globalAlpha=1}
  R(-700,FLOOR-86,2800,86,'#0a1230');R(-700,FLOOR-88,2800,3,'#27e9ff');
  R(-700,FLOOR,2800,200,lg(FLOOR,540,[[0,'#112256'],[1,'#050b22']]));c.strokeStyle='rgba(39,233,255,.28)';c.lineWidth=1.5;c.beginPath();for(let i=-14;i<34;i++){const x0=i*80;c.moveTo(x0,FLOOR);c.lineTo(640+(x0-640)*1.8,540)}c.stroke();
  c.strokeStyle='#27e9ff';c.lineWidth=3;if(!low){c.shadowColor='#27e9ff';c.shadowBlur=12}c.setLineDash([60,30]);c.lineDashOffset=-t*2;for(const y of[FLOOR+16,FLOOR+60]){c.beginPath();c.moveTo(-700,y);c.lineTo(1900,y);c.stroke()}c.setLineDash([]);c.shadowBlur=0}
 c.restore()}

/* ---------- EFFECTS ---------- */
function spark(x,y,lvl,col,dir){const n=Math.round((4+lvl*4)*(LOW()?.5:1));FX.fl.push({x,y,t:0,max:6+lvl*2,r:14+lvl*10,col});for(let i=0;i<n;i++)FX.sp.push({x,y,vx:dir*rnd(1,6)+rnd(-3,3),vy:rnd(-5,2),life:rnd(12,22)+lvl*3,col,s:rnd(2,4)})}
function dust(x,y){const n=LOW()?3:8;for(let i=0;i<n;i++)FX.sp.push({x:x+rnd(-20,20),y,vx:rnd(-2,2),vy:rnd(-2,-.3),life:rnd(14,26),col:'#cfcfcf',s:rnd(3,6)})}
function num(x,y,txt,col,sz){FX.nm.push({x,y,txt,col,t:0,sz:sz||22})}

/* ---------- COMBAT ---------- */
const st=(f,s)=>{if(f.state!==s){f.state=s;f.t=0}};
function pickMove(f,a,c){const fx=c.x*f.face;if(f.y<FLOOR-2)return'air';
 if(f.chain>=2&&f.state==='attack'&&(a==='k'||a==='hk')&&f.st>=CFG.cost.fin)return'fin';
 if(a==='hp'&&c.y>.4&&fx>.3)return'sp';if(a==='p'&&fx>.4)return'fp';if(a==='k'&&fx<-.4)return'bk';return{p:'lp',hp:'hp',k:'lk',hk:'hk'}[a]}
function startAtk(f,o,a,c,cancel){const name=pickMove(f,a,c),m=MV[name],cost=m.cost||0;
 if(f.st<cost){f.deny=20;AU.sfx('deny');return false}
 f.st-=cost;if(cost>=7)f.stD=50;f.chain=cancel?f.chain+1:1;f.state='attack';f.t=0;f.f=0;f.mv=m;f.mn=name;f.hit=false;f.vx*=.5;
 if(name==='sp')num(f.x,f.y-170,f.ch.special.toUpperCase(),f.ch.c2,15);return true}
function tryHit(f,o,m){if(o.inv>0||NOHIT.has(o.state))return;
 const hb={x1:f.face>0?f.x+10:f.x-m.reach,x2:f.face>0?f.x+m.reach:f.x-10,y1:f.y+m.y1,y2:f.y+m.y2};
 const cr=o.state==='crouch'||o.state==='cblock'||(o.state==='attack'&&o.mn==='bk'),hu={x1:o.x-24,x2:o.x+24,y1:o.y-(cr?78:152),y2:o.y};
 if(hb.x1>hu.x2||hb.x2<hu.x1||hb.y1>hu.y2||hb.y2<hu.y1)return;
 const cx=(Math.max(hb.x1,hu.x1)+Math.min(hb.x2,hu.x2))/2,cy=(Math.max(hb.y1,hu.y1)+Math.min(hb.y2,hu.y2))/2;f.hit=true;resolve(f,o,m,cx,cy)}
function resolve(f,o,m,cx,cy){
 const dmg=Math.max(1,Math.round(m.dmg*(.8+f.ch.attack*.04)/(.8+o.ch.defense*.04))),lvl=m.lvl,col=m.snd==='sp'?f.ch.c2:lvl>=3?'#ff7a2f':lvl===2?'#ffd23f':'#fff6a0';
 const blocking=(o.state==='block'&&!m.low)||o.state==='cblock'||(o.state==='bhit'&&(!m.low||o.cb));
 if(blocking){const chip=lvl>=3?Math.min(Math.max(1,Math.round(dmg*.1)),o.hp-1):0;
  if(chip>0){o.hp-=chip;num(o.x+rnd(-10,10),o.y-140,'-'+chip,'#ff9a3d',18)}
  o.st=Math.max(0,o.st-3*lvl);o.stD=40;o.cb=o.state==='cblock'||(o.state==='bhit'&&o.cb);st(o,'bhit');o.t=0;o.stun=8+lvl*2;o.vx=f.face*(2+lvl);f.vx=-f.face*1.5;
  AU.sfx('block');spark(cx,cy,1,'#8fd3ff',f.face);G.hs=Math.max(G.hs,3);return}
 o.hp=Math.max(0,o.hp-dmg);f.cn=(o.state==='hit'||o.state==='fall')?f.cn+1:1;f.cd+=dmg;f.cshow=0;
 num(o.x+rnd(-14,14),o.y-150-(f.cn%3)*16,'-'+dmg,lvl>=3?'#ff3b3b':'#ffd23f',lvl>=3?28:22);
 spark(cx,cy,lvl,col,f.face);AU.sfx(m.snd);AU.sfx('hit');G.hs=Math.max(G.hs,[0,3,5,8,10][lvl]);G.shake=Math.max(G.shake,[0,0,3,7,9][lvl]);
 o.flash=5;o.chain=0;o.cb=false;
 if(m.kd||o.hp<=0||o.y<FLOOR-4){st(o,'fall');o.t=0;o.ko=o.hp<=0;o.vy=o.ko?-11:-8.5;o.vx=f.face*(lvl>=4?7.5:6)*(o.ko?1.2:1);o.fallBack=o.face===-f.face;o.y=Math.min(o.y,FLOOR-1);if(o.ko)AU.sfx('ko')}
 else{st(o,'hit');o.t=0;o.stun=lvl===1?13:18;o.vx=f.face*(2+lvl*1.5);o.heavy=lvl>=2}
 if(o.x<=BL+6||o.x>=BR-6)f.vx=-f.face*3}

function land(f){switch(f.state){
 case'jump':st(f,'land');f.vx*=.3;dust(f.x,FLOOR);break;
 case'attack':if(f.mv&&f.mv.air){st(f,'land');f.chain=0;f.vx*=.3;dust(f.x,FLOOR)}break;
 case'fall':if(f.ko){st(f,'ko')}else{st(f,'ground')}AU.sfx('fall');G.shake=Math.max(G.shake,4);dust(f.x,FLOOR);break;
 case'hit':st(f,'idle');break}}

function upd(f,o,c,live){
 f.t++;if(f.inv>0)f.inv--;if(f.stD>0)f.stD--;if(f.flash>0)f.flash--;if(f.deny>0)f.deny--;
 const q=IN[f.p].q;if(!live)q.length=0;else while(q.length&&FR-q[0].t>9)q.shift();
 let fx=c.x*f.face;
 if(live){const sg=fx>.5?1:fx<-.5?-1:0;if(sg!==f.psg){if(sg===1){f.runArm=FR-f.tf<16;f.tf=FR}else if(sg===-1){if(FR-f.tb<16)f.dodgeReq=true;f.tb=FR}f.psg=sg}if(sg!==1&&f.state!=='run')f.runArm=false}
 const spd=2.1+f.ch.speed*.24;
 switch(f.state){
 case'idle':case'walkF':case'walkB':case'run':case'crouch':case'block':case'cblock':{
  if(f.y>=FLOOR&&f.face!==(o.x>=f.x?1:-1)){f.face=o.x>=f.x?1:-1;fx=c.x*f.face}
  if(f.dodgeReq){f.dodgeReq=false;if(live&&f.st>=CFG.dodge){f.st-=CFG.dodge;f.stD=45;f.inv=20;f.vx=-f.face*7;st(f,'dodge');AU.sfx('whoosh');break}}
  if(live&&q.length){const a=q.shift().a;if(startAtk(f,o,a,c,false))break}
  if(live&&c.y<-.5){st(f,'jump');f.vy=-14.6;f.vx=Math.sign(c.x)*spd*1.15;f.cb=false;AU.sfx('whoosh');break}
  const dist=Math.abs(o.x-f.x),thr=(o.state==='attack'&&dist<230)||dist<120;
  if(c.y>.5){st(f,fx<-.3&&thr?'cblock':'crouch');f.cb=f.state==='cblock';f.vx=0}
  else if(fx<-.3&&thr){st(f,'block');f.cb=false;f.vx=0}
  else if(Math.abs(c.x)>.01){const dir=Math.sign(c.x),run=fx>.5&&(f.runArm||Math.abs(c.x)>=.99)&&f.st>0;
   if(run){st(f,'run');f.vx=dir*spd*1.85;f.st=Math.max(0,f.st-CFG.run/60);f.stD=Math.max(f.stD,20);f.runArm=true}
   else{st(f,fx>0?'walkF':'walkB');f.vx=dir*spd*(.55+.45*Math.min(1,Math.abs(c.x)))}}
  else{st(f,'idle');f.vx=0}
  if(f.stD<=0)f.st=Math.min(CFG.st,f.st+((f.state==='idle'||f.state==='crouch'||f.state==='block'||f.state==='cblock')?CFG.idle/60:f.state==='run'?0:CFG.move/60));
  break}
 case'attack':{const m=f.mv;f.f++;
  if(m.lunge&&f.f<=m.s+m.a)f.vx=f.face*m.lunge;else if(!m.air)f.vx*=.6;
  if(f.f===m.s)AU.sfx('whoosh');
  if(f.f>=m.s&&f.f<m.s+m.a&&!f.hit)tryHit(f,o,m);
  if(f.hit&&!m.end&&f.f>m.s&&q.length){const a=q[0].a;q.shift();if(startAtk(f,o,a,c,true))break}
  if(f.state==='attack'&&f.f>=m.s+m.a+m.r){f.chain=0;st(f,f.y<FLOOR-2?'jump':'idle')}
  if(f.stD<=0&&!m.air)f.st=Math.min(CFG.st,f.st+.02);break}
 case'jump':if(live&&q.length){const a=q.shift().a;startAtk(f,o,a,c,false)}break;
 case'land':f.vx*=.8;if(f.t>=6)st(f,'idle');break;
 case'dodge':f.vx*=.88;if(f.t>=22)st(f,'idle');break;
 case'hit':f.vx*=.85;if(--f.stun<=0)st(f,'idle');break;
 case'bhit':f.vx*=.85;if(--f.stun<=0)st(f,f.cb?'cblock':'block');break;
 case'fall':f.vx*=.98;break;
 case'ground':f.vx*=.86;if(f.t>=40){st(f,'getup');f.inv=30;AU.sfx('getup')}break;
 case'getup':f.vx=0;if(f.t>=26)st(f,'idle');break;
 case'ko':case'win':case'lose':f.vx*=.8;break}
 const wasAir=f.y<FLOOR;f.x=clamp(f.x+f.vx,BL,BR);
 if(f.y<FLOOR||f.vy<0){f.vy+=GRAV;f.y+=f.vy;if(f.y>=FLOOR){f.y=FLOOR;f.vy=0;land(f)}}
 if(f.y>=FLOOR&&f.state==='jump')land(f)}

/* ---------- AI ---------- */
const AIP={easy:{rt:26,ag:.012,bl:.3,cb:.25,sp:.03,jp:.003,dg:.004},normal:{rt:14,ag:.03,bl:.55,cb:.55,sp:.1,jp:.006,dg:.012},hard:{rt:6,ag:.06,bl:.82,cb:.8,sp:.2,jp:.01,dg:.025}};
function think(f,o){const i=IN[f.p],a=f.ai||(f.ai={wait:30,seen:0,bt:0,mt:0,mode:'in',jp:0}),L=AIP[G.aiLvl];i.ax=0;i.ay=0;if(G.mode==='practice'||G.phase!=='fight')return;
 const d=Math.abs(o.x-f.x),dir=o.x>f.x?1:-1;a.wait--;a.bt--;a.mt--;
 if(o.state==='attack'&&d<190)a.seen++;else a.seen=0;
 if(a.seen===L.rt&&Math.random()<L.bl)a.bt=22+ri(16);
 if(a.seen===L.rt&&Math.random()<L.dg*8&&f.st>CFG.dodge)f.dodgeReq=true;
 if(a.bt>0&&FREE.has(f.state)){i.ax=-dir;return}
 if(f.state==='attack'){if(f.hit&&Math.random()<L.cb*.1)i.q.push({a:Math.random()<.5?'p':'k',t:FR});return}
 if(!FREE.has(f.state))return;
 if(a.mt<=0){a.mt=15+ri(25);a.mode=d>140?'in':d<60?(Math.random()<.45?'out':'hold'):'hold'}
 if(a.mode==='in'){i.ax=dir;if(G.aiLvl==='hard'&&d>320&&f.st>40)f.runArm=true}else if(a.mode==='out')i.ax=-dir;
 if(d<125&&a.wait<=0&&Math.random()<L.ag*3){
  const pool=[];if(f.st>=CFG.cost.sp+8&&d>70&&Math.random()<L.sp*3){i.ax=dir;i.ay=.8;i.q.push({a:'hp',t:FR})}
  else{pool.push('p','p','k','k');if(f.st>30)pool.push('hp','hk');i.q.push({a:pool[ri(pool.length)],t:FR})}
  a.wait=Math.round(rnd(L.rt*.6,L.rt*2))}
 if(Math.random()<L.jp&&d<260)i.ay=-1}

/* ---------- MATCH FLOW ---------- */
const H={n:[0,$('#p1-name'),$('#p2-name')],hf:[0,$('#p1-health'),$('#p2-health')],tr:[0,$('#p1-trail'),$('#p2-trail')],hp:[0,$('#p1-hp'),$('#p2-hp')],sf:[0,$('#p1-stamina'),$('#p2-stamina')],st:[0,$('#p1-st'),$('#p2-st')],pt:[0,$('#p1-points'),$('#p2-points')],rd:[0,$('#p1-rounds'),$('#p2-rounds')],cb:[0,$('#combo1'),$('#combo2')]};
const banner=$('#banner');
function say(txt,cls=''){banner.className='';void banner.offsetWidth;banner.textContent=txt;banner.className='show '+cls}
let lastCfg=null;
function startMatch(mode,c1,c2){lastCfg={mode,c1,c2};G.mode=mode;G.round=1;G.pts=[0,0,0];G.wins=[0,0,0];G.playing=true;G.paused=false;G.hard=false;G.n=0;
 G.aiLvl=S.ai;if(mode==='tournament'){G.tour.i=0;G.aiLvl=['easy','normal','hard'][0]}
 P[1]=new F(1,CH[c1]);P[2]=new F(2,CH[c2]);IN[2].cpu=mode!=='two';IN[1].cpu=false;releaseInputs();
 showScreen(null);$('#result').classList.add('hidden');shell.classList.add('playing');AU.music(S.arena);newRound()}
function newRound(carry){const a=P[1],b=P[2],hp1=carry?a.hp:CFG.hp;FX.sp.length=FX.fl.length=FX.nm.length=0;
 a.reset(500,1);b.reset(780,-1);if(carry)a.hp=a.trail=hp1;G.phase='intro';G.pt=0;G.timer=CFG.timer;G.tf=0;G.hs=0;FR+=0;releaseInputs();
 IN[1].q.length=IN[2].q.length=0;if(G.mode==='survival'&&carry){a.hp=Math.min(CFG.hp,hp1+50)}}
function roundLabel(){return G.mode==='practice'?'PRACTICE':G.mode==='survival'?'STAGE '+(G.n+1):G.round>=CFG.rounds?'FINAL ROUND':'ROUND '+G.round}
function endRound(why){const a=P[1],b=P[2];let w=0;if(a.hp>b.hp)w=1;else if(b.hp>a.hp)w=2;G.rw=w;G.why=why;
 if(w){G.pts[w]+=CFG.pts;G.wins[w]++}
 G.phase=why==='ko'?'ko':'time';G.pt=0;if(why==='ko')say('K.O.','ko');else say('TIME UP','sm')}
function afterRound(){
 const m=G.mode;
 if(m==='practice'){newRound();return}
 if(m==='survival'){if(G.rw===1){G.n++;const c=ri(CH.length);P[2]=new F(2,CH[c]);G.aiLvl=['easy','normal','hard'][Math.min(2,['easy','normal','hard'].indexOf(S.ai)+Math.floor(G.n/3))];G.pts[2]=0;newRound(true);return}matchEnd();return}
 if(G.round>=CFG.rounds){matchEnd();return}
 G.round++;newRound()}
function matchEnd(){G.phase='over';const m=G.mode,p=G.pts;let title,sub=`P1 ${p[1]} PTS  —  P2 ${p[2]} PTS`,btn='REMATCH',act=()=>startMatch(lastCfg.mode,lastCfg.c1,lastCfg.c2),win=p[1]>p[2],draw=p[1]===p[2];
 const set=(w,l)=>{[1,2].forEach(i=>{const f=P[i];if(f.state!=='ko'){f.state=(i===w)?'win':'lose';f.t=0;f.vx=0;f.y=FLOOR;f.vy=0}})};
 if(m==='two'){title=draw?'DRAW':win?'PLAYER 1 WINS':'PLAYER 2 WINS';if(!draw)set(win?1:2)}
 else if(m==='vs'){title=draw?'DRAW':win?'YOU WIN!':'YOU LOSE';if(!draw)set(win?1:2)}
 else if(m==='survival'){title='SURVIVAL OVER';sub=`You defeated ${G.n} opponent${G.n===1?'':'s'}`;btn='TRY AGAIN';set(2,1)}
 else if(m==='tournament'){const names=['QUARTER-FINAL','SEMI-FINAL','FINAL'];
  if(win){if(G.tour.i>=2){title='CHAMPION!';sub='You won the tournament';btn='PLAY AGAIN';set(1,2)}
   else{title='ROUND CLEARED';sub=names[G.tour.i]+' won — '+sub;btn='NEXT FIGHT';set(1,2);act=()=>{G.tour.i++;const c=G.tour.order[G.tour.i];G.aiLvl=['easy','normal','hard'][G.tour.i];G.round=1;G.pts=[0,0,0];G.wins=[0,0,0];P[1]=new F(1,CH[lastCfg.c1]);P[2]=new F(2,CH[c]);$('#result').classList.add('hidden');newRound()}}}
  else{title='ELIMINATED';sub=names[G.tour.i]+' lost — '+sub;btn='RETRY';set(2,1)}}
 AU.sfx(win||m==='two'&&!draw?'win':'lose');setTimeout(()=>{if(G.phase==='over'){AU.music('victory')}},600);
 $('#r-title').textContent=title;$('#r-sub').textContent=sub;$('#r-main').textContent=btn;G.resAct=()=>{$('#result').classList.add('hidden');act()};$('#result').classList.remove('hidden')}

function step(){FR++;const a=P[1],b=P[2],ph=G.phase,pt=G.pt++;
 if(ph==='intro'){if(pt===0){say(roundLabel(),'');AU.sfx('round')}if(pt===70){say('READY...','sm')}if(pt===120){say('FIGHT!','');AU.sfx('fight')}if(pt>=165){G.phase='fight';G.pt=0}
  upd(a,b,{x:0,y:0},false);upd(b,a,{x:0,y:0},false)}
 else if(ph==='fight'){G.tf++;if(G.mode!=='practice'&&G.tf%60===0&&G.timer>0)G.timer--;
  if(IN[2].cpu)think(b,a);upd(a,b,ctrl(1),true);upd(b,a,ctrl(2),true);
  if(G.mode==='practice'){if(b.state==='ko'&&b.t>90||a.state==='ko'&&a.t>90){newRound()}}
  else if(a.hp<=0||b.hp<=0)endRound('ko');else if(G.timer<=0)endRound('time')}
 else if(ph==='ko'||ph==='time'){upd(a,b,{x:0,y:0},false);upd(b,a,{x:0,y:0},false);if(pt>(ph==='ko'?95:60)){G.phase='end';G.pt=0;
   const w=G.rw;[1,2].forEach(i=>{const f=P[i];if(w&&i===w&&f.state!=='ko'){f.state='win';f.t=0;f.vx=0;f.y=FLOOR;f.vy=0}else if(w&&f.state!=='ko'){f.state='lose';f.t=0}});
   say(w?`PLAYER ${w} WINS`:'DRAW','sm');if(G.mode==='vs'||G.mode==='tournament'||G.mode==='survival')say(w===1?'YOU WIN':w===2?'YOU LOSE':'DRAW','sm');AU.sfx(w===1||(w&&G.mode==='two')?'win':'lose')}}
 else if(ph==='end'){upd(a,b,{x:0,y:0},false);upd(b,a,{x:0,y:0},false);if(pt>115)afterRound()}
 else if(ph==='over'){upd(a,b,{x:0,y:0},false);upd(b,a,{x:0,y:0},false)}
 // push boxes
 const dx=b.x-a.x;if(Math.abs(dx)<38&&a.y>FLOOR-50&&b.y>FLOOR-50){const pu=(38-Math.abs(dx))/2,sg=dx>=0?1:-1;a.x=clamp(a.x-sg*pu,BL,BR);b.x=clamp(b.x+sg*pu,BL,BR)}
 // combo end tracking
 [[a,b],[b,a]].forEach(([f,o])=>{if(f.cn>0&&o.state!=='hit'&&o.state!=='fall'){if(f.cn>=2){f.cshow=100;f.ctxt=`COMBO ${f.cn} HITS  -${f.cd}`}f.cn=0;f.cd=0}if(f.cshow>0)f.cshow--});
 // particles
 FX.sp.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.life--});FX.sp=FX.sp.filter(p=>p.life>0);FX.fl.forEach(f=>f.t++);FX.fl=FX.fl.filter(f=>f.t<f.max);FX.nm.forEach(n=>{n.t++;n.y-=.9});FX.nm=FX.nm.filter(n=>n.t<50)}

function updateHud(){const a=P[1],b=P[2];
 for(const i of[1,2]){const f=P[i];H.n[i].textContent=f.ch.name+(i===2&&G.mode!=='two'?' (CPU)':'');const pc=f.hp/CFG.hp*100;f.trail=Math.max(f.hp,f.trail-.7);H.hf[i].style.width=pc+'%';H.tr[i].style.width=f.trail/CFG.hp*100+'%';
  H.hp[i].textContent=`${Math.ceil(f.hp)} / ${CFG.hp}`;H.sf[i].style.width=f.st+'%';H.st[i].textContent=Math.round(f.st)+'%';H.sf[i].parentNode.classList.toggle('deny',f.deny>0);
  H.pt[i].textContent='PTS: '+G.pts[i];const w=G.mode==='survival'?(i===1?G.n:0):G.wins[i];H.rd[i].textContent=G.mode==='practice'?'':('● '.repeat(Math.min(w,3))+'○ '.repeat(Math.max(0,(G.mode==='survival'?0:CFG.rounds)-w))).trim();
  H.cb[i].textContent=f.cn>=2?`${f.cn} HITS!`:f.cshow>0?f.ctxt:''}
 $('#timer').textContent=G.mode==='practice'?'∞':G.timer;$('#round-label').textContent=roundLabel();$('#callout').textContent=G.phase==='fight'?'FIGHT':G.phase==='intro'?'READY':'VS'}

/* ---------- RENDER ---------- */
let vw=960,sc=1,ox=0,oy=0;
function resize(){const dpr=Math.min(devicePixelRatio||1,LOW()?1:2),W=innerWidth,Hh=innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(Hh*dpr);cv.style.width=W+'px';cv.style.height=Hh+'px';
 let s=Hh/540,v=W/s;if(v<960){s=W/960;v=960}if(v>1280){v=1280}sc=s*dpr;vw=v;ox=(W*dpr-v*sc)/2;oy=(Hh*dpr-540*sc)/2}
addEventListener('resize',resize);
function shadow(f){const h=FLOOR-f.y,lying=f.state==='ground'||f.state==='ko'||f.state==='fall'&&f.t>10,rx=(lying?62:36)-h*.12;ctx.fillStyle=`rgba(0,0,0,${clamp(.42-h/420,.1,.42)})`;ctx.beginPath();ctx.ellipse(f.x,FLOOR+6,Math.max(14,rx),8,0,0,7);ctx.fill()}
function drawF(f){const Pz=pose(f);Pz.sp=f.mn==='sp'&&f.state==='attack';ctx.save();ctx.translate(f.x,f.y);let off=0;if(f.state==='win')off=-Math.abs(Math.sin(f.t*.12))*8;ctx.translate(0,off);drawFig(ctx,f.ch,Pz,f.face,f.flash,f.ch.c2);ctx.restore()}
function render(ts){const W=cv.width,Hh=cv.height,t=ts/16.667;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#050816';ctx.fillRect(0,0,W,Hh);if(!P[1])return;
 const a=P[1],b=P[2],dist=Math.abs(a.x-b.x),tz=lerp(1.2,1,clamp((dist-150)/500,0,1)),mid=(a.x+b.x)/2;G.cam.z=lerp(G.cam.z,tz,.08);const z=G.cam.z,hv=vw/2/z;G.cam.cx=lerp(G.cam.cx,clamp(mid,hv,WORLD-hv),.12);const cx=G.cam.cx;
 const sh=G.shake>0.3?G.shake:0,shx=sh?rnd(-sh,sh):0,shy=sh?rnd(-sh,sh):0;
 ctx.setTransform(sc,0,0,sc,ox,oy);ctx.beginPath();ctx.rect(0,0,vw,540);ctx.clip();ctx.translate(vw/2+shx,FLOOR+shy);ctx.scale(z,z);ctx.translate(-cx,-FLOOR);
 drawArena(ctx,S.arena,t,cx,LOW());
 shadow(a);shadow(b);const order=a.y<b.y?[b,a]:[a,b];order.forEach(drawF);
 FX.fl.forEach(f=>{const k=f.t/f.max;ctx.globalAlpha=1-k;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.4+k*.8),0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<8;i++){const an=i*Math.PI/4+f.x,r1=f.r*.5*k,r2=f.r*(.8+k);ctx.moveTo(f.x+Math.cos(an)*r1,f.y+Math.sin(an)*r1);ctx.lineTo(f.x+Math.cos(an)*r2,f.y+Math.sin(an)*r2)}ctx.stroke();ctx.globalAlpha=1});
 FX.sp.forEach(p=>{ctx.globalAlpha=clamp(p.life/14,0,1);ctx.fillStyle=p.col;ctx.fillRect(p.x,p.y,p.s,p.s)});ctx.globalAlpha=1;
 ctx.textAlign='center';FX.nm.forEach(n=>{ctx.globalAlpha=clamp(1-n.t/50,0,1);ctx.font=`900 ${n.sz}px Arial`;ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.strokeText(n.txt,n.x,n.y);ctx.fillStyle=n.col;ctx.fillText(n.txt,n.x,n.y)});ctx.globalAlpha=1;
 if(G.shake>0)G.shake*=.82}

/* ---------- MAIN LOOP ---------- */
let last=0,acc=0;
function loop(ts){requestAnimationFrame(loop);const dt=Math.min(50,ts-last||16);last=ts;const portrait=innerHeight>innerWidth;
 if(portrait)releaseInputs();
 if(G.playing){if(!G.paused&&!G.hard&&!portrait){acc+=dt*(G.phase==='ko'?.35:1);while(acc>=16.667){acc-=16.667;if(G.hs>0){G.hs--;continue}step()}}updateHud()}
 else if(P[1]){P[1].t++;P[2].t++}
 render(ts)}

/* ---------- UI ---------- */
function showScreen(id){$$('.screen').forEach(e=>e.classList.add('hidden'));if(id){$('#'+id).classList.remove('hidden')}if(id==='menu'){shell.classList.remove('playing');AU.music('menu')}}
const show=(id,v=true)=>$('#'+id).classList.toggle('hidden',!v);
function toMenu(){G.playing=false;G.paused=false;G.hard=false;releaseInputs();['pause','confirm','settings','result'].forEach(i=>show(i,false));P[1]=new F(1,CH[S.p1]);P[2]=new F(2,CH[S.p2]);P[2].face=-1;G.cam.z=1.1;showScreen('menu')}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{AU.init();AU.sfx('click');openSelect(b.dataset.mode)}));
$('#m-start').onclick=()=>{AU.init();AU.sfx('click');const m=lastCfg?lastCfg.mode:'two';openSelect(m)};
$('#m-chars').onclick=()=>{AU.sfx('click');openSelect(null)};
$('#m-arena').onclick=()=>{AU.sfx('click');openArenas('menu')};
$('#m-settings').onclick=()=>{AU.sfx('click');openSettings()};
$('#m-how').onclick=()=>{AU.sfx('click');showScreen('how')};$('#h-back').onclick=()=>{AU.sfx('click');showScreen('menu')};

/* character select */
const sel={mode:null,active:1,lock:[0,false,false],pick:[0,0,1]};
const grid=$('#grid'),pv=[0,$('#pv1').getContext('2d'),$('#pv2').getContext('2d')];let selOpen=false;
function bust(cv2,ch){const c=cv2.getContext('2d');c.clearRect(0,0,cv2.width,cv2.height);c.save();c.translate(cv2.width/2,cv2.height*.95+ch.sc*30);c.scale(.62,.62);drawFig(c,ch,Object.assign(pose({state:'idle',t:0}),{lean:.05}),1,0);c.restore()}
CH.forEach((ch,i)=>{const b=document.createElement('button');b.className='card';b.dataset.i=i;b.innerHTML='<canvas width="70" height="70"></canvas><span>'+ch.name+'</span>';b.onclick=()=>{AU.sfx('click');if(sel.lock[sel.active])return;sel.pick[sel.active]=i;refreshSel()};grid.appendChild(b);bust(b.querySelector('canvas'),ch)});
function openSelect(mode){sel.mode=mode;sel.lock=[0,false,false];sel.pick=[0,S.p1,S.p2];sel.active=1;selOpen=true;showScreen('select');$('#sel-p2 .tag').textContent=(mode&&mode!=='two')?'COMPUTER':'PLAYER 2';refreshSel()}
function refreshSel(){const two=sel.mode==='two'||sel.mode===null;
 $$('.card').forEach(c=>{const i=+c.dataset.i;c.classList.toggle('p1',sel.pick[1]===i);c.classList.toggle('p2',two&&sel.pick[2]===i)});
 [1,2].forEach(p=>{const side=$('#sel-p'+p),ch=CH[sel.pick[p]],show2=p===1||two;side.style.opacity=show2?1:.45;side.querySelector('.sname').textContent=show2?ch.name:'RANDOM';side.querySelector('.sstyle').textContent=show2?ch.style:'CPU picks';side.querySelector('.sspec').textContent=show2?'★ '+ch.special:'';
  side.querySelector('.stats').innerHTML=show2?[['ATK',ch.attack],['SPD',ch.speed],['DEF',ch.defense]].map(s=>`<div><b>${s[0]}</b><i><u style="width:${s[1]*10}%"></u></i></div>`).join(''):'';
  const lk=side.querySelector('.lock');lk.textContent=sel.lock[p]?'LOCKED ✓':'LOCK IN';lk.classList.toggle('on',sel.lock[p]);lk.style.visibility=show2?'visible':'hidden'});
 $('#s-arena').textContent='ARENA: '+ARENAS[S.arena];const ready=sel.lock[1]&&(!two||sel.lock[2]);$('#s-start').disabled=sel.mode!==null&&!ready;$('#s-start').textContent=sel.mode===null?'SAVE':'START'}
$$('.lock').forEach(b=>b.onclick=()=>{AU.sfx('click');const p=+b.dataset.lock;sel.lock[p]=!sel.lock[p];if(sel.lock[p]&&p===1&&(sel.mode==='two'||sel.mode===null)&&!sel.lock[2])sel.active=2;else if(!sel.lock[p])sel.active=p;refreshSel()});
$('#sel-p1').onclick=()=>{if(!sel.lock[1]){sel.active=1}};$('#sel-p2').onclick=()=>{if(sel.mode==='two'||sel.mode===null)if(!sel.lock[2])sel.active=2};
$('#s-random').onclick=()=>{AU.sfx('click');if(!sel.lock[sel.active]){sel.pick[sel.active]=ri(CH.length);refreshSel()}};
$('#s-back').onclick=()=>{AU.sfx('click');selOpen=false;showScreen('menu')};
$('#s-arena').onclick=()=>{AU.sfx('click');openArenas('select')};
$('#s-start').onclick=()=>{AU.init();AU.sfx('click');selOpen=false;S.p1=sel.pick[1];S.p2=sel.pick[2];save();if(sel.mode===null){toMenu();return}
 const m=sel.mode;let c2=sel.pick[2];if(m!=='two'){const o=CH.map((_,i)=>i).filter(i=>i!==S.p1);c2=o[ri(o.length)]}
 if(m==='tournament'){const o=CH.map((_,i)=>i).filter(i=>i!==S.p1).sort(()=>Math.random()-.5);G.tour={i:0,order:o.slice(0,3)};c2=G.tour.order[0]}
 AU.init();startMatch(m,S.p1,c2)};
let pvT=0;function pvLoop(){requestAnimationFrame(pvLoop);if(!selOpen)return;pvT++;[1,2].forEach(p=>{const c=pv[p],ch=CH[sel.pick[p]];c.clearRect(0,0,120,150);const g=c.createRadialGradient(60,110,5,60,110,80);g.addColorStop(0,p===1?'#1f4fa0':'#a02a3c');g.addColorStop(1,'#0a1128');c.fillStyle=g;c.fillRect(0,0,120,150);c.save();c.translate(60,138);c.scale(.78,.78);const f={state:'idle',t:pvT,face:1};const Pz=pose(f);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(0,6,34,7,0,0,7);c.fill();drawFig(c,ch,Pz,p===1?1:-1,0);c.restore()})}
pvLoop();
/* arenas */
const ag=$('#arena-grid');let arenaBack='menu';
ARENAS.forEach((n,i)=>{const b=document.createElement('button');b.className='acard';b.innerHTML='<canvas width="192" height="108"></canvas><div>'+n+'</div>';b.onclick=()=>{AU.sfx('click');S.arena=i;save();$$('.acard').forEach((e,k)=>e.classList.toggle('sel',k===i));if(P[1]&&!G.playing)AU.music('menu')};ag.appendChild(b);
 const c=b.querySelector('canvas').getContext('2d');c.save();c.scale(192/960,108/540);c.beginPath();c.rect(0,0,960,540);c.clip();c.translate(-160,0);drawArena(c,i,10,640,true);c.restore()});
function openArenas(from){arenaBack=from;$$('.acard').forEach((e,k)=>e.classList.toggle('sel',k===S.arena));showScreen('arenas')}
$('#a-back').onclick=()=>{AU.sfx('click');if(arenaBack==='select'){showScreen('select');refreshSel()}else showScreen('menu')};
/* settings */
const SI={'s-music':'music','s-sfx':'sfx','s-opacity':'opacity','s-btn':'btn','s-joy':'joy','s-gfx':'gfx','s-timer':'timer','s-ai':'ai'};
function openSettings(){for(const id in SI)$('#'+id).value=S[SI[id]];$('#s-perf').checked=S.perf;show('settings')}
for(const id in SI)$('#'+id).addEventListener('input',e=>{const k=SI[id];S[k]=e.target.type==='range'?+e.target.value:e.target.value;if(k==='timer')S.timer=+S.timer;applySettings();save()});
$('#s-perf').onchange=e=>{S.perf=e.target.checked;applySettings();save()};
$('#s-close').onclick=()=>{AU.sfx('click');show('settings',false)};
$('#s-full').onclick=()=>{const d=document.documentElement;(document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen()).then?.(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch?.(()=>{})};
/* pause */
function openPause(){if(!G.playing||G.phase==='over')return;G.paused=true;G.hard=false;releaseInputs();AU.sfx('pause');show('pause')}
$('#settings-button').addEventListener('pointerdown',e=>{e.preventDefault();openPause()});
$('#p-resume').onclick=()=>{AU.sfx('resume');show('pause',false);G.paused=false;G.hard=false;banner.className=''};
$('#p-pause').onclick=()=>{AU.sfx('click');show('pause',false);G.paused=false;G.hard=true;banner.className='';banner.textContent='PAUSED — TAP ⚙';banner.className='show sm';banner.style.animation='none';banner.style.opacity=1};
$('#settings-button').addEventListener('click',()=>{if(G.hard){banner.style.animation='';banner.style.opacity='';banner.className='';}});
$('#p-settings').onclick=()=>{AU.sfx('click');openSettings()};
let confirmFn=null;const ask=(t,fn)=>{$('#c-title').textContent=t;confirmFn=fn;show('confirm')};
$('#p-restart').onclick=()=>{AU.sfx('click');ask('RESTART MATCH?',()=>{show('pause',false);startMatch(lastCfg.mode,lastCfg.c1,lastCfg.c2)})};
$('#p-exit').onclick=()=>{AU.sfx('click');ask('EXIT MATCH?',()=>toMenu())};
$('#c-yes').onclick=()=>{AU.sfx('click');show('confirm',false);const f=confirmFn;confirmFn=null;f&&f()};$('#c-no').onclick=()=>{AU.sfx('click');show('confirm',false)};
$('#r-main').onclick=()=>{AU.sfx('click');G.resAct&&G.resAct()};$('#r-menu').onclick=()=>{AU.sfx('click');toMenu()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.playing&&G.phase!=='over')openPause()});
addEventListener('pointerdown',()=>AU.init(),{once:true});
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&G.playing){G.paused?$('#p-resume').click():openPause()}});

/* ---------- BOOT ---------- */
fetch('game.json').then(r=>r.json()).then(j=>{try{const m=j.match||{},d=j.damage||{},s=j.stamina||{};
 Object.assign(CFG,{rounds:m.rounds||3,hp:m.startingHealth||200,st:m.startingStamina||100,pts:m.pointsPerRoundWin||5,run:s.runningDrainPerSecond||18,idle:s.idleRegenerationPerSecond||15,move:s.movingRegenerationPerSecond||4});
 Object.assign(CFG.dmg,{lp:d.lightPunch||8,hp:d.heavyPunch||15,lk:d.lightKick||10,hk:d.heavyKick||18,air:d.jumpAttack||14,sp:d.specialAttack||25,fin:d.comboFinisher||30});
 Object.assign(CFG.cost,{hp:s.heavyPunchCost||7,hk:s.heavyKickCost||10,sp:s.specialAttackCost||28});buildMoves();
 (j.characters||[]).forEach(c=>{const h=CH.find(x=>x.id===c.id);if(h){h.attack=c.attack;h.speed=c.speed;h.defense=c.defense;h.special=c.special||h.special;h.style=c.style||h.style}})}catch(e){}}).catch(()=>{});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}
S.p1=clamp(S.p1,0,9);S.p2=clamp(S.p2,0,9);S.arena=clamp(S.arena,0,4);
P[1]=new F(1,CH[S.p1]);P[2]=new F(2,CH[S.p2]);P[2].face=-1;applySettings();requestAnimationFrame(loop);
window.__astra={G,P,IN,CFG,S,FX,startMatch,openSelect,CH};
})();

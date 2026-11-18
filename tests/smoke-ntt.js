// Smoke test: Name That Team in a fake browser (jsdom) with fake Google + fake /api/usage.
// Usage: cd tests && node smoke-ntt.js
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const ROOT=path.join(__dirname,'..');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0;const check=(label,ok)=>{console.log((ok?'PASS ':'FAIL ')+label);if(!ok){bad++;process.exitCode=1;}};
const html=fs.readFileSync(path.join(ROOT,'name-that-team.html'),'utf8');const src=html.match(/<script>([\s\S]*)<\/script>/)[1];
const on=(d,id)=>d.querySelector(id).classList.contains('on');
const thisMonth=()=>new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0');
// ---- browser factory: fake Street View returns a pano exactly at the requested point ----
function browser(opts={}){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://clue-games.vercel.app/name-that-team.html'});const w=dom.window;
 w.localStorage.setItem('gc:settings',JSON.stringify(Object.assign({key:'AIzaX'},opts.gc||{})));
 w.navigator.clipboard={writeText:async t=>{w.__copied=t}};
 const st={panos:0,posts:0,reqs:[],shared:opts.shared==null?null:opts.shared};
 class LL{constructor(a,b){this.a=a;this.b=b}lat(){return this.a}lng(){return this.b}}
 class O{constructor(o){this.o=o||{};this.ls={}}addListener(e,f){this.ls[e]=f}setMap(m){this.m=m}getMap(){return this.m}}
 class Marker extends O{constructor(o){super(o);this.m=o.map;this.p=o.position}setPosition(p){this.p=p}getPosition(){return new LL(this.p.lat,this.p.lng)}}
 class Map extends O{setCenter(){}setZoom(){}fitBounds(){}}
 class Pano extends O{constructor(e,o){super(o);st.panos++;this.pano=o.pano}setOptions(o){this.pano=o.pano}getPano(){return this.pano}setPano(p){this.pano=p}setPov(){}setZoom(){}}
 let n=0;class SVS{async getPanorama(r){st.reqs.push(r);if(!r.sources||r.sources[0]!=='g')throw new Error('not google-only');const id='P'+(++n);return{data:{location:{pano:id,latLng:new LL(r.location.lat,r.location.lng),description:'X'}}}}}
 w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g'}},marker:{Marker}})[k]}};
 w.fetch=async(u,o)=>{u=String(u);
  if(u.includes('api/usage')){if(st.shared==null)return{ok:false,status:503,json:async()=>({error:'nodb'})};if(o&&o.method==='POST'){st.posts++;st.shared++;}return{ok:true,status:200,json:async()=>({month:thisMonth(),panos:st.shared,free:5000})};}
  if(u.includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};
  return{ok:false,status:404,json:async()=>({})};};
 w.eval(src+';window.__t={g:()=>game,TEAMS,TEAM,nearestTeam,findTeamSpot,scoreTeam,distKm};');
 const d=w.document;
 return {w,d,st,
  async ready(){await sleep(20);if(w.__gcReady)await w.__gcReady();await sleep(80);},
  choose(code){d.querySelector(`#teamPicker [data-team="${code}"]`).click();d.querySelector('#guessBtn').click();},
  panel(){return d.querySelector('#resPanel').textContent.replace(/\s+/g,' ').trim();},
  googleLoaded(){return [...d.scripts].some(s=>/maps\.googleapis/.test(s.src));}};
}
const full=t=>t.city+' '+t.name;
(async()=>{
 // ===== data =====
 {const A=browser();const T=A.w.__t.TEAMS;
  check('32 teams, 8 per division, unique codes',T.length===32&&new Set(T.map(t=>t.code)).size===32&&['Atlantic','Metropolitan','Central','Pacific'].every(dv=>T.filter(t=>t.div===dv).length===8));
  check('every arena is its own nearest team',T.every(t=>A.w.__t.nearestTeam(t)===t.code));
  check('Utah Mammoth at Delta Center, Islanders at UBS Arena',A.w.__t.TEAM.UTA.name==='Mammoth'&&A.w.__t.TEAM.UTA.arena==='Delta Center'&&A.w.__t.TEAM.NYI.arena==='UBS Arena');}

 // ===== daily same for two browsers =====
 const A=browser(),B=browser();await sleep(30);
 check('home on, Google not loaded on home screen',on(A.d,'#home')&&!A.googleLoaded());
 A.d.querySelector('#hDaily').click();B.d.querySelector('#hDaily').click();await A.ready();await B.ready();
 const ansA=A.w.__t.g().rounds.map(r=>r.ans),ansB=B.w.__t.g().rounds.map(r=>r.ans);
 console.log('      daily teams:',ansA.join(' '));
 check('daily same for two browsers',ansA.length===5&&ansA.join()===ansB.join()&&new Set(ansA).size===5);
 check('Google loaded once a game starts, picker shown, map hidden',A.googleLoaded()&&!A.d.querySelector('#picker').hidden&&!on(A.d,'#mapBox'));
 check('every lookup asks for Google-owned panos, radius 2000',A.st.reqs.length>0&&A.st.reqs.every(r=>r.sources&&r.sources[0]==='g'&&r.radius===2000&&r.preference==='nearest'));

 // ===== ntt fairness =====
 {const t=A.w.__t,seq=[0.951,0.2306,0.1,0.5,0.3];let i=0;const rng=()=>seq[i++%seq.length];
  const before=A.st.reqs.length;const round=await t.findTeamSpot(rng,t.TEAM.NJD,false);const reqs=A.st.reqs.slice(before);
  console.log('      first point nearest:',t.nearestTeam(reqs[0].location),'| lookups:',reqs.length,'| round:',JSON.stringify(round));
  check('ntt fairness: point nearer MSG rejected, round belongs to NJD',t.nearestTeam(reqs[0].location)==='NYR'&&reqs.length===2&&t.nearestTeam(round)==='NJD'&&round.ans==='NJD'&&round.pick===null&&round.pts===null);}

 // ===== spot within 10 miles =====
 {const t=A.w.__t;let ok=true,worst=0;
  for(let k=0;k<50;k++){const team=t.TEAMS[Math.floor(Math.random()*32)];const r=await t.findTeamSpot(Math.random,team,false);const km=t.distKm(r,team);worst=Math.max(worst,km);if(km>16.1||r.ans!==team.code||t.nearestTeam(r)!==team.code)ok=false;}
  console.log('      furthest spot from its arena:',worst.toFixed(2),'km');
  check('spot within 10 miles (50 random teams)',ok);}

 // ===== pick scores =====
 {const g=A.w.__t.g(),T=A.w.__t.TEAM;
  const r0=g.rounds[0];A.choose(r0.ans);const p0=A.panel();console.log('      right pick panel:',p0.slice(0,120));
  check('pick scores: correct team = 5000, panel shows team',r0.pts===5000&&A.w.__t.scoreTeam(r0)===5000&&p0.includes(T[r0.ans].city)&&p0.includes(T[r0.ans].name)&&on(A.d,'#mapBox'));
  A.d.querySelector('#nextBtn').click();
  const r1=g.rounds[1],wrong=A.w.__t.TEAMS.find(x=>x.code!==r1.ans).code;A.choose(wrong);const p1=A.panel();console.log('      wrong pick panel:',p1.slice(0,140));
  check('pick scores: wrong team = 0, panel shows right team and the pick',r1.pts===0&&r1.pick===wrong&&p1.includes(full(T[r1.ans]))&&p1.includes(full(T[wrong])));
  A.d.querySelector('#nextBtn').click();}

 // ===== filter box =====
 {const f=A.d.querySelector('#teamFilter');f.value='kra';f.dispatchEvent(new A.w.Event('input'));
  const vis=[...A.d.querySelectorAll('#teamPicker button[data-team]')].filter(b=>!b.hidden&&!b.closest('.div').hidden).map(b=>b.dataset.team);
  check('filter box: "kra" leaves only the Kraken',vis.join()==='SEA');
  f.value='';f.dispatchEvent(new A.w.Event('input'));
  check('clearing the filter shows all 32',[...A.d.querySelectorAll('#teamPicker button[data-team]')].filter(b=>!b.hidden).length===32);}

 // ===== cap blocks round =====
 {const C=browser({shared:4500,gc:{cap:4000}});await sleep(40);
  C.d.querySelector('#hUnl').click();await C.ready();
  const u=JSON.parse(C.w.localStorage.getItem('gc:usage')||'{"panos":0}');
  console.log('      cap message:',C.d.querySelector('#msgInner').textContent.slice(0,80));
  check('cap blocks round: message, no pano, no bump',on(C.d,'#msg')&&/limit/.test(C.d.querySelector('#msgInner').textContent)&&C.st.panos===0&&C.st.posts===0&&!u.panos);}

 // ===== home -> play -> end -> home =====
 {const D=browser({shared:10});await sleep(40);
  D.d.querySelector('#hUnl').click();await D.ready();
  check('unlimited game started off home',!on(D.d,'#home')&&D.w.__t.g().mode==='unl'&&D.w.__t.g().rounds.length===5);
  for(let i=0;i<5;i++){D.choose(D.w.__t.g().rounds[i].ans);D.d.querySelector('#nextBtn').click();}
  const end=D.d.querySelector('#endBody').textContent.replace(/\s+/g,' ').trim();console.log('      end screen:',end.slice(0,120));
  check('5 rounds reach #endS with 25,000',on(D.d,'#endS')&&end.includes('25,000')&&D.w.__t.g().phase==='final');
  check('every round bumped the shared counter (5)',D.st.posts===5&&D.st.panos===1);
  D.d.querySelector('#eHome').click();
  check('end -> back home',on(D.d,'#home')&&!on(D.d,'#endS'));
  check('saved under nt: keys only (no gc:g:)',Object.keys(D.w.localStorage).some(k=>k==='nt:g:unl')&&!Object.keys(D.w.localStorage).some(k=>k.startsWith('gc:g:')));}

 console.log(bad?`${bad} FAILED`:'ALL PASS');
 process.exit(process.exitCode||0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

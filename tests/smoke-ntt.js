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
 if(opts.nt)w.localStorage.setItem('nt:settings',JSON.stringify(opts.nt));
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
 w.eval(src+';window.__t={g:()=>game,TEAMS,TEAM,nearestTeam,findTeamSpot,scoreTeam,distKm,bearing,makeRounds,shuffle,mulberry32,makeGuess,selectTeam,sv:()=>sv,pano:()=>pano};');
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
  check('cap blocks round: message, no pano, no bump',on(C.d,'#msg')&&/limit/.test(C.d.querySelector('#msgInner').textContent)&&C.st.panos===0&&C.st.posts===0&&!u.panos);
  check('cap blocks before Google Maps loads (unlimited)',!C.googleLoaded());
  const C2=browser({shared:4500,gc:{cap:4000}});await sleep(40);C2.d.querySelector('#hDaily').click();await C2.ready();
  check('cap blocks before Google Maps loads (daily)',on(C2.d,'#msg')&&/limit/.test(C2.d.querySelector('#msgInner').textContent)&&!C2.googleLoaded());}

 // ===== hard mode =====
 {const t=A.w.__t,angleDiff=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
  const names=['SEA','BOS','VGK','TOR','NYR'];let okH=true,okD=true,worstD=0,minA=999,maxA=0;
  for(let k=0;k<20;k++){const team=t.TEAM[names[k%5]];const r=await t.findTeamSpot(Math.random,team,true);
   const a=angleDiff(r.heading,t.bearing(r,team)),d=t.distKm(r,team);minA=Math.min(minA,a);maxA=Math.max(maxA,a);worstD=Math.max(worstD,d);
   if(a<140||a>180)okH=false;if(d>0.3)okD=false;}
  console.log('      hard heading diff range:',minA.toFixed(1),'-',maxA.toFixed(1),'| furthest:',(worstD*1000).toFixed(0),'m');
  check('ntt hard heading: facing away from arena (140-180 deg off, 20 spots)',okH);
  check('hard spot near arena: every spot <= 0.3 km',okD);
  const sea=[];for(let k=0;k<10;k++){const r=await t.findTeamSpot(Math.random,t.TEAM.SEA,true);sea.push(r.pano+'|'+r.heading);}
  check('hard varies: 10 SEA spots give at least 5 distinct',new Set(sea).size>=5);
  // a pano too far away is rejected and retried
  const before=A.st.reqs.length,sv=t.sv(),orig=sv.getPanorama;let first=true;
  sv.getPanorama=async r=>{const res=await orig.call(sv,r);if(first){first=false;res.data.location.latLng=new (res.data.location.latLng.constructor)(r.location.lat+0.01,r.location.lng);}return res;};
  const far=await t.findTeamSpot(Math.random,t.TEAM.SEA,true);sv.getPanorama=orig;
  const hr=A.st.reqs.slice(before);
  check('hard spot retried when pano is farther than 0.3 km, radius 150',hr.length===2&&hr.every(r=>r.radius===150&&r.preference==='nearest'&&r.sources[0]==='g')&&t.distKm(far,t.TEAM.SEA)<=0.3);}

 {const H=browser({shared:10,nt:{hard:true,move:'move',timer:0}});await sleep(40);
  check('hard toggle on home screen, move/timer hidden while on (computed display none)',H.d.querySelector('#hHard').checked&&H.d.querySelector('#hOpts').hidden&&H.w.getComputedStyle(H.d.querySelector('#hOpts')).display==='none');
  H.d.querySelector('#hUnl').click();await H.ready();
  const g=H.w.__t.g(),po=H.w.__t.pano().o;
  check('hard locks view: game.hard, NMPZ, 25s timer, #block on, no links/clickToGo',g.hard===true&&g.move==='nmpz'&&g.timer===25&&on(H.d,'#block')&&po.linksControl===false&&po.clickToGo===false&&H.d.querySelector('#timer').textContent==='⏱ 25s');
  H.w.__t.selectTeam(g.rounds[0].ans);H.w.__t.makeGuess(true);
  check('hard timeout scores 0 even with a team highlighted',g.rounds[0].pts===0&&g.phase==='result'&&!on(H.d,'#block'));
  H.d.querySelector('#nextBtn').click();
  H.w.__t.selectTeam(g.rounds[1].ans);H.d.querySelector('#guessBtn').click();
  check('hard: submitting the right team in time still scores 5000',g.rounds[1].pts===5000);
  // normal mode keeps highlighted-team-on-timeout behaviour
  const N=browser({shared:10,nt:{hard:false,move:'nmpz',timer:30}});await sleep(40);N.d.querySelector('#hUnl').click();await N.ready();
  const gn=N.w.__t.g();N.w.__t.selectTeam(gn.rounds[0].ans);N.w.__t.makeGuess(true);
  check('normal mode timeout keeps the highlighted pick (5000)',gn.hard===false&&gn.rounds[0].pts===5000);
  // daily ignores hard
  const Dd=browser({shared:10,nt:{hard:true}});await sleep(40);Dd.d.querySelector('#hDaily').click();await Dd.ready();
  const gd=Dd.w.__t.g(),pd=Dd.w.__t.pano().o;
  check('daily ignores hard: normal mode, moving, no timer, no block',gd.mode==='daily'&&gd.hard===false&&gd.move==='move'&&gd.timer===0&&!on(Dd.d,'#block')&&pd.clickToGo===true&&Dd.d.querySelector('#timer').hidden&&Dd.st.reqs.every(r=>r.radius===2000));}

 // ===== one bad team does not sink the game =====
 {const t=A.w.__t,sv=t.sv(),orig=sv.getPanorama;
  const order=t.shuffle(t.TEAMS,t.mulberry32(77)),bad=order[0];
  sv.getPanorama=async r=>{if(t.distKm(r.location,bad)<20)throw new Error('ZERO_RESULTS');return orig.call(sv,r);};
  const run=async()=>(await t.makeRounds(t.mulberry32(77),false)).map(r=>r.ans).join();
  const r1=await run(),r2=await run();sv.getPanorama=orig;
  console.log('      skipped',bad.code,'->',r1);
  check('bad team skipped: 5 distinct teams, same order each time, bad team absent',r1.split(',').length===5&&new Set(r1.split(',')).size===5&&!r1.includes(bad.code)&&r1===r2&&r1===order.slice(1,6).map(x=>x.code).join());
  sv.getPanorama=async()=>{throw new Error('none');};let threw=false;try{await t.makeRounds(t.mulberry32(5),false);}catch(e){threw=true;}sv.getPanorama=orig;
  check('makeRounds still throws when no team has coverage',threw);}

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

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
 // pov: like Google, setPov fires pov_changed (a user turn is simulated by setting .pov and firing it)
 class Pano extends O{constructor(e,o){super(o);st.panos++;this.pano=o.pano;this.pov=Object.assign({},o.pov)}setOptions(o){this.o=o;this.pano=o.pano;if(o.pov)this.pov=Object.assign({},o.pov)}getPano(){return this.pano}setPano(p){this.pano=p}getPov(){return Object.assign({},this.pov)}setPov(p){this.pov=Object.assign({},p);if(this.ls.pov_changed)this.ls.pov_changed()}turn(h){this.pov={heading:h,pitch:0};if(this.ls.pov_changed)this.ls.pov_changed()}setZoom(){}}
 let n=0;class SVS{async getPanorama(r){st.reqs.push(r);if(!r.sources||r.sources[0]!=='g')throw new Error('not google-only');const id='P'+(++n);return{data:{location:{pano:id,latLng:new LL(r.location.lat,r.location.lng),description:'X'}}}}}
 w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g',OUTDOOR:'o'}},marker:{Marker}})[k]}};
 w.fetch=async(u,o)=>{u=String(u);
  if(u.includes('api/usage')){if(st.shared==null)return{ok:false,status:503,json:async()=>({error:'nodb'})};if(o&&o.method==='POST'){st.posts++;st.shared++;}return{ok:true,status:200,json:async()=>({month:thisMonth(),panos:st.shared,free:5000})};}
  if(u.includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};
  return{ok:false,status:404,json:async()=>({})};};
 w.eval(src+';window.__t={g:()=>game,TEAMS,TEAM,nearestTeam,findTeamSpot,scoreTeam,distKm,bearing,makeRounds,shuffle,mulberry32,makeGuess,selectTeam,awayHeading,sv:()=>sv,pano:()=>pano};');
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
 check('every lookup asks for Google-owned AND outdoor panos (sources intersect)',A.st.reqs.every(r=>r.sources.length===2&&r.sources.includes('g')&&r.sources.includes('o')));
 check('daily uses hard-mode lookups: Google-owned panos, radius 1000',A.st.reqs.length>0&&A.st.reqs.every(r=>r.sources&&r.sources[0]==='g'&&r.radius===1000&&r.preference==='nearest'));
 {const g=A.w.__t.g(),far=Math.max(...g.rounds.map(r=>A.w.__t.distKm(r,A.w.__t.TEAM[r.ans])));
  console.log('      daily furthest spot:',far.toFixed(2),'km');
  check('daily = hard spots (<= 4.9 km, fair), timer 0, not hard, not near',g.timer===0&&g.hard===false&&g.near===false&&far<=4.9&&g.rounds.every(r=>A.w.__t.nearestTeam(r)===r.ans)&&A.d.querySelector('#timer').hidden);}

 // ===== ntt fairness (hard spots) =====
 {const t=A.w.__t,sv=t.sv(),orig=sv.getPanorama;let first=true;
  // first lookup "snaps" to a pano right by MSG: it belongs to the Rangers, so a Devils round must reject it
  sv.getPanorama=async r=>{const res=await orig.call(sv,r);if(first){first=false;res.data.location.latLng=new (res.data.location.latLng.constructor)(t.TEAM.NYR.lat,t.TEAM.NYR.lng+0.001);}return res;};
  const before=A.st.reqs.length;const round=await t.findTeamSpot(Math.random,t.TEAM.NJD,false);sv.getPanorama=orig;const reqs=A.st.reqs.slice(before);
  console.log('      lookups:',reqs.length,'| round:',JSON.stringify(round));
  check('ntt fairness: pano nearer MSG rejected, round belongs to NJD',reqs.length===2&&t.nearestTeam(round)==='NJD'&&round.ans==='NJD'&&round.pick===null&&round.pts===null);}

 // ===== hard spot within 3 miles =====
 {const t=A.w.__t;let ok=true,worst=0;
  for(let k=0;k<50;k++){const team=t.TEAMS[Math.floor(Math.random()*32)];const r=await t.findTeamSpot(Math.random,team,false);const km=t.distKm(r,team);worst=Math.max(worst,km);if(km>4.9||r.ans!==team.code||t.nearestTeam(r)!==team.code)ok=false;}
  console.log('      furthest hard spot from its arena:',worst.toFixed(2),'km');
  check('hard spot within 3 miles (<= 4.9 km) and fair (50 random teams)',ok);}

 // ===== awayHeading clamp =====
 {const t=A.w.__t,diff=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
  const c1=t.awayHeading(10,10),c2=t.awayHeading(5,350),c3=t.awayHeading(300,350),c4=t.awayHeading(355,20);
  console.log('      clamps:',c1,c2,c3,c4);
  check('awayHeading: pointed at the arena -> exactly 100 deg off',c1!==null&&Math.abs(diff(c1,10)-100)<1e-9);
  check('awayHeading: across the 0/360 wrap -> exactly 100 deg off, in 0..360',[[c2,350],[c3,350],[c4,20]].every(([h,a])=>h!==null&&h>=0&&h<360&&Math.abs(diff(h,a)-100)<1e-9));
  check('awayHeading: 150 deg off left alone (incl. wrap)',t.awayHeading(160,10)===null&&t.awayHeading(140,350)===null&&t.awayHeading(230,20)===null&&t.awayHeading(200,350)===null);}

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

 // ===== easy-mode spot finder (right by the rink) =====
 {const t=A.w.__t,angleDiff=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
  const names=['SEA','BOS','VGK','TOR','NYR'];let okH=true,okD=true,worstD=0,minA=999,maxA=0;
  for(let k=0;k<20;k++){const team=t.TEAM[names[k%5]];const r=await t.findTeamSpot(Math.random,team,true);
   const a=angleDiff(r.heading,t.bearing(r,team)),d=t.distKm(r,team);minA=Math.min(minA,a);maxA=Math.max(maxA,a);worstD=Math.max(worstD,d);
   if(a<140||a>180)okH=false;if(d>0.3)okD=false;}
  console.log('      easy heading diff range:',minA.toFixed(1),'-',maxA.toFixed(1),'| furthest:',(worstD*1000).toFixed(0),'m');
  check('easy heading: facing away from arena (140-180 deg off, 20 spots)',okH);
  check('easy spot near arena: every spot <= 0.3 km',okD);
  const sea=[];for(let k=0;k<10;k++){const r=await t.findTeamSpot(Math.random,t.TEAM.SEA,true);sea.push(r.pano+'|'+r.heading);}
  check('easy varies: 10 SEA spots give at least 5 distinct',new Set(sea).size>=5);
  // a pano too far away is rejected and retried
  const before=A.st.reqs.length,sv=t.sv(),orig=sv.getPanorama;let first=true;
  sv.getPanorama=async r=>{const res=await orig.call(sv,r);if(first){first=false;res.data.location.latLng=new (res.data.location.latLng.constructor)(r.location.lat+0.01,r.location.lng);}return res;};
  const far=await t.findTeamSpot(Math.random,t.TEAM.SEA,true);sv.getPanorama=orig;
  const hr=A.st.reqs.slice(before);
  check('easy spot retried when pano is farther than 0.3 km, radius 150',hr.length===2&&hr.every(r=>r.radius===150&&r.preference==='nearest'&&r.sources[0]==='g')&&t.distKm(far,t.TEAM.SEA)<=0.3);}

 // ===== hard mode game: 3-mile spots, free look, 25 s =====
 const noWalk=(B)=>{const o=B.w.__t.pano().o;return o.linksControl===false&&o.clickToGo===false&&!on(B.d,'#block')&&!B.d.querySelector('#hMove')&&!B.d.querySelector('#lMove')&&!B.d.querySelector('#sMove');};
 {const H=browser({shared:10,nt:{hard:true,timer:0}});await sleep(40);
  check('hard toggle on home screen, timer hidden while on (computed display none)',H.d.querySelector('#hHard').checked&&H.d.querySelector('#hOpts').hidden&&H.w.getComputedStyle(H.d.querySelector('#hOpts')).display==='none');
  check('no movement dropdown on home',!H.d.querySelector('#hMove')&&!H.d.querySelector('#lMove'));
  H.d.querySelector('#hUnl').click();await H.ready();
  const g=H.w.__t.g(),P=H.w.__t.pano(),po=P.o,T=H.w.__t.TEAM;
  const far=Math.max(...g.rounds.map(r=>H.w.__t.distKm(r,T[r.ans])));
  console.log('      hard game furthest spot:',far.toFixed(2),'km | mode label:',H.d.querySelector('#hMode').textContent);
  check('hard game: game.hard, not near, 25s timer, no walking, #block off',g.hard===true&&g.near===false&&g.move==='nomove'&&g.timer===25&&noWalk(H)&&H.d.querySelector('#timer').textContent==='⏱ 25s');
  check('hard game: spots <= 4.9 km and fair, radius 1000 lookups',far<=4.9&&g.rounds.every(r=>H.w.__t.nearestTeam(r)===r.ans)&&H.st.reqs.every(r=>r.radius===1000));
  check('hard game: zoom 0 with zoom + scroll allowed',po.zoom===0&&po.zoomControl===true&&po.scrollwheel===true);
  const toA=H.w.__t.bearing(g.rounds[0],T[g.rounds[0].ans]);P.turn(toA);
  check('hard game: free look, turning to face the arena is allowed',Math.abs(P.getPov().heading-toA)<1e-9);
  H.w.__t.selectTeam(g.rounds[0].ans);H.w.__t.makeGuess(true);
  check('hard timeout scores 0 even with a team highlighted',g.rounds[0].pts===0&&g.phase==='result'&&!on(H.d,'#block'));
  H.d.querySelector('#nextBtn').click();
  H.w.__t.selectTeam(g.rounds[1].ans);H.d.querySelector('#guessBtn').click();
  check('hard: submitting the right team in time still scores 5000',g.rounds[1].pts===5000);
  // ===== easy mode game: by the rink, facing away, turn clamp, zoom locked =====
  const N=browser({shared:10,nt:{hard:false,timer:30}});await sleep(40);N.d.querySelector('#hUnl').click();await N.ready();
  const gn=N.w.__t.g(),NP=N.w.__t.pano(),no=NP.o,TN=N.w.__t.TEAM,ad=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
  const farN=Math.max(...gn.rounds.map(r=>N.w.__t.distKm(r,TN[r.ans])));
  const offs=gn.rounds.map(r=>ad(r.heading,N.w.__t.bearing(r,TN[r.ans])));
  console.log('      easy game furthest spot:',(farN*1000).toFixed(0),'m | heading offsets:',offs.map(x=>x.toFixed(0)).join(' '),'| label:',N.d.querySelector('#hMode').textContent);
  check('easy game: not hard, near, chosen timer 30, no walking',gn.hard===false&&gn.near===true&&gn.timer===30&&noWalk(N)&&N.d.querySelector('#timer').textContent==='⏱ 30s');
  check('easy game: spots <= 0.3 km, facing away (140-180 deg off)',farN<=0.3&&offs.every(a=>a>=140&&a<=180)&&N.st.reqs.every(r=>r.radius===150));
  check('easy game: zoom 1, zoom control + scroll off',no.zoom===1&&no.zoomControl===false&&no.scrollwheel===false);
  const toN=N.w.__t.bearing(gn.rounds[0],TN[gn.rounds[0].ans]);
  NP.turn(toN);const h1=NP.getPov().heading;
  NP.turn((toN+30)%360);const h2=NP.getPov().heading;
  NP.turn((toN+210)%360);const h3=NP.getPov().heading;
  console.log('      to arena',toN.toFixed(1),'| turn at it ->',h1.toFixed(1),'| +30 ->',h2.toFixed(1),'| +210 ->',h3.toFixed(1));
  check('easy game: turning toward the arena is clamped to exactly 100 deg off',Math.abs(ad(h1,toN)-100)<1e-6&&Math.abs(ad(h2,toN)-100)<1e-6);
  check('easy game: turning to 150 deg off is left alone',Math.abs(h3-(toN+210)%360)<1e-9);
  N.w.__t.selectTeam(gn.rounds[0].ans);N.w.__t.makeGuess(true);
  check('easy mode timeout keeps the highlighted pick (5000)',gn.rounds[0].pts===5000);
  NP.turn(toN);
  check('no clamp after the round (result phase)',Math.abs(NP.getPov().heading-toN)<1e-9);
  // daily ignores the hard setting: hard spots, no timer, free look
  const Dd=browser({shared:10,nt:{hard:true}});await sleep(40);Dd.d.querySelector('#hDaily').click();await Dd.ready();
  const gd=Dd.w.__t.g(),pd=Dd.w.__t.pano().o;
  check('daily: zoom 0, zoom allowed',pd.zoom===0&&pd.zoomControl===true);
  check('easy lookups are outdoor-only too',A.st.reqs.filter(r=>r.radius===150).every(r=>r.sources.includes('o')));
  check('daily: not hard, no timer, no walking, hard-mode lookups',gd.mode==='daily'&&gd.hard===false&&gd.near===false&&gd.timer===0&&noWalk(Dd)&&Dd.d.querySelector('#timer').hidden&&Dd.st.reqs.every(r=>r.radius===1000));
  // settings modal has no movement choice
  Dd.w.eval('openSettings()');check('settings modal: no movement dropdown',!Dd.d.querySelector('#sMove')&&!!Dd.d.querySelector('#sHard'));}

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

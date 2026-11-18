// Smoke test: Hometown Heroes in fake browsers (jsdom) with fake Google, fake /api/usage and fake Redis (live rooms).
// Usage: cd tests && node smoke-hh.js
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const ROOT=path.join(__dirname,'..');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0;const check=(label,ok)=>{console.log((ok?'PASS ':'FAIL ')+label);if(!ok){bad++;process.exitCode=1;}};
const html=fs.readFileSync(path.join(ROOT,'hometown-heroes.html'),'utf8');const src0=html.match(/<script>([\s\S]*)<\/script>/)[1];
// redirects call goPage(url) → location.replace; record them instead (jsdom can't navigate)
const src=src0.replace(/function goPage\(url\) \{[^}]*\}/,'function goPage(url) { window.__went = url; }');
const on=(d,id)=>d.querySelector(id).classList.contains('on');
const txt=e=>e?e.textContent.replace(/\s+/g,' ').trim():'';
const thisMonth=()=>new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0');
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const URL0='https://clue-games.vercel.app/hometown-heroes.html';
// ---- fake Upstash (pipeline REST) ----
const db=new Map();
function run(c){const [op,k,...a]=c;switch(op){
 case 'GET':return db.has(k)?db.get(k):null;
 case 'SET':{if(a.includes('NX')&&db.has(k))return null;db.set(k,a[0]);return 'OK';}
 case 'HSET':{const h=db.get(k)||{};h[a[0]]=a[1];db.set(k,h);return 1;}
 case 'HSETNX':{const h=db.get(k)||{};if(a[0] in h)return 0;h[a[0]]=a[1];db.set(k,h);return 1;}
 case 'HGETALL':{const h=db.get(k)||{};return Object.entries(h).flat();}
 case 'EXPIRE':return 1;default:throw new Error('cmd '+op);}}
process.env.KV_REST_API_URL='https://fake.upstash';process.env.KV_REST_API_TOKEN='t';
global.fetch=async(u,o)=>({ok:true,json:async()=>JSON.parse(o.body).map(c=>({result:run(c)}))});
const handler=require(path.join(ROOT,'api','room.js'));
async function callApi(body){return new Promise(res=>{const r={code:200,setHeader(){},status(c){this.code=c;return this},json(j){res({status:this.code,j})}};handler({method:'POST',body,query:{}},r);});}
const roomOf=code=>JSON.parse(db.get('gc:room:'+code));
// ---- browser factory: fake Street View returns a pano exactly at the requested point (unless the point is in opts.noCover);
//      pano-id lookups read it back ----
const panoLocs={};let panoN=0;
function browser(name,opts={}){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:opts.url||URL0});const w=dom.window;
 w.localStorage.setItem('gc:settings',JSON.stringify(Object.assign({key:'AIzaX',name},opts.gc||{})));
 w.localStorage.setItem('hh:settings',JSON.stringify(Object.assign({liveTimer:0},opts.hh||{})));
 w.navigator.clipboard={writeText:async t=>{w.__copied=t}};
 const st={panos:0,posts:0,reqs:[],shared:opts.shared==null?null:opts.shared};
 class LL{constructor(a,b){this.a=a;this.b=b}lat(){return this.a}lng(){return this.b}}
 class O{constructor(o){this.o=o||{};this.ls={}}addListener(e,f){this.ls[e]=f}setMap(m){this.m=m}getMap(){return this.m}}
 class Marker extends O{constructor(o){super(o);this.m=o.map;this.p=o.position}setPosition(p){this.p=p}getPosition(){return new LL(this.p.lat,this.p.lng)}}
 class Map extends O{constructor(e,o){super(o);this.c=o.center;this.z=o.zoom}setCenter(c){this.c=c}setZoom(z){this.z=z}fitBounds(){}}
 class Pano extends O{constructor(e,o){super(o);st.panos++;this.pano=o.pano}setOptions(o){this.o=o;this.pano=o.pano}getPano(){return this.pano}setPano(p){this.pano=p}setPov(){}setZoom(){}}
 const near=(a,b)=>Math.abs(a.lat-b.lat)<1e-6&&Math.abs(a.lng-b.lng)<1e-6;
 class SVS{async getPanorama(r){st.reqs.push(r);
  if(r.pano){const l=panoLocs[r.pano];if(!l)throw new Error('ZERO_RESULTS');return{data:{location:{pano:r.pano,latLng:new LL(l.lat,l.lng),description:'X'}}}}
  if(!r.sources||r.sources[0]!=='g')throw new Error('not google-only');
  if((opts.noCover||[]).some(p=>near(p,r.location)))throw new Error('ZERO_RESULTS');
  const id='P'+(++panoN);panoLocs[id]={lat:r.location.lat,lng:r.location.lng};return{data:{location:{pano:id,latLng:new LL(r.location.lat,r.location.lng),description:'X'}}}}}
 w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g'}},marker:{Marker}})[k]}};
 w.fetch=async(u,o)=>{u=String(u);
  if(u.includes('api/usage')){if(o&&o.method==='POST')st.posts++;if(st.shared==null)return{ok:false,status:503,json:async()=>({error:'nodb'})};if(o&&o.method==='POST')st.shared++;return{ok:true,status:200,json:async()=>({month:thisMonth(),panos:st.shared,free:5000})};}
  if(u.includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};
  const {status,j}=await callApi(JSON.parse(o.body));return{ok:status<300,status,json:async()=>j};};
 w.eval(src+';window.__t={g:()=>game,PLAYERS,BY_ID,pickDaily,findHometownSpot,makeRounds,scoreFor,distKm,HH_SIZE,dateKey,map:()=>map,pano:()=>pano,sv:()=>sv,pc:()=>pendingChal,b64d,poll:pollRoom,live:()=>live,makeGuess};');
 const d=w.document;
 return {w,d,st,
  async ready(){await sleep(20);if(w.__gcReady)await w.__gcReady();await sleep(80);},
  // click the map at (lat,lng) then press Guess
  pinAt(lat,lng){w.__t.map().ls.click({latLng:{lat:()=>lat,lng:()=>lng}});d.querySelector('#guessBtn').click();},
  // pin `km` north of this round's spot (about 111 km per degree)
  pinOff(km){const r=w.__t.g().rounds[w.__t.g().idx];this.pinAt(r.lat+km/111.195,r.lng);},
  panel(){return txt(d.querySelector('#resPanel'));},
  end(){return txt(d.querySelector('#endBody'));},
  async poll(){await w.__t.poll();await sleep(20);},
  googleLoaded(){return [...d.scripts].some(s=>/maps\.googleapis/.test(s.src));}};
}
const linkOf=B=>{B.d.querySelector('#chalBtn').click();return B.d.querySelector('#chLink').value;};
(async()=>{
 // ===== data =====
 {const A=browser('Andrew');const P=A.w.__t.PLAYERS;
  const kr=P.filter(p=>p.kraken).length;console.log('      players:',P.length,'| Kraken',kr,'| league',P.length-kr);
  check('75 players, unique ids, every one has name/team/town and numeric coordinates',P.length===75&&new Set(P.map(p=>p.id)).size===75&&P.every(p=>p.name&&p.team&&p.town&&isFinite(p.lat)&&isFinite(p.lng)&&typeof p.kraken==='boolean'));
  check('doubtful hometowns left out (both Fleurys, Tkachuk, Slafkovsky)',['cfleury','hfleury','tkachuk','slafkovsky'].every(id=>!P.some(p=>p.id===id)));
  check('scale: HH_SIZE 3000, spot on = 5000, 300 km = 1839',A.w.__t.HH_SIZE===3000&&A.w.__t.scoreFor(0,3000)===5000&&A.w.__t.scoreFor(300,3000)===1839);}

 // ===== daily same and mixed =====
 const A=browser('Andrew'),B=browser('Sam');await sleep(30);
 check('home on, Google not loaded on home screen',on(A.d,'#home')&&!A.googleLoaded());
 A.d.querySelector('#hDaily').click();B.d.querySelector('#hDaily').click();await A.ready();await B.ready();
 const today=A.w.__t.dateKey(new Date()),T=A.w.__t;
 const idsA=T.g().rounds.map(r=>r.ans),idsB=B.w.__t.g().rounds.map(r=>r.ans),nK=idsA.filter(id=>T.BY_ID[id].kraken).length;
 console.log('      daily players:',idsA.join(' '),'| Kraken:',nK);
 check('daily same and mixed: two browsers same 5 ids, 2 or 3 Kraken, matches pickDaily',idsA.length===5&&new Set(idsA).size===5&&idsA.join()===idsB.join()&&(nK===2||nK===3)&&idsA.join()===T.pickDaily(today).join());
 check('daily headings and panos match too',T.g().rounds.map(r=>r.heading).join()===B.w.__t.g().rounds.map(r=>r.heading).join());
 {let okMix=true;for(let k=0;k<40;k++){const d=new Date(2026,0,1+k*9),ids=T.pickDaily(T.dateKey(d)),n=ids.filter(id=>T.BY_ID[id].kraken).length;if(ids.length!==5||new Set(ids).size!==5||n<2||n>3)okMix=false;}
  check('pickDaily over 40 dates: always 5 different players, 2-3 Kraken',okMix);}
 check('Google loaded once a game starts; map starts at 50,-40 zoom 2',A.googleLoaded()&&T.map().c.lat===50&&T.map().c.lng===-40&&T.map().z===2);
 {const look=A.st.reqs.filter(r=>!r.pano);
  check('every lookup: Google-only, radius 5000, nearest, at the hometown',look.length===5&&look.every((r,i)=>r.sources[0]==='g'&&r.radius===5000&&r.preference==='nearest'&&r.location.lat===T.BY_ID[idsA[i]].lat&&r.location.lng===T.BY_ID[idsA[i]].lng));}
 {const r=T.g().rounds[0];check('round shape {pano, lat, lng, heading, ans, pts:null}',typeof r.pano==='string'&&isFinite(r.lat)&&isFinite(r.heading)&&r.ans===idsA[0]&&r.pts===null);}

 // ===== hh skip no coverage =====
 {const first=T.BY_ID[T.pickDaily(today)[0]];
  const C=browser('C',{noCover:[first]}),D=browser('D',{noCover:[first]});await sleep(30);
  C.d.querySelector('#hDaily').click();D.d.querySelector('#hDaily').click();await C.ready();await D.ready();
  const ic=C.w.__t.g().rounds.map(r=>r.ans),id=D.w.__t.g().rounds.map(r=>r.ans),want=T.pickDaily(today);
  console.log('      no coverage in',first.town,'->',ic.join(' '));
  check('hh skip no coverage: player skipped, still 5 rounds, both browsers match, same Kraken/league slots',ic.length===5&&!ic.includes(first.id)&&ic.every(x=>T.BY_ID[x].town!==first.town)&&ic.join()===id.join()&&ic.every((x,i)=>T.BY_ID[x].kraken===T.BY_ID[want[i]].kraken));
  const none=browser('N',{noCover:T.PLAYERS});await sleep(30);none.d.querySelector('#hUnl').click();await none.ready();
  check('no coverage anywhere: message shown, gives up after a few lookups',on(none.d,'#msg')&&/Street View/.test(txt(none.d.querySelector('#msgInner')))&&none.st.reqs.length<=12);}

 // ===== reveal =====
 {let okAll=true,sawK=false,sawL=false;
  for(let i=0;i<5;i++){const r=T.g().rounds[i],p=T.BY_ID[r.ans];
   if(i===0)A.pinOff(0);else A.pinOff(300);
   const pn=A.panel(),badge=A.d.querySelector('#resPanel .kbadge');
   if(i<2)console.log('      reveal',i+1+':',pn.slice(0,150));
   const ptsOk=i===0?r.pts===5000&&pn.includes('5,000'):r.pts===1839&&pn.includes('1,839');
   if(!(pn.includes(p.name)&&pn.includes(p.team)&&pn.includes(p.town)&&/away/.test(pn)&&(i===0||/186 mi/.test(pn))&&ptsOk&&!!badge===p.kraken&&A.d.querySelector('#mapBox').classList.contains('result')))okAll=false;
   if(p.kraken)sawK=true;else sawL=true;
   A.d.querySelector('#nextBtn').click();}
  check('reveal: name, team, hometown, distance, points; Kraken badge only on Kraken players',okAll&&sawK&&sawL);
  check('daily done: end screen, saved under hh:g:<date>, stat recorded',on(A.d,'#endS')&&JSON.parse(A.w.localStorage.getItem('hh:g:'+today)).phase==='final'&&JSON.parse(A.w.localStorage.getItem('hh:stats'))[today]===5000+4*1839);}

 // ===== cap blocks round =====
 {const C=browser('C',{shared:4500,gc:{cap:4000}});await sleep(40);
  C.d.querySelector('#hUnl').click();await C.ready();
  const u=JSON.parse(C.w.localStorage.getItem('gc:usage')||'{"panos":0}');
  console.log('      cap message:',txt(C.d.querySelector('#msgInner')).slice(0,80));
  check('cap blocks round: message, no pano, no bump, Google not loaded (unlimited)',on(C.d,'#msg')&&/limit/.test(txt(C.d.querySelector('#msgInner')))&&C.st.panos===0&&C.st.posts===0&&!u.panos&&!C.googleLoaded());
  const C2=browser('C',{shared:4500,gc:{cap:4000}});await sleep(40);C2.d.querySelector('#hDaily').click();await C2.ready();
  check('cap blocks round (daily)',on(C2.d,'#msg')&&/limit/.test(txt(C2.d.querySelector('#msgInner')))&&!C2.googleLoaded()&&C2.st.panos===0);}

 // ===== movement + timer settings =====
 {const M=browser('M',{shared:10,hh:{move:'nmpz',timer:30}});await sleep(40);
  check('home: movement + timer selects, no map-pack select',M.d.querySelector('#hMove').value==='nmpz'&&M.d.querySelector('#hTimer').value==='30'&&!M.d.querySelector('#hPack'));
  M.d.querySelector('#hUnl').click();await M.ready();
  const g=M.w.__t.g(),po=M.w.__t.pano().o;
  check('NMPZ + 30 s: view locked, timer shown',g.move==='nmpz'&&g.timer===30&&on(M.d,'#block')&&po.clickToGo===false&&po.linksControl===false&&M.d.querySelector('#timer').textContent==='⏱ 30s');
  M.w.__t.makeGuess(true);
  check('timeout with no pin scores 0',g.rounds[0].pts===0&&g.phase==='result');
  const S=browser('S');await sleep(30);const sel=S.d.querySelector('#hMove');sel.value='nomove';sel.dispatchEvent(new S.w.Event('change'));
  check('settings saved to hh:settings, not gc:settings',JSON.parse(S.w.localStorage.getItem('hh:settings')).move==='nomove'&&!('move' in JSON.parse(S.w.localStorage.getItem('gc:settings'))));}

 // ===== home -> play -> end -> home (Unlimited) =====
 {const D=browser('D',{shared:10});await sleep(40);
  D.d.querySelector('#hUnl').click();await D.ready();
  const g=D.w.__t.g(),nk=g.rounds.filter(r=>D.w.__t.BY_ID[r.ans].kraken).length;
  check('unlimited game started off home, 5 rounds, 2-3 Kraken',!on(D.d,'#home')&&g.mode==='unl'&&g.rounds.length===5&&nk>=2&&nk<=3);
  for(let i=0;i<5;i++){D.pinOff(0);D.d.querySelector('#nextBtn').click();}
  const end=D.end();console.log('      end screen:',end.slice(0,160));
  check('5 rounds reach #endS with 25,000 and every player named',on(D.d,'#endS')&&end.includes('25,000 / 25,000')&&g.rounds.every(r=>end.includes(D.w.__t.BY_ID[r.ans].name))&&g.phase==='final');
  check('every round bumped the shared counter (5)',D.st.posts===5&&D.st.panos===1);
  D.d.querySelector('#eHome').click();
  check('end -> back home',on(D.d,'#home')&&!on(D.d,'#endS'));
  check('saved under hh: keys only (no gc:g:, no nt:)',Object.keys(D.w.localStorage).includes('hh:g:unl')&&!Object.keys(D.w.localStorage).some(k=>k.startsWith('gc:g:')||k.startsWith('nt:')));}

 // ===== challenge round trip =====
 {const A=browser('Andrew');await sleep(30);
  A.d.querySelector('#hUnl').click();await A.ready();
  const gA=A.w.__t.g();for(let i=0;i<5;i++){A.pinOff(i<3?0:300);A.d.querySelector('#nextBtn').click();}
  const link=linkOf(A),ch=A.w.__t.b64d(new URL(link).searchParams.get('c'));
  console.log('      link',link.slice(0,70)+'…','| r[0]',JSON.stringify(ch.r[0]));
  check('challenge link: hh format (v, g, m, t, r=[pano, heading, id]x5, s)',link.includes('hometown-heroes.html?c=')&&ch.v===1&&ch.g==='hh'&&ch.m===gA.move&&ch.t===gA.timer&&ch.r.length===5&&ch.r.every((x,i)=>x[0]===gA.rounds[i].pano&&x[1]===gA.rounds[i].heading&&x[2]===gA.rounds[i].ans)&&ch.s[0][0]==='Andrew'&&ch.s[0][1].join()==='5000,5000,5000,1839,1839');
  const B=browser('Sam',{url:link});await sleep(30);
  const banner=txt(B.d.querySelector('#chalBanner'));console.log('      Sam banner:',banner);
  check('challenge banner names the challenger and top score',on(B.d,'#home')&&banner.includes('Andrew')&&banner.includes('18,678')&&!!B.d.querySelector('#hChal'));
  B.d.querySelector('#hChal').click();await B.ready();
  const gB=B.w.__t.g();
  check('challenge round trip: same panos and players, challenge mode',gB.mode==='chal'&&gB.rounds.map(r=>r.pano+r.ans).join()===gA.rounds.map(r=>r.pano+r.ans).join()&&gB.rounds.every((r,i)=>Math.abs(r.lat-gA.rounds[i].lat)<1e-9)&&B.d.querySelector('#hMode').textContent.includes('Challenge'));
  for(let i=0;i<5;i++){B.pinOff(0);B.d.querySelector('#nextBtn').click();}
  const endB=B.end();console.log('      Sam end:',endB.slice(0,200));
  check('challenge board shows both scores, Sam first',on(B.d,'#endS')&&endB.includes('Andrew')&&endB.includes('18,678')&&endB.includes('Sam (you)')&&endB.indexOf('Sam (you)')<endB.indexOf('Andrew'));
  const back=linkOf(B),chb=B.w.__t.b64d(new URL(back).searchParams.get('c'));
  check('sending results back carries both players',chb.s.length===2&&chb.s.map(x=>x[0]).sort().join()==='Andrew,Sam');
  const E=browser('Andrew',{url:back});for(const k of Object.keys(A.w.localStorage))if(k.startsWith('hh:c:'))E.w.localStorage.setItem(k,A.w.localStorage.getItem(k));
  E.w.eval('renderHome()');await sleep(30);E.d.querySelector('#hChal').click();await E.ready();
  check('returned link opens straight to the leaderboard',on(E.d,'#endS')&&E.end().includes('Sam')&&E.end().includes('Andrew (you)'));}

 // ===== bad / hostile challenge links =====
 {const R5=ids=>ids.map((x,i)=>['P'+(i+1),0,x]);const ok5=['mccann','beniers','crosby','mcdavid','kakko'];
  for(const id of ['nobody','constructor','__proto__','toString']){
   const X=browser('Sam',{url:URL0+'?c='+b64({v:1,g:'hh',m:'move',t:0,r:R5([id,...ok5.slice(1)]),s:[]})});await sleep(30);
   check(`unknown player id "${id}" invalidates the link`,X.w.__t.pc()===null&&txt(X.d.querySelector('#chalBanner'))===''&&on(X.d,'#home'));}
  const T2=browser('Sam',{url:URL0+'?c='+b64({v:1,g:'hh',m:'constructor',t:99999,r:R5(ok5),s:[]})});await sleep(30);
  check('challenge t clamped to 600, unknown move falls back to Moving',T2.w.__t.pc().t===600&&T2.w.__t.pc().m==='move'&&/Moving/.test(txt(T2.d.querySelector('#chalBanner'))));
  const evil=b64({v:1,g:'hh',m:'move',t:0,r:R5(ok5),s:[['<img src=x onerror=alert(1)>',['<img src=y onerror=alert(2)>',0,0,0,0]],['Ok',[1000,9999,'2',null,-5]]]});
  const X=browser('Sam',{url:URL0+'?c='+evil});await sleep(30);
  const bx=txt(X.d.querySelector('#chalBanner'));console.log('      hostile banner:',bx);
  check('hostile challenge s: no markup injected, banner shows a number',!X.d.querySelector('img')&&/Top score 6,002/.test(bx)&&bx.includes('<img'));
  X.d.querySelector('#hChal').click();await X.ready();for(let i=0;i<5;i++){X.pinOff(0);X.d.querySelector('#nextBtn').click();}
  check('hostile challenge s: leaderboard has no injected markup',on(X.d,'#endS')&&!X.d.querySelector('img')&&X.end().includes('6,002'));
  const badS=[];
  for(const s of [5,[null],[['a',5]],[['b',[1,2]]],'zz',{length:5}]){
   const M=browser('Sam',{url:URL0+'?c='+b64({v:1,g:'hh',m:'move',t:0,r:R5(ok5),s})});await sleep(30);
   const mb=txt(M.d.querySelector('#chalBanner'));
   if(!(on(M.d,'#home')&&txt(M.d.querySelector('#todayCard')).length&&mb.includes('You have a challenge')&&M.d.querySelector('#hMove').options.length===3))badS.push(JSON.stringify(s));}
  check('malformed challenge s doesn\'t break home'+(badS.length?' — broke on '+badS.join(' '):''),!badS.length);}

 // ===== live 2 players =====
 {const A=browser('Andrew'),B=browser('Sam');await sleep(30);
  A.d.querySelector('#hCreate').click();await A.ready();await sleep(60);
  const code=txt(A.d.querySelector('.rcode')),room=roomOf(code);
  console.log('      room',code,'settings',JSON.stringify(room.settings),'| ans',room.rounds.map(r=>r.ans).join(' '));
  check('live room created as game hh with a player id per round',on(A.d,'#lobby')&&room.settings.game==='hh'&&room.rounds.length===5&&room.rounds.every(r=>A.w.__t.BY_ID[r.ans]));
  B.d.querySelector('#hCode').value=code.toLowerCase();B.d.querySelector('#hJoin').click();await sleep(50);await B.ready();await sleep(50);
  await A.poll();
  check('both players in the lobby, host has move/timer controls, guest waits',txt(A.d.querySelector('#lobbyBody')).includes('Sam')&&!!A.d.querySelector('#lbStart')&&!!A.d.querySelector('#lbMove')&&!B.d.querySelector('#lbStart'));
  A.d.querySelector('#lbStart').click();await sleep(50);await B.poll();
  const gA=A.w.__t.g(),gB=B.w.__t.g();
  check('live started: same panos, both playing',gA.mode==='live'&&gB.mode==='live'&&gA.rounds[0].pano===gB.rounds[0].pano&&gA.phase==='play'&&gB.phase==='play');
  let resOk=true,gOk=true;
  for(let r=0;r<5;r++){
   A.pinOff(0);await sleep(30);
   if(r===0)check('host waits after guessing',gA.phase==='wait'&&A.panel().includes('locked in'));
   B.pinOff(300);await sleep(40);await A.poll();await B.poll();
   const p=A.w.__t.BY_ID[gA.rounds[r].ans],pA=A.panel(),pB=B.panel();
   if(r===0)console.log('      R1 result host:',pA.slice(0,200));
   if(!(pA.includes(p.name)&&pA.includes(p.town)&&pA.includes('Sam')&&pA.includes('5,000')&&pB.includes('1,839')&&!!A.d.querySelector('#resPanel .kbadge')===p.kraken))resOk=false;
   const gs=db.get('gc:room:'+code+':g')||{};
   const ga=JSON.parse(gs[r+':'+A.w.sessionStorage.getItem('gc:sid')]||'null'),gb=JSON.parse(gs[r+':'+B.w.sessionStorage.getItem('gc:sid')]||'null');
   if(!(ga&&ga.pts===5000&&ga.km<0.01&&typeof ga.lat==='number'&&gb&&gb.pts===1839&&Math.abs(gb.km-300)<1))gOk=false;
   if(r===0)check('guest sees no host button, waits for host',!B.d.querySelector('#liveNext')&&pB.includes('Waiting for the host'));
   A.d.querySelector('#liveNext').click();await sleep(40);await B.poll();await A.poll();}
  check('live result names the player and shows each player\'s points every round',resOk);
  check('guesses stored with pts/km/lat/lng',gOk);
  const fB=B.end();console.log('      FINAL guest:',fB.slice(0,160));
  check('final standings: Andrew 25,000 first, Sam 9,195',on(A.d,'#endS')&&on(B.d,'#endS')&&fB.includes('Andrew wins')&&fB.indexOf('Andrew')<fB.indexOf('Sam (you)')&&fB.includes('25,000')&&fB.includes('9,195'));
  B.d.querySelector('#liveHome').click();
  check('guest back home, room left',on(B.d,'#home')&&!on(B.d,'#endS')&&B.w.__t.live()===null&&B.w.location.search==='');
  check('every live round bumped the shared counter (5 each)',A.st.posts===5&&B.st.posts===5);}

 // ===== redirects =====
 {const mk=async s=>(await callApi({action:'create',id:'h',name:'H',settings:s,rounds:Array.from({length:5},()=>({pano:'X',heading:0,lat:1,lng:2,ans:'mccann'}))})).j.code;
  const geo=await mk({}),ntt=await mk({game:'ntt'}),hh=await mk({game:'hh'});
  const G1=browser('Sam',{url:URL0+'?room='+geo});await sleep(60);G1.d.querySelector('#hJoinInv').click();await sleep(200);
  check('geo room -> geo-clue.html?room=CODE',G1.w.__went==='geo-clue.html?room='+geo&&!G1.w.__t.g());
  const G2=browser('Sam',{url:URL0+'?room='+ntt});await sleep(60);G2.d.querySelector('#hJoinInv').click();await sleep(200);
  check('ntt room -> name-that-team.html?room=CODE',G2.w.__went==='name-that-team.html?room='+ntt);
  const G3=browser('Sam',{url:URL0+'?room='+hh});await sleep(60);G3.d.querySelector('#hJoinInv').click();await sleep(50);await G3.ready();await sleep(50);
  check('hh room is not redirected',G3.w.__went===undefined&&on(G3.d,'#lobby'));
  const r5=[['a',0,'r'],['b',0,'r'],['c',0,'r'],['d',0,'r'],['e',0,'r']];
  const geoLink=b64({v:1,p:'world',m:'move',t:0,r:r5,s:[]});
  const L1=browser('Sam',{url:URL0+'?c='+geoLink});await sleep(30);
  check('Geo Clue challenge link (no g) -> geo-clue.html',L1.w.__went==='geo-clue.html?c='+geoLink);
  const nttLink=b64({v:1,g:'ntt',h:0,m:'move',t:0,r:r5,s:[]});
  const L2=browser('Sam',{url:URL0+'?c='+nttLink});await sleep(30);
  check('ntt challenge link -> name-that-team.html',L2.w.__went==='name-that-team.html?c='+nttLink);
  const L3=browser('Sam',{url:URL0+'?c='+b64({v:1,g:'constructor',r:r5,s:[]})});await sleep(30);
  check('link with g "constructor" is broken, not redirected',L3.w.__went===undefined&&L3.w.__t.pc()===null);}

 console.log(bad?`${bad} FAILED`:'ALL PASS');
 process.exit(process.exitCode||0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

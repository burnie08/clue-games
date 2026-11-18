// Smoke test: Name That Team challenge links + live rooms, in fake browsers (jsdom) with fake Google + fake Redis.
// Usage: cd tests && node smoke-ntt-multi.js
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const ROOT=path.join(__dirname,'..');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0;const check=(label,ok)=>{console.log((ok?'PASS ':'FAIL ')+label);if(!ok){bad++;process.exitCode=1;}};
const html=fs.readFileSync(path.join(ROOT,'name-that-team.html'),'utf8');const src0=html.match(/<script>([\s\S]*)<\/script>/)[1];
// redirects call goPage(url) → location.replace; record them instead (jsdom can't navigate)
const src=src0.replace(/function goPage\(url\) \{[^}]*\}/,'function goPage(url) { window.__went = url; }');
const on=(d,id)=>d.querySelector(id).classList.contains('on');
const txt=e=>e?e.textContent.replace(/\s+/g,' ').trim():'';
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
// ---- browser factory: fake Street View returns a pano at the requested point; pano-id lookups read it back ----
const panoLocs={};let panoN=0;
function browser(name,opts={}){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:opts.url||'https://clue-games.vercel.app/name-that-team.html'});const w=dom.window;
 w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX',name}));
 w.localStorage.setItem('nt:settings',JSON.stringify(Object.assign({liveTimer:0},opts.nt||{})));
 w.navigator.clipboard={writeText:async t=>{w.__copied=t}};
 const st={panos:0,posts:0};
 class LL{constructor(a,b){this.a=a;this.b=b}lat(){return this.a}lng(){return this.b}}
 class O{constructor(o){this.o=o||{};this.ls={}}addListener(e,f){this.ls[e]=f}setMap(m){this.m=m}getMap(){return this.m}}
 class Marker extends O{constructor(o){super(o);this.m=o.map;this.p=o.position}setPosition(p){this.p=p}getPosition(){return new LL(this.p.lat,this.p.lng)}}
 class Map extends O{setCenter(){}setZoom(){}fitBounds(){}}
 class Pano extends O{constructor(e,o){super(o);st.panos++;this.pano=o.pano}setOptions(o){this.o=o;this.pano=o.pano}getPano(){return this.pano}setPano(p){this.pano=p}setPov(){}setZoom(){}}
 class SVS{async getPanorama(r){
  if(r.pano){const l=panoLocs[r.pano];if(!l)throw new Error('ZERO_RESULTS');return{data:{location:{pano:r.pano,latLng:new LL(l.lat,l.lng),description:'X'}}}}
  const id='P'+(++panoN);panoLocs[id]={lat:r.location.lat,lng:r.location.lng};return{data:{location:{pano:id,latLng:new LL(r.location.lat,r.location.lng),description:'X'}}}}}
 w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g',OUTDOOR:'o'}},marker:{Marker}})[k]}};
 w.fetch=async(u,o)=>{u=String(u);
  if(u.includes('api/usage')){if(o&&o.method==='POST')st.posts++;return{ok:false,status:503,json:async()=>({error:'nodb'})};}
  if(u.includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};
  const {status,j}=await callApi(JSON.parse(o.body));return{ok:status<300,status,json:async()=>j};};
 w.eval(src+';window.__t={pc:()=>pendingChal,g:()=>game,TEAM,distKm,poll:pollRoom,live:()=>live,b64d,pano:()=>pano,selectTeam,makeGuess};');
 const d=w.document;
 return {w,d,st,
  async ready(){await sleep(20);if(w.__gcReady)await w.__gcReady();await sleep(80);},
  choose(code){d.querySelector(`#teamPicker [data-team="${code}"]`).click();d.querySelector('#guessBtn').click();},
  wrong(ans){return Object.keys(w.__t.TEAM).find(c=>c!==ans);},
  panel(){return txt(d.querySelector('#resPanel'));},
  end(){return txt(d.querySelector('#endBody'));},
  async poll(){await w.__t.poll();await sleep(20);}};
}
const linkOf=B=>{B.d.querySelector('#chalBtn').click();return B.d.querySelector('#chLink').value;};
(async()=>{
 // ===== challenge round trip =====
 {const A=browser('Andrew');await sleep(30);
  A.d.querySelector('#hUnl').click();await A.ready();
  const gA=A.w.__t.g();
  for(let i=0;i<5;i++){const r=gA.rounds[i];A.choose(i<3?r.ans:A.wrong(r.ans));A.d.querySelector('#nextBtn').click();}
  const totA=gA.rounds.reduce((a,r)=>a+r.pts,0);
  const link=linkOf(A);const ch=A.w.__t.b64d(new URL(link).searchParams.get('c'));
  console.log('      Andrew scored',totA,'| link',link.slice(0,70)+'…','| r[0]',JSON.stringify(ch.r[0]));
  check('challenge link: ntt format (v, g, h, m, t, r=[pano, heading, ans]x5, s)',link.includes('name-that-team.html?c=')&&ch.v===1&&ch.g==='ntt'&&ch.h===0&&ch.m===gA.move&&ch.t===gA.timer&&ch.r.length===5&&ch.r.every((x,i)=>x[0]===gA.rounds[i].pano&&x[2]===gA.rounds[i].ans)&&ch.s[0][0]==='Andrew'&&ch.s[0][1].join()==='5000,5000,5000,0,0');
  const B=browser('Sam',{url:link});await sleep(30);
  const banner=txt(B.d.querySelector('#chalBanner'));console.log('      Sam home banner:',banner);
  check('challenge banner on home names the challenger',on(B.d,'#home')&&banner.includes('Andrew')&&!!B.d.querySelector('#hChal'));
  B.d.querySelector('#hChal').click();await B.ready();
  const gB=B.w.__t.g();
  check('challenge round trip: same panos and answers, challenge mode',gB.mode==='chal'&&gB.rounds.map(r=>r.pano+r.ans).join()===gA.rounds.map(r=>r.pano+r.ans).join()&&gB.rounds.every((r,i)=>Math.abs(r.lat-gA.rounds[i].lat)<1e-9)&&B.d.querySelector('#hMode').textContent.includes('Challenge'));
  for(let i=0;i<5;i++){B.choose(gB.rounds[i].ans);B.d.querySelector('#nextBtn').click();}
  const endB=B.end();console.log('      Sam end screen:',endB.slice(0,200));
  check('challenge result board shows both scores, Sam first',on(B.d,'#endS')&&endB.includes('Andrew')&&endB.includes('15,000')&&endB.includes('Sam (you)')&&endB.indexOf('Sam (you)')<endB.indexOf('Andrew'));
  const back=linkOf(B);const chb=B.w.__t.b64d(new URL(back).searchParams.get('c'));
  check('sending results back carries both players',chb.s.length===2&&chb.s.map(x=>x[0]).sort().join()==='Andrew,Sam');
  // Andrew opens the returned link: his own run is remembered, so it goes straight to the board
  const E=browser('Andrew',{url:back});for(const k of Object.keys(A.w.localStorage))if(k.startsWith('nt:c:'))E.w.localStorage.setItem(k,A.w.localStorage.getItem(k));
  E.w.eval('renderHome()');await sleep(30);E.d.querySelector('#hChal').click();await E.ready();
  check('returned link opens straight to the leaderboard',on(E.d,'#endS')&&E.end().includes('Sam')&&E.end().includes('Andrew (you)'));}

 // ===== hard challenge stays hard =====
 {const H=browser('Hana',{nt:{hard:true}});await sleep(30);
  H.d.querySelector('#hUnl').click();await H.ready();
  const gH=H.w.__t.g();for(let i=0;i<5;i++){H.choose(gH.rounds[i].ans);H.d.querySelector('#nextBtn').click();}
  const link=linkOf(H),ch=H.w.__t.b64d(new URL(link).searchParams.get('c'));
  const B=browser('Sam',{url:link,nt:{hard:false,move:'move',timer:0}});await sleep(30);
  console.log('      hard banner:',txt(B.d.querySelector('#chalBanner')));
  B.d.querySelector('#hChal').click();await B.ready();
  const g=B.w.__t.g(),po=B.w.__t.pano().o;
  check('hard challenge stays hard: h=1, game.hard, NMPZ, 25s timer, view locked',ch.h===1&&g.hard===true&&g.move==='nmpz'&&g.timer===25&&B.d.querySelector('#timer').textContent==='⏱ 25s'&&on(B.d,'#block')&&po.clickToGo===false);
  B.w.__t.selectTeam(g.rounds[0].ans);B.w.__t.makeGuess(true);
  check('hard challenge: timeout scores 0',g.rounds[0].pts===0);}

 // ===== live 2 players =====
 {const A=browser('Andrew'),B=browser('Sam');await sleep(30);
  A.d.querySelector('#hCreate').click();await A.ready();await sleep(60);
  const code=txt(A.d.querySelector('.rcode'));const room=roomOf(code);
  console.log('      room',code,'settings',JSON.stringify(room.settings),'| ans',room.rounds.map(r=>r.ans).join(' '));
  check('live room created as game ntt with an answer per round',on(A.d,'#lobby')&&room.settings.game==='ntt'&&room.settings.hard===false&&room.rounds.length===5&&room.rounds.every(r=>A.w.__t.TEAM[r.ans]));
  B.d.querySelector('#hCode').value=code.toLowerCase();B.d.querySelector('#hJoin').click();await sleep(50);await B.ready();await sleep(50);
  await A.poll();
  check('both players in the lobby, guest waits for host',txt(A.d.querySelector('#lobbyBody')).includes('Sam')&&!!A.d.querySelector('#lbStart')&&!B.d.querySelector('#lbStart')&&!!A.d.querySelector('#lbMove'));
  A.d.querySelector('#lbStart').click();await sleep(50);await B.poll();
  const gA=A.w.__t.g(),gB=B.w.__t.g();
  check('live started: same panos, both playing, picker shown',gA.mode==='live'&&gB.mode==='live'&&gA.rounds[0].pano===gB.rounds[0].pano&&gA.phase==='play'&&gB.phase==='play'&&!B.d.querySelector('#picker').hidden);
  let resOk=true,pickOk=true;
  for(let r=0;r<5;r++){
   const ans=gA.rounds[r].ans,wr=B.wrong(ans);
   A.choose(ans);await sleep(30);
   if(r===0)check('host waits after picking (picker hidden, locked in)',gA.phase==='wait'&&A.d.querySelector('#picker').hidden&&A.panel().includes('locked in'));
   B.choose(wr);await sleep(40);await A.poll();await B.poll();
   const pA=A.panel(),pB=B.panel(),T=A.w.__t.TEAM;
   if(r===0)console.log('      R1 result host:',pA.slice(0,200));
   if(!(pA.includes(T[ans].name)&&pA.includes(T[wr].name)&&pA.includes('5,000')&&pB.includes('Andrew')&&pB.includes(T[wr].name)))resOk=false;
   const gs=db.get('gc:room:'+code+':g')||{};
   const ga=JSON.parse(gs[r+':'+A.w.sessionStorage.getItem('gc:sid')]||'null'),gb=JSON.parse(gs[r+':'+B.w.sessionStorage.getItem('gc:sid')]||'null');
   if(!(ga&&ga.pick===ans&&ga.pts===5000&&gb&&gb.pick===wr&&gb.pts===0))pickOk=false;
   if(r===0)check('guest sees no host button, waits for host',!B.d.querySelector('#liveNext')&&pB.includes('Waiting for the host'));
   A.d.querySelector('#liveNext').click();await sleep(40);await B.poll();await A.poll();
  }
  check('live result shows each player\'s pick and points every round',resOk);
  check('guesses stored with pick (team code) and pts 5000/0',pickOk);
  const fA=A.end(),fB=B.end();console.log('      FINAL guest:',fB.slice(0,160));
  check('final standings: Andrew 25,000 first, Sam 0',on(A.d,'#endS')&&on(B.d,'#endS')&&fB.includes('Andrew wins')&&fB.indexOf('Andrew')<fB.indexOf('Sam (you)')&&fA.includes('25,000'));
  B.d.querySelector('#liveHome').click();
  check('guest back home, room left',on(B.d,'#home')&&!on(B.d,'#endS')&&B.w.__t.live()===null&&B.w.location.search==='');
  check('every live round bumped the shared counter (5 each)',A.st.posts===5&&B.st.posts===5);}

 // ===== room created with hard on =====
 {const A=browser('Andrew',{nt:{liveHard:true,liveMove:'move',liveTimer:120}}),B=browser('Sam');await sleep(30);
  check('home: live hard toggle hides live move/timer',A.d.querySelector('#lHard').checked&&A.d.querySelector('#lOpts').hidden);
  A.d.querySelector('#hCreate').click();await A.ready();await sleep(60);
  const code=txt(A.d.querySelector('.rcode')),room=roomOf(code),T=A.w.__t.TEAM;
  const far=Math.max(...room.rounds.map(r=>A.w.__t.distKm(r,T[r.ans])));
  console.log('      hard room settings',JSON.stringify(room.settings),'| furthest spot',(far*1000).toFixed(0),'m');
  check('hard room: hard, NMPZ, 25s; rounds are hard spots (within 0.3 km of arena)',room.settings.hard===true&&room.settings.move==='nmpz'&&room.settings.timer===25&&far<=0.3);
  B.d.querySelector('#hCode').value=code;B.d.querySelector('#hJoin').click();await sleep(50);await B.ready();await sleep(50);await A.poll();
  const lb=txt(B.d.querySelector('#lobbyBody'));console.log('      guest lobby:',lb.slice(0,160));
  check('guest sees hard label; host has no move/timer controls',/Hard/.test(lb)&&/25/.test(lb)&&!A.d.querySelector('#lbMove')&&!A.d.querySelector('#lbTimer')&&/Hard/.test(txt(A.d.querySelector('#lobbyBody'))));
  A.d.querySelector('#lbStart').click();await sleep(50);await B.poll();
  const g=B.w.__t.g();
  check('hard live game: hard, NMPZ, 25s timer, view locked',g.hard===true&&g.move==='nmpz'&&g.timer===25&&on(B.d,'#block')&&/25s/.test(B.d.querySelector('#timer').textContent));
  B.w.__t.selectTeam(g.rounds[0].ans);B.w.__t.makeGuess(true);await sleep(40);
  const gs=db.get('gc:room:'+code+':g')||{},gb=JSON.parse(gs['0:'+B.w.sessionStorage.getItem('gc:sid')]||'null');
  check('hard live timeout sends pts 0, pick null',gb&&gb.pts===0&&gb.pick===null);}

 // ===== redirects =====
 {const code=(await callApi({action:'create',id:'h',name:'H',settings:{},rounds:Array.from({length:5},()=>({pano:'X',heading:0,lat:1,lng:2}))})).j.code;
  const G=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?room='+code});await sleep(60);
  G.d.querySelector('#hJoinInv').click();await sleep(200);
  check('geo code redirects: geo room -> geo-clue.html?room=CODE',G.w.__went==='geo-clue.html?room='+code&&!G.w.__t.g());
  check('joining a geo room from this page leaves no ghost player',Object.keys(db.get('gc:room:'+code+':p')||{}).join()==='h');
  const ntt=(await callApi({action:'create',id:'h',name:'H',settings:{game:'ntt'},rounds:Array.from({length:5},()=>({pano:'X',heading:0,lat:1,lng:2,ans:'SEA'}))})).j.code;
  const N=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?room='+ntt});await sleep(60);N.d.querySelector('#hJoinInv').click();await sleep(50);await N.ready();await sleep(50);
  check('ntt room is not redirected',N.w.__went===undefined&&on(N.d,'#lobby'));
  check('ntt room joined in one step (one Join click)',Object.keys(db.get('gc:room:'+ntt+':p')||{}).length===2);
  const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const geoLink=b64({v:1,p:'world',m:'move',t:0,r:[['a',0,'r'],['b',0,'r'],['c',0,'r'],['d',0,'r'],['e',0,'r']],s:[]});
  const L=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+geoLink});await sleep(30);
  check('Geo Clue challenge link (no g) redirects to geo-clue.html',L.w.__went==='geo-clue.html?c='+geoLink);
  const hhLink=b64({v:1,g:'hh',r:[['a',0,'x'],['b',0,'x'],['c',0,'x'],['d',0,'x'],['e',0,'x']],s:[]});
  const L2=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+hhLink});await sleep(30);
  check('hh challenge link redirects to hometown-heroes.html',L2.w.__went==='hometown-heroes.html?c='+hhLink);
  // ===== hostile / malformed scores in a link =====
  const R5=[['P1',0,'SEA'],['P2',0,'VAN'],['P3',0,'BOS'],['P4',0,'TOR'],['P5',0,'NYR']];
  const evil=b64({v:1,g:'ntt',h:0,m:'move',t:0,r:R5,s:[['x',['<img src=x onerror=alert(1)>',0,0,0,0]],['Ok',[1000,9999,'2',null,-5]]]});
  const X=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+evil});await sleep(30);
  const bx=txt(X.d.querySelector('#chalBanner'));console.log('      hostile banner:',bx);
  check('hostile scores: no <img> injected, banner shows a number',!X.d.querySelector('#chalBanner img')&&!X.d.querySelector('img')&&/Top score 6,002/.test(bx));
  const badS=[];
  for(const s of [5,[null],[['a',5]],[['b',[1,2]]],'zz']){
   const M=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+b64({v:1,g:'ntt',h:0,m:'move',t:0,r:R5,s})});await sleep(30);
   const mb=txt(M.d.querySelector('#chalBanner'));
   if(!(on(M.d,'#home')&&txt(M.d.querySelector('#todayCard')).length&&mb.includes('You have a challenge')&&M.d.querySelector('#hMove').options.length===3))badS.push(JSON.stringify(s));
  }
  const T5=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+b64({v:1,g:'ntt',h:0,m:'constructor',t:99999,r:R5,s:[]})});await sleep(30);
  check('ntt link: t clamped to 600, unknown move falls back to Moving',!!T5.w.__t.pc()&&T5.w.__t.pc().t===600&&T5.w.__t.pc().m==='move'&&/Moving/.test(txt(T5.d.querySelector('#chalBanner'))));
  for(const id of ['constructor','__proto__','toString']){
   const Y=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+b64({v:1,g:'ntt',h:0,m:'move',t:0,r:[...R5.slice(0,4),['P5',0,id]],s:[]})});await sleep(30);
   check(`ntt link with team "${id}" is broken`,Y.w.__t.pc()===null&&txt(Y.d.querySelector('#chalBanner'))==='');}
  const Z=browser('Sam',{url:'https://clue-games.vercel.app/name-that-team.html?c='+b64({v:1,g:'constructor',r:R5,s:[]})});await sleep(30);
  check('ntt page: link with g "constructor" is broken, not redirected',Z.w.__went===undefined&&Z.w.__t.pc()===null);
  check('malformed scores (5, [null], bad entries, string): home still renders, banner shown'+(badS.length?' — broke on '+badS.join(' '):''),!badS.length);}

 console.log(bad?`${bad} FAILED`:'ALL PASS');
 process.exit(process.exitCode||0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

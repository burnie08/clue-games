// Smoke test: room API game fields (game, hard, ans, pick) + geo-clue.html redirect for other games' rooms.
// Usage: cd tests && node smoke-room-games.js
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const ROOT=path.join(__dirname,'..');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0;const check=(label,ok)=>{console.log((ok?'PASS ':'FAIL ')+label);if(!ok){bad++;process.exitCode=1;}};
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
const mk=(extra)=>Array.from({length:5},(_,i)=>Object.assign({pano:'P'+i,heading:0,lat:1,lng:2,desc:'d',region:'r'},extra&&extra(i)));
const create=async(settings,rounds)=>(await callApi({action:'create',id:'host',name:'H',settings,rounds:rounds||mk()})).j.code;
const get=async code=>(await callApi({action:'get',code})).j;
(async()=>{
 let code=await create({game:'ntt',hard:true},mk(i=>({ans:'SEA'})));let d=await get(code);
 check('room create keeps game+ans',d.room.settings.game==='ntt'&&d.room.settings.hard===true&&d.room.rounds[0].ans==='SEA');
 code=await create({},mk());d=await get(code);
 check('old room defaults to geo',d.room.settings.game==='geo'&&d.room.settings.hard===false&&d.room.rounds[0].ans==='');
 code=await create({game:'xyz'});d=await get(code);
 check('bad game falls back',d.room.settings.game==='geo');
 code=await create({game:'hh'},mk(i=>({ans:'x'.repeat(60)})));d=await get(code);
 check('ans is capped at 40 chars',d.room.rounds[0].ans.length===40);
 code=await create({game:'ntt'},mk(i=>({ans:'SEA'})));
 await callApi({action:'start',code,id:'host'});
 await callApi({action:'guess',code,id:'host',round:0,pts:100,pick:'VAN'});
 d=await get(code);check('guess keeps pick',d.guesses['0:host']&&d.guesses['0:host'].pick==='VAN');
 await callApi({action:'guess',code,id:'host',round:1,pts:0});
 await callApi({action:'next',code,id:'host'});
 d=await get(code);check('guess without pick stores null',d.guesses['1:host']===undefined||d.guesses['1:host'].pick===null);
 code=await create({game:'ntt',hard:true});
 await callApi({action:'settings',code,id:'host',settings:{hard:false}});d=await get(code);
 check('settings action toggles hard',d.room.settings.hard===false);
 // ---- join tells the page which game the room is for, and only adds the player when the page matches ----
 const players=code=>Object.keys(db.get('gc:room:'+code+':p')||{});
 code=await create({game:'ntt'},mk(i=>({ans:'SEA'})));
 let jr=await callApi({action:'join',code,id:'p2',name:'Sam',game:'geo'});
 check('join from the wrong page: not added, told the game',jr.status===200&&jr.j.game==='ntt'&&jr.j.ok===false&&players(code).join()==='host');
 jr=await callApi({action:'join',code,id:'p2',name:'Sam',game:'ntt'});
 check('join from the right page adds the player',jr.status===200&&jr.j.ok===true&&players(code).sort().join()==='host,p2');
 code=await create({});jr=await callApi({action:'join',code,id:'p3',name:'Old'});
 check('join without a game (older page) still adds the player',jr.j.ok===true&&players(code).includes('p3'));
 // ---- geo-clue.html redirects other games' rooms ----
 const html=fs.readFileSync(path.join(ROOT,'geo-clue.html'),'utf8');const src0=html.match(/<script>([\s\S]*)<\/script>/)[1];
 // redirects call goPage(url) → location.replace; record them instead (jsdom can't navigate)
 const src=src0.replace(/function goPage\(url\) \{[^}]*\}/,'function goPage(url) { window.__went = url; }');
 const txt=e=>e?e.textContent.replace(/\s+/g,' ').trim():'';
 const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 function geoPage(qs){
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://clue-games.vercel.app/geo-clue.html'+qs});const w=dom.window;
  w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX',name:'Sam',timer:0}));
  w.fetch=async(u,o)=>{if(String(u).includes('api/usage'))return{ok:false,status:503,json:async()=>({error:'nodb'})};if(String(u).includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};const {status,j}=await callApi(JSON.parse(o.body));return{ok:status<300,status,json:async()=>j}};
  w.eval(src+';window.__pc=()=>pendingChal;');
  return w;}
 async function openGeo(rc){
  const w=geoPage('?room='+rc);
  await sleep(80);
  const b=w.document.querySelector('#hJoinInv');if(b)b.click();
  await sleep(300);return w;}
 code=await create({game:'ntt'},mk(i=>({ans:'SEA'})));
 let w=await openGeo(code);
 check('geo page redirects ntt room',w.__went==='name-that-team.html?room='+code);
 check('geo page joining an ntt room leaves no ghost player',players(code).join()==='host');
 code=await create({game:'hh'});w=await openGeo(code);
 check('geo page redirects hh room',w.__went==='hometown-heroes.html?room='+code);
 check('geo page joining an hh room leaves no ghost player',players(code).join()==='host');
 code=await create({});w=await openGeo(code);
 check('geo page keeps a geo room',w.__went===undefined);
 check('geo page joins a geo room in one step',players(code).length===2);
 // ---- hostile / malformed Geo Clue challenge links ----
 const R5=[['P1',0,'r'],['P2',0,'r'],['P3',0,'r'],['P4',0,'r'],['P5',0,'r']];
 const evil=b64({v:1,p:'constructor',m:'constructor',t:'<img src=t onerror=alert(3)>',r:R5,s:[['<img src=x onerror=alert(1)>',['<img src=y onerror=alert(2)>',0,0,0,0]],['Ok',[1000,9999,'2',null,-5]]]});
 w=geoPage('?c='+evil);await sleep(80);
 const bx=txt(w.document.querySelector('#chalBanner'));console.log('      hostile banner:',bx);
 check('hostile geo link: no <img> injected anywhere',!w.document.querySelector('img'));
 check('hostile geo link: banner shows a number and safe labels',/Top score 6,002/.test(bx)&&bx.includes('<img src=x')&&/World/.test(bx)&&/Moving/.test(bx)&&!/onerror=alert\(3\)/.test(bx));
 {const pc=w.__pc();check('hostile geo link: t, p, m and scores cleaned',!!pc&&pc.t===0&&pc.p==='world'&&pc.m==='move'&&pc.s.length===2&&pc.s[0][1].join()==='0,0,0,0,0'&&pc.s[1][1].join()==='1000,5000,2,0,0');}
 w=geoPage('?c='+b64({v:1,p:'world',m:'move',t:99999,r:R5,s:[]}));await sleep(60);
 check('geo link t clamped to 600',!!w.__pc()&&w.__pc().t===600);
 const badS=[];
 for(const s of [5,[null],[['a',5]],[['b',[1,2]]],'zz',{length:5}]){
  const M=geoPage('?c='+b64({v:1,p:'world',m:'move',t:0,r:R5,s}));await sleep(60);
  const mb=txt(M.document.querySelector('#chalBanner'));
  if(!(M.document.querySelector('#home').classList.contains('on')&&txt(M.document.querySelector('#todayCard')).length&&mb.includes('You have a challenge')&&Array.isArray(M.__pc().s)&&M.__pc().s.length===0))badS.push(JSON.stringify(s));}
 check('malformed geo link scores don\'t break home'+(badS.length?' — broke on '+badS.join(' '):''),!badS.length);
 const nttLink=b64({v:1,g:'ntt',h:0,m:'move',t:0,r:R5,s:[]});
 w=geoPage('?c='+nttLink);await sleep(60);
 check('ntt challenge link on geo page -> name-that-team.html',w.__went==='name-that-team.html?c='+nttLink);
 const hhLink=b64({v:1,g:'hh',m:'move',t:0,r:R5,s:[]});
 w=geoPage('?c='+hhLink);await sleep(60);
 check('hh challenge link on geo page -> hometown-heroes.html',w.__went==='hometown-heroes.html?c='+hhLink);
 w=geoPage('?c='+b64({v:1,g:'constructor',r:R5,s:[]}));await sleep(60);
 check('link with g "constructor" is broken, not redirected',w.__went===undefined&&w.__pc()===null);
 console.log(bad?bad+' FAILED':'ALL PASSED');process.exit(process.exitCode||0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

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
 // ---- geo-clue.html redirects other games' rooms ----
 const html=fs.readFileSync(path.join(ROOT,'geo-clue.html'),'utf8');const src=html.match(/<script>([\s\S]*)<\/script>/)[1];
 async function openGeo(rc){
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://clue-games.vercel.app/geo-clue.html?room='+rc});const w=dom.window;
  w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX',name:'Sam',timer:0}));
  const urls=[];
  w.fetch=async(u,o)=>{if(String(u).includes('api/usage'))return{ok:false,status:503,json:async()=>({error:'nodb'})};if(String(u).includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};const {status,j}=await callApi(JSON.parse(o.body));return{ok:status<300,status,json:async()=>j}};
  w.eval(src+';window.goPage=u=>{window.__went=u};');
  await sleep(80);
  const b=w.document.querySelector('#hJoinInv');if(b)b.click();
  await sleep(300);return w;}
 code=await create({game:'ntt'},mk(i=>({ans:'SEA'})));
 let w=await openGeo(code);
 check('geo page redirects ntt room',w.__went==='name-that-team.html?room='+code);
 code=await create({game:'hh'});w=await openGeo(code);
 check('geo page redirects hh room',w.__went==='hometown-heroes.html?room='+code);
 code=await create({});w=await openGeo(code);
 check('geo page keeps a geo room',w.__went===undefined);
 console.log(bad?bad+' FAILED':'ALL PASSED');process.exit(process.exitCode||0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

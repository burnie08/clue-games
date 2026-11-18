// Smoke test: runs the game in a fake browser (jsdom) with fake APIs and prints each step.
// Usage: cd tests && npm install && node smoke-live-timer.js
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const ROOT=path.join(__dirname,'..');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const html=fs.readFileSync(path.join(ROOT,'geo-clue.html'),'utf8');const src=html.match(/<script>([\s\S]*)<\/script>/)[1];
// ---- fake Upstash (pipeline REST) ----
const db=new Map();let cmds=0;
function run(c){cmds++;const [op,k,...a]=c;switch(op){
 case 'GET':return db.has(k)?db.get(k):null;
 case 'SET':{if(a.includes('NX')&&db.has(k))return null;db.set(k,a[0]);return 'OK';}
 case 'HSET':{const h=db.get(k)||{};h[a[0]]=a[1];db.set(k,h);return 1;}
 case 'HSETNX':{const h=db.get(k)||{};if(a[0] in h)return 0;h[a[0]]=a[1];db.set(k,h);return 1;}
 case 'HGETALL':{const h=db.get(k)||{};return Object.entries(h).flat();}
 case 'EXPIRE':return 1;default:throw new Error('cmd '+op);}}
process.env.KV_REST_API_URL='https://fake.upstash';process.env.KV_REST_API_TOKEN='t';
global.fetch=async(u,o)=>({ok:true,json:async()=>JSON.parse(o.body).map(c=>({result:run(c)}))});
const handler=require(path.join(ROOT,'api','room.js'));
async function callApi(body){return new Promise(res=>{const r={h:{},code:200,setHeader(){},status(c){this.code=c;return this},json(j){res({status:this.code,j})}};handler({method:'POST',body,query:{}},r);});}
// ---- browser factory ----
let panoN=0;
function browser(name,url){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:url||'https://clue-games.vercel.app/geo-clue.html'});const w=dom.window;
 w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX',name,timer:0}));
 w.navigator.clipboard={writeText:async t=>{w.__copied=t}};
 class LL{constructor(a,b){this.a=a;this.b=b}lat(){return this.a}lng(){return this.b}}
 class O{constructor(o){this.o=o||{};this.ls={}}addListener(e,f){this.ls[e]=f}setMap(m){this.m=m}getMap(){return this.m}}
 class Marker extends O{constructor(o){super(o);this.m=o.map;this.p=o.position}setPosition(p){this.p=p}getPosition(){return new LL(this.p.lat,this.p.lng)}}
 class Map extends O{setCenter(){}setZoom(){}fitBounds(){}}
 class Pano extends O{setOptions(){}getPano(){return 'x'}setPano(){}setPov(){}setZoom(){}}
 const locs={};class SVS{async getPanorama(r){if(r.pano){const l=global.__panoLocs[r.pano];return{data:{location:{pano:r.pano,latLng:new LL(l.lat,l.lng),description:'Road '+r.pano}}}}const id='PANO'+(++panoN);global.__panoLocs[id]={lat:r.location.lat,lng:r.location.lng};return{data:{location:{pano:id,latLng:new LL(r.location.lat,r.location.lng),description:'Road '+id}}}}}
 w.__LL=LL;
 w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g'}},marker:{Marker}})[k]}};
 w.fetch=async(u,o)=>{if(String(u).includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};const {status,j}=await callApi(JSON.parse(o.body));return{ok:status<300,status,json:async()=>j}};
 w.eval(src+';window.__t={g:()=>game,map:()=>map,poll:pollRoom,live:()=>live};');
 const d=w.document;
 const api={w,d,
  async ready(){await sleep(20);if(w.__gcReady)await w.__gcReady();await sleep(80);},
  guess(off){const r=w.__t.g().rounds[w.__t.g().idx];w.__t.map().ls.click({latLng:new LL(r.lat+off,r.lng+off)});d.querySelector('#guessBtn').click();},
  panel(){return d.querySelector('#resPanel').textContent.replace(/\s+/g,' ').trim();},
  async poll(){await w.__t.poll();await sleep(20);}};
 return api;}
global.__panoLocs={};
(async()=>{
 const A=browser('Andrew'),B=browser('Sam');await sleep(50);
 const lt=A.d.querySelector('#lTimer');console.log('TIMER home live-timer options:',[...lt.options].map(o=>o.textContent).join(', '),'| default:',lt.selectedOptions[0].textContent);
 lt.value='60';lt.dispatchEvent(new A.w.Event('change'));
 A.d.querySelector('#hCreate').click();await A.ready();await sleep(100);
 const code=A.d.querySelector('.rcode').textContent;const room=()=>JSON.parse(db.get('gc:room:'+code));
 console.log('      room created with timer:',room().settings.timer,'| host lobby picker shows:',A.d.querySelector('#lbTimer').selectedOptions[0].textContent);
 B.d.querySelector('#hCode').value=code;B.d.querySelector('#hJoin').click();await sleep(50);await B.ready();await sleep(50);
 console.log('      guest lobby (before change):',B.d.querySelector('#lobbyBody .help').textContent.trim(),'| guest has picker?',!!B.d.querySelector('#lbTimer'));
 const sel=A.d.querySelector('#lbTimer');sel.value='30';sel.dispatchEvent(new A.w.Event('change'));await sleep(50);
 await B.poll();
 console.log('      host changed to 30s -> db:',room().settings.timer,'| guest lobby now:',B.d.querySelector('#lobbyBody .help').textContent.trim());
 await A.poll();A.d.querySelector('#lbStart').click();await sleep(50);await B.poll();
 console.log('      started: host chip',A.d.querySelector('#timer').textContent,'| guest chip',B.d.querySelector('#timer').textContent,'| hidden?',B.d.querySelector('#timer').hidden);
 A.guess(0.5);await sleep(30);
 B.w.eval('makeGuess(true)');await sleep(60);await A.poll();await B.poll();
 console.log('      R1 guest ran out of time (no pin) -> host sees:',A.panel().slice(0,150));
 A.d.querySelector('#liveNext').click();await sleep(40);await B.poll();await A.poll();
 const r=room();r.startedAt-=40000;db.set('gc:room:'+code,JSON.stringify(r));
 await A.poll();await B.poll();
 console.log('      R2 nobody guessed, 40s passed on server -> guest sees:',B.panel().slice(0,140));
 // settings change after start is refused
 const res=await callApi({action:'settings',code,id:A.w.sessionStorage.getItem('gc:sid'),settings:{timer:0}});
 console.log('      changing timer after start ->',res.status,res.j.error);
 process.exit(0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

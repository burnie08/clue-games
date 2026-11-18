// Smoke test: runs the game in a fake browser (jsdom) with fake APIs and prints each step.
// Usage: cd tests && npm install && node smoke-multiplayer.js
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
 // ===== LIVE ROOM =====
 const A=browser('Andrew'),B=browser('Sam');await sleep(50);
 A.d.querySelector('#hCreate').click();await A.ready();await sleep(100);
 const code=A.d.querySelector('.rcode')?.textContent;
 console.log('LIVE  host created room:',code,'| lobby on:',A.d.querySelector('#lobby').classList.contains('on'),'| URL:',A.w.location.search);
 B.d.querySelector('#hCode').value=code.toLowerCase();B.d.querySelector('#hJoin').click();await sleep(50);await B.ready();await sleep(50);
 await A.poll();
 console.log('      lobby players (host view):',[...A.d.querySelectorAll('#lobbyBody .rounds div')].map(x=>x.textContent.trim()).join(' | '),'| host btn:',A.d.querySelector('#lbStart')?.textContent,'| guest btn:',B.d.querySelector('#lobbyBody button[disabled]')?.textContent);
 A.d.querySelector('#lbStart').click();await sleep(50);await B.poll();
 console.log('      started: host phase',A.w.__t.g().phase,'guest phase',B.w.__t.g().phase,'| same pano:',A.w.__t.g().rounds[0].pano===B.w.__t.g().rounds[0].pano,'| HUD:',B.d.querySelector('#hMode').textContent);
 for(let r=0;r<5;r++){
   A.guess(0.5);await sleep(30);
   console.log(`      R${r+1} host after guessing: ${A.panel().slice(0,60)}`);
   if(r===3){ // Sam AFK this round -> host ends round
     A.d.querySelector('#endRoundBtn').click();await sleep(40);await B.poll();
     console.log(`      R${r+1} host forced end; guest sees: ${B.panel().slice(0,90)}`);
   } else { B.guess(r%2?3:1);await sleep(40);await A.poll(); }
   await B.poll();
   console.log(`      R${r+1} result host: ${A.panel().slice(0,120)}…`);
   console.log(`      R${r+1} guest sees host-only button? ${!!B.d.querySelector('#liveNext')} | waiting text: ${B.panel().includes('Waiting for the host')}`);
   A.d.querySelector('#liveNext').click();await sleep(40);await B.poll();await A.poll();
 }
 console.log('      FINAL host:',A.panel().slice(0,140));
 console.log('      FINAL guest:',B.panel().slice(0,140));
 B.d.querySelector('#liveHome').click();console.log('      guest back home:',B.d.querySelector('#home').classList.contains('on'),'| URL cleared:',B.w.location.search==='');
 console.log('      db commands used for this whole game:',cmds);
 // ===== CHALLENGE LINK =====
 const C=browser('Andrew');await sleep(30);
 C.d.querySelector('#hUnl').click();await C.ready();
 for(let i=0;i<5;i++){C.guess(1);C.d.querySelector('#nextBtn').click();}
 const myTotal=C.w.__t.g().rounds.reduce((a,r)=>a+r.pts,0);
 C.d.querySelector('#chalBtn').click();const link=C.d.querySelector('#chLink').value;
 console.log('CHAL  Andrew scored',myTotal,'| link length',link.length,'| starts',link.slice(0,58)+'…');
 const D=browser('Sam',link);await sleep(30);
 console.log('      Sam home banner:',D.d.querySelector('#chalBanner').textContent.replace(/\s+/g,' ').trim());
 D.d.querySelector('#hChal').click();await D.ready();
 console.log('      Sam playing challenge:',D.d.querySelector('#hMode').textContent,'| same 1st pano:',D.w.__t.g().rounds[0].pano===C.w.__t.g().rounds[0].pano);
 for(let i=0;i<5;i++){D.guess(0.2);D.d.querySelector('#nextBtn').click();}
 console.log('      Sam final:',D.panel().slice(0,230));
 D.d.querySelector('#chalBtn').click();const back=D.d.querySelector('#chLink').value;
 const E=browser('Andrew',back);for(const k of Object.keys(C.w.localStorage)){if(k.startsWith('gc:c:'))E.w.localStorage.setItem(k,C.w.localStorage.getItem(k));}E.w.eval('renderHome()');await sleep(30);
 console.log('      Andrew opens returned link:',E.d.querySelector('#chalBanner').textContent.replace(/\s+/g,' ').trim());E.d.querySelector('#hChal').click();await E.ready();console.log('      -> straight to results:',E.panel().slice(0,40),'|',[...E.d.querySelectorAll('.rounds')].pop().textContent.replace(/\s+/g,' ').trim());
 process.exit(0);
})().catch(e=>{console.error('ERR',e);process.exit(1)});

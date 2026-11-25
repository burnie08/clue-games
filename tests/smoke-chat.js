// Smoke test: runs the game in a fake browser (jsdom) with fake APIs and prints each step.
// Usage: cd tests && npm install && node smoke-chat.js   (Geo Clue live room chat)
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
 w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g',OUTDOOR:'o'}},marker:{Marker}})[k]}};
 w.fetch=async(u,o)=>{if(String(u).includes('api/usage'))return{ok:false,status:503,json:async()=>({error:'nodb'})};if(String(u).includes('api/config'))return{ok:true,status:200,json:async()=>({googleMapsKey:''})};const {status,j}=await callApi(JSON.parse(o.body));return{ok:status<300,status,json:async()=>j}};
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
 A.d.querySelector('#hCreate').click();await A.ready();await sleep(100);
 const code=A.d.querySelector('.rcode').textContent;
 B.d.querySelector('#hCode').value=code;B.d.querySelector('#hJoin').click();await sleep(50);await B.ready();await sleep(50);await A.poll();
 const q=(X,s)=>X.d.querySelector(s);
 console.log('LOBBY chat button shown host/guest:',!q(A,'#chat').hidden,!q(B,'#chat').hidden,'| panel closed:',q(A,'#chatPanel').hidden);
 const say=async(X,t)=>{q(X,'#chatIn').value=t;q(X,'#chatForm').dispatchEvent(new X.w.Event('submit',{cancelable:true}));await sleep(40);};
 q(A,'#chatBtn').click();await say(A,'hi <b>all</b>');await B.poll();
 console.log('      Sam badge (unread):',q(B,'#chatBadge').hidden?'none':q(B,'#chatBadge').textContent);
 q(B,'#chatBtn').click();console.log('      Sam opens chat:',q(B,'#chatList').textContent,'| bold tag escaped:',!q(B,'#chatList b b'),'| badge gone:',q(B,'#chatBadge').hidden);
 await say(B,'hey');await say(B,'too fast');await A.poll();
 console.log('      Andrew sees:',[...A.d.querySelectorAll('#chatList div')].map(x=>x.textContent).join(' | '));
 q(A,'#lbStart').click();await sleep(50);await B.poll();
 console.log('PLAY  chat still shown during game:',!q(B,'#chat').hidden,'| phase',B.w.__t.g().phase);
 const r=await callApi({action:'chat',code,id:'stranger',text:'spam'});console.log('      outsider message refused:',r.status,r.j.error);
 const e=await callApi({action:'chat',code,id:A.w.__t.live().data.room.hostId,text:'   '});console.log('      empty message refused:',e.status,e.j.error);
 q(B,'#bHome').click();console.log('HOME  chat hidden after leaving:',q(B,'#chat').hidden);
 process.exit(0);
})().catch(e=>{console.error('FAIL',e);process.exit(1)});

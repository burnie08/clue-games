// Smoke test: runs the game in a fake browser (jsdom) with fake APIs and prints each step.
// Usage: cd tests && npm install && node smoke-single.js
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const ROOT=path.join(__dirname,'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const on=(d,id)=>d.querySelector(id).classList.contains('on');
function make(file,setup){const html=fs.readFileSync(path.join(ROOT,file),'utf8');const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://clue-games.vercel.app/'+file});const w=dom.window;
 w.HTMLMediaElement.prototype.load=()=>{};w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};
 w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.navigator.clipboard={writeText:async t=>{w.__copied=t}};
 setup&&setup(w);const src=html.match(/<script>([\s\S]*)<\/script>/)[1];return {w,d:w.document,src};}

async function reel(){
 const {w,d,src}=make('reel-clue.html',w=>{
  w.localStorage.setItem('rc:settings',JSON.stringify({key:'k',region:'US',poolSize:20}));
  const mk=id=>({id,title:'Film '+id,release_date:(1990+id)+'-01-01',poster_path:'/p.jpg',genres:[{name:'Drama'}],revenue:id*1e8,vote_average:7,production_companies:[{name:'S'}],tagline:'t',overview:'ov',credits:{crew:[{job:'Director',name:'D'}],cast:[]},release_dates:{results:[]}});
  w.fetch=async u=>{u=new URL(u);let b;if(u.pathname.includes('discover'))b={results:Array.from({length:20},(_,i)=>({id:i+1}))};else b=mk(+u.pathname.split('/').pop());return{ok:true,json:async()=>b}};});
 w.eval(src+';window.__t={a:()=>answer,guess};');
 await sleep(100);
 console.log('REEL  start: home on',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| btn:',d.querySelector('#hDaily').textContent);
 d.querySelector('#hDaily').click(); await sleep(200);
 console.log('      after play: home on',on(d,'#home'),'| nav:',[...d.querySelectorAll('nav button')].map(b=>b.textContent).join(' '));
 await w.__t.guess(w.__t.a().id); await sleep(1800);
 console.log('      end screen on',on(d,'#endS'),'|',d.querySelector('.endtitle').textContent,'| buttons:',[...d.querySelectorAll('#endBody button')].map(b=>b.textContent).join(' / '));
 d.querySelector('#eBoard').click(); console.log('      view guesses -> end off',!on(d,'#endS'),'| inline end shown',!d.querySelector('#end').hidden);
 d.querySelector('#homeBtn2').click(); console.log('      back home',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| btn:',d.querySelector('#hDaily').textContent);
 d.querySelector('#hDaily').click(); await sleep(200); console.log('      see result -> end screen',on(d,'#endS'));
 d.querySelector('#eHome').click(); console.log('      eHome -> home',on(d,'#home'),'end off',!on(d,'#endS'));
}
async function tune(){
 const {w,d,src}=make('tune-clue.html',w=>w.localStorage.setItem('tc:seenHelp2','true'));
 w.eval(src+';resolveTrack=async s=>({preview:"p",art:"a.jpg",name:s.title,artist:s.artist,year:"2000",url:"u"});window.__t={a:()=>answer,setRes:r=>results=r,choose,sub:submit,S:settings};');
 await sleep(100);
 console.log('TUNE  start: home on',on(d,'#home'),'| diff buttons:',[...d.querySelectorAll('#hDiff button')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(' '));
 d.querySelectorAll('#hDiff button')[2].click(); console.log('      picked Hard ->',w.__t.S.diff,'|',d.querySelector('#hDiffDesc').textContent.slice(0,40)+'…');
 d.querySelector('#hDaily').click(); await sleep(200);
 console.log('      playing: home on',on(d,'#home'),'| bar diff:',d.querySelector('#diff').value);
 w.__t.setRes([w.__t.a()]);w.__t.choose(0);w.__t.sub(); await sleep(400);
 console.log('      end screen on',on(d,'#endS'),'|',d.querySelector('.endtitle').textContent,'| ePlay:',d.querySelector('#ePlay').textContent,'| grid:',d.querySelector('.egrid').textContent);
 d.querySelector('#eHome').click(); console.log('      back home',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '));
 d.querySelectorAll('#hDiff button')[1].click(); console.log('      switch to Normal -> card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '));
}
async function geo(){
 let panoLoads=0;
 const {w,d,src}=make('geo-clue.html',w=>{
  w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX'}));
  class LL{constructor(a,b){this.a=a;this.b=b}lat(){return this.a}lng(){return this.b}}
  class O{constructor(o){this.o=o||{};this.ls={}}addListener(e,f){this.ls[e]=f}setMap(m){this.m=m}getMap(){return this.m}}
  class Marker extends O{constructor(o){super(o);this.m=o.map;this.p=o.position}setPosition(p){this.p=p}getPosition(){return new LL(this.p.lat,this.p.lng)}}
  class Map extends O{setCenter(){}setZoom(){}fitBounds(){}}
  class Pano extends O{constructor(e,o){super(o);panoLoads++;this.pano=o.pano}setOptions(o){this.pano=o.pano}getPano(){return this.pano}setPano(p){this.pano=p}setPov(){}setZoom(){}}
  let n=0;class SVS{async getPanorama(r){n++;return{data:{location:{pano:'P'+n,latLng:new LL(r.location.lat,r.location.lng),description:'X'}}}}}
  w.__LL=LL;
  w.google={maps:{importLibrary:async k=>({core:{LatLngBounds:class{extend(){}},SymbolPath:{CIRCLE:0}},maps:{Map,Polyline:O},streetView:{StreetViewPanorama:Pano,StreetViewService:SVS,StreetViewSource:{GOOGLE:'g'}},marker:{Marker}})[k]}};});
 w.eval(src+';window.__t={g:()=>game,map:()=>map};');
 await sleep(50);
 console.log('GEO   start: home on',on(d,'#home'),'| google script loaded yet:',[...d.scripts].some(s=>/maps.googleapis/.test(s.src)),'| unl selects:',d.querySelector('#hPack').value,d.querySelector('#hMove').value,d.querySelector('#hTimer').value,'|',d.querySelector('#hUsage').textContent);
 d.querySelector('#hDaily').click(); await sleep(50); await w.__gcReady(); await sleep(200);
 console.log('      after play: home on',on(d,'#home'),'| google script loaded:',[...d.scripts].some(s=>/maps.googleapis/.test(s.src)),'| phase',w.__t.g().phase);
 for(let i=0;i<5;i++){const r=w.__t.g().rounds[i];w.__t.map().ls.click({latLng:new w.__LL(r.lat+1,r.lng+1)});d.querySelector('#guessBtn').click();d.querySelector('#nextBtn').click();}
 console.log('      final panel:',d.querySelector('#resPanel').textContent.replace(/\s+/g,' ').slice(0,90)+'…','| home btn:',!!d.querySelector('#homeBtn'));
 d.querySelector('#homeBtn').click(); console.log('      back home',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '));
 d.querySelector('#hPack').value='europe';d.querySelector('#hPack').dispatchEvent(new w.Event('change'));
 d.querySelector('#hUnl').click(); await sleep(200); console.log('      unlimited from home:',d.querySelector('#hMode').textContent,'| home on',on(d,'#home'),'| pano objects',panoLoads);
}
(async()=>{await reel();await tune();await geo();process.exit(0)})().catch(e=>{console.error('ERR',e);process.exit(1)});

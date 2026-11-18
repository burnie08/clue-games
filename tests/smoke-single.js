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
 let panoLoads=0,shared=1234,bumps=0;
 const {w,d,src}=make('geo-clue.html',w=>{
  w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX'}));
  // fake /api/usage: shared Street View counter for everyone
  w.fetch=async(u,o)=>{if(String(u).includes('api/usage')){if(o&&o.method==='POST'){shared++;bumps++;}return{ok:true,status:200,json:async()=>({month:'2026-11',panos:shared,free:5000})};}return{ok:false,status:404,json:async()=>({})};};
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
 d.querySelector('#homeBtn').click(); await sleep(50); console.log('      back home',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '));
 console.log('      shared bumps sent:',bumps,'(expect 5) | home meter:',d.querySelector('#hUsage').textContent.replace(/\s+/g,' ').trim());
 d.querySelector('#hSet').click(); await sleep(50); console.log('      settings meter:',d.querySelector('#sMeter').textContent.replace(/\s+/g,' ').trim().slice(0,80)+'…'); d.querySelector('#mclose').click();
 d.querySelector('#hPack').value='europe';d.querySelector('#hPack').dispatchEvent(new w.Event('change'));
 d.querySelector('#hUnl').click(); await sleep(200); console.log('      unlimited from home:',d.querySelector('#hMode').textContent,'| home on',on(d,'#home'),'| pano objects',panoLoads);
}
async function geoNoDb(){
 const {w,d,src}=make('geo-clue.html',w=>{
  w.localStorage.setItem('gc:settings',JSON.stringify({key:'AIzaX'}));
  w.localStorage.setItem('gc:usage',JSON.stringify({month:new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'),panos:4200,maps:3}));
  w.fetch=async()=>({ok:false,status:503,json:async()=>({error:'nodb'})});});
 w.eval(src); await sleep(50);
 console.log('GEO   no database: home on',on(d,'#home'),'| meter:',d.querySelector('#hUsage').textContent.replace(/\s+/g,' ').trim());
}
async function world(){
 const {w,d,src}=make('world-clue.html');
 w.eval(src+';window.__t={g:()=>game,guess,search,draw:drawShape,by:BY,pool:answerPool,all:COUNTRIES.length,route:routeVia,pair:hopPair,mb:mulberry32,drawMap:drawHopMap,unl:startUnlimited};');
 await sleep(50);
 const opened=()=>d.querySelectorAll('.cover.open').length;
 console.log('WORLD start: home on',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| puzzles:',[...d.querySelectorAll('#hPuzzles button')].map(b=>b.textContent+(b.disabled?'(off)':'')).join(' '));
 console.log('      search "usa" ->',w.__t.search('usa').map(c=>c.name).join(', '),'| "congo" ->',w.__t.search('congo').map(c=>c.name).join(', '));
 d.querySelector('#hDaily').click(); await sleep(50);
 const ans=w.__t.g().answer;
 console.log('      playing: home on',on(d,'#home'),'| answer',ans,'| tiles open',opened(),'| empty rows',d.querySelectorAll('.grow.empty').length);
 const wrong=['fr','jp','br'].filter(c=>c!==ans&&!({td:'ro',ro:'td',mc:'id',id:'mc'})[c]);
 w.__t.guess(wrong[0]); w.__t.guess(wrong[1]);
 console.log('      2 misses -> tiles open',opened(),'| row 1:',d.querySelector('.grow').textContent.replace(/\s+/g,' ').trim());
 w.__t.guess(ans); await sleep(800);
 console.log('      win -> end screen',on(d,'#endS'),'|',d.querySelector('.endtitle').textContent,'| grid:',d.querySelector('.egrid').textContent.replace(/\n/g,' | '));
 d.querySelector('#eShare').click(); await sleep(10); console.log('      share text:',JSON.stringify(w.__copied));
 d.querySelector('#eHome').click(); console.log('      back home',on(d,'#home'),'| card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| daily stats:',d.querySelector('#hStatsRow').textContent.replace(/\s+/g,' ').trim());
 d.querySelector('#hUnl').click(); await sleep(50);
 const u=w.__t.g(); console.log('      unlimited: mode',u.mode,'| label',d.querySelector('#modeLbl').textContent);
 for(const c of ['fr','jp','br','de','in','au'].filter(c=>!({[u.answer]:1})[c]&&!(({td:'ro',ro:'td',mc:'id',id:'mc'})[c]===u.answer)).slice(0,6)) w.__t.guess(c);
 await sleep(800);
 console.log('      6 misses -> done',u.done,'won',u.won,'| end:',d.querySelector('.endtitle').textContent,'| buttons:',[...d.querySelectorAll('#endBody button')].map(b=>b.textContent).join(' / '));
 const first=u.answer; d.querySelector('#eNext').click(); await sleep(50);
 console.log('      next flag -> new answer',w.__t.g().answer!==first,'| guesses',w.__t.g().guesses.length);
 d.querySelector('#bHome').click(); console.log('      home unlimited stats:',d.querySelector('#hUStatsRow').textContent.replace(/\s+/g,' ').trim());
 // ---- Country puzzle ----
 d.querySelector('#hPuzzles button[data-p=country]').click();
 console.log('WORLD country tab: card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| btns:',d.querySelector('#hDaily').textContent,'/',d.querySelector('#hUnl').textContent);
 d.querySelector('#hDaily').click(); await sleep(50);
 const ca=w.__t.g().answer; console.log('      playing: answer',ca,'| flagbox hidden',d.querySelector('#flagbox').hidden,'| max',d.querySelector('#maxG').textContent,'| flag answer differs',ca!==ans);
 const cw=['fr','jp'].filter(c=>c!==ca); w.__t.guess(cw[0]);
 console.log('      row:',[...d.querySelectorAll('.crow .tile')].map(t=>t.className.split(' ')[1]+':'+t.textContent.replace(/\s+/g,' ').trim()).join(' | '));
 w.__t.guess(ca); await sleep(1400);
 console.log('      win -> end',on(d,'#endS'),'|',d.querySelector('.endtitle').textContent,'|',d.querySelector('#endBody .tag:nth-of-type(3)')?.textContent||[...d.querySelectorAll('#endBody .tag')].map(t=>t.textContent).join(' // '));
 d.querySelector('#eShare').click(); await sleep(10); console.log('      share:',JSON.stringify(w.__copied));
 d.querySelector('#eHome').click(); console.log('      home country stats:',d.querySelector('#hStatsRow').textContent.replace(/\s+/g,' ').trim());
 d.querySelector('#hPuzzles button[data-p=flag]').click(); console.log('      back to flag tab: card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '));
 // ---- Shape puzzle ---- (outline file is a separate script; the fake browser can't fetch it, so load it here)
 d.querySelector('#hPuzzles button[data-p=shape]').click();
 console.log('WORLD shape tab: card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| btns:',d.querySelector('#hDaily').textContent,'/',d.querySelector('#hUnl').textContent);
 d.querySelector('#hDaily').click(); await sleep(50);
 console.log('      before outlines load:',d.querySelector('#shapebox').textContent,'| script tag added',[...d.querySelectorAll('script')].some(s=>/shapes\.js/.test(s.src)));
 w.eval(fs.readFileSync(path.join(ROOT,'data/shapes.js'),'utf8')); w.__t.draw();
 const sa=w.__t.g().answer; const pth=d.querySelector('#shapebox path');
 console.log('      playing: answer',sa,'area',w.__t.by[sa].area,'| outline chars',pth&&pth.getAttribute('d').length,'| flagbox hidden',d.querySelector('#flagbox').hidden,'| hint:',d.querySelector('#shint').textContent);
 const sw=['fr','jp','br','au','ca'].filter(c=>c!==sa); for(const c of sw.slice(0,3)) w.__t.guess(c);
 console.log('      3 misses -> hint:',d.querySelector('#shint').innerHTML.replace(/<\/?b>/g,''),'| rows',d.querySelectorAll('.grow:not(.empty)').length);
 w.__t.guess(sw[3]); w.__t.guess(sw[4]); console.log('      5 misses -> hint:',d.querySelector('#shint').textContent);
 w.__t.guess(sa); await sleep(800);
 console.log('      win in 6 -> end',on(d,'#endS'),'|',d.querySelector('.endtitle').textContent,'| share:',(d.querySelector('#eShare').click(),await sleep(10),JSON.stringify(w.__copied)));
 const tiny=w.__t.pool().filter(c=>w.__t.by[c].area<1000); console.log('      shape answer pool',w.__t.pool().length,'of',w.__t.all,'| tiny in pool:',tiny.length);
 // ---- Border Hop ----
 d.querySelector('#eHome').click(); d.querySelector('#hPuzzles button[data-p=hop]').click();
 console.log('WORLD hop tab: card:',d.querySelector('#todayCard').textContent.trim().replace(/\s+/g,' '),'| btns:',d.querySelector('#hDaily').textContent,'/',d.querySelector('#hUnl').textContent);
 d.querySelector('#hDaily').click(); await sleep(50);
 let h=w.__t.g(); const nm=c=>w.__t.by[c].name;
 console.log('      daily:',nm(h.start),'->',nm(h.answer),'| fewest',h.min,'| limit',d.querySelector('#maxG').textContent,'| top:',d.querySelector('#hopbox').textContent.replace(/\s+/g,' ').trim());
 const best=w.__t.route(h.start,h.answer); console.log('      a best route:',best.map(nm).join(' > '));
 w.__t.guess('jp'); w.__t.guess(h.start); w.__t.guess(best[0]);
 console.log('      after Japan + start + first stop: rows',[...d.querySelectorAll('.hrow')].map(r=>r.textContent.replace(/\s+/g,' ').trim()).join(' | '),'| count',h.guesses.length);
 for(const c of best.slice(1)) w.__t.guess(c); await sleep(1500);
 console.log('      linked -> won',h.won,'| end',on(d,'#endS'),'|',d.querySelector('.endtitle').textContent,'| route shown:',d.querySelector('#endBody .route').textContent.replace(/\s+/g,' ').trim());
 d.querySelector('#eShare').click(); await sleep(10); console.log('      share:',JSON.stringify(w.__copied));
 d.querySelector('#eHome').click(); console.log('      home hop stats:',d.querySelector('#hStatsRow').textContent.replace(/\s+/g,' ').trim());
 d.querySelector('#hUnl').click(); await sleep(50); h=w.__t.g();
 console.log('      unlimited:',nm(h.start),'->',nm(h.answer),'fewest',h.min,'limit',h.max);
 for(const c of ['jp','gb','au','nz','is','cu','lk','mg','ph','id','tw','sg']) if(!h.done&&c!==h.start&&c!==h.answer) w.__t.guess(c);
 await sleep(1500); console.log('      all islands -> done',h.done,'won',h.won,'| guesses',h.guesses.length,'|',d.querySelector('.endtitle').textContent,'| shown route:',d.querySelector('#endBody .route').textContent.replace(/\s+/g,' ').trim());
 // ---- Border Hop map mode ----
 d.querySelector('#eHome').click();
 console.log('      home mode buttons:',[...d.querySelectorAll('#hHopMode button')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(' / '),'| shown',!d.querySelector('#hHopMode').hidden);
 d.querySelectorAll('#hHopMode button')[2].click(); w.__t.unl(true); await sleep(50); h=w.__t.g();
 console.log('      map on, before file loads:',d.querySelector('#hopmap').textContent,'| script tag',[...d.querySelectorAll('script')].some(s=>/world\.js/.test(s.src)),'| map bar:',[...d.querySelectorAll('#mapSeg button')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(' / '));
 w.eval(fs.readFileSync(path.join(ROOT,'data/world.js'),'utf8')); w.__t.drawMap();
 const lit=()=>[...d.querySelectorAll('#hopmap path[class]')].map(p=>p.getAttribute('class')).filter(c=>c!=='bg');
 console.log('      map drawn:',nm(h.start),'->',nm(h.answer),'| paths',d.querySelectorAll('#hopmap path').length,'| lit',lit().join(','),'| labels',[...d.querySelectorAll('#hopmap text')].map(t=>t.textContent).join(', '));
 const r2=w.__t.route(h.start,h.answer); w.__t.guess(r2[0]); w.__t.guess(h.start==='jp'||h.answer==='jp'?'gb':'jp');
 console.log('      after 1 good + 1 island guess: lit',lit().join(','),'| labels',[...d.querySelectorAll('#hopmap text')].map(t=>t.textContent).join(', '),'| viewBox',d.querySelector('#hopmap svg').getAttribute('viewBox'));
 for(const c of r2.slice(1)) w.__t.guess(c); await sleep(1500);
 d.querySelector('#eShare').click(); await sleep(10); console.log('      won',h.won,'| share:',JSON.stringify(w.__copied));
 d.querySelector('#eBoard').click(); d.querySelector('#mapSeg button[data-v=classic]').click(); console.log('      "No map" button -> map hidden',d.querySelector('#hopmap').hidden);
 // ---- no-borders map ----
 d.querySelector('#eHome').click(); d.querySelectorAll('#hHopMode button')[1].click(); w.__t.unl(true); await sleep(50); h=w.__t.g();
 console.log('      no-borders: home buttons',[...d.querySelectorAll('#hHopMode button')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')).join(' / '),'| map shown',!d.querySelector('#hopmap').hidden,'| borders hidden',d.querySelector('#hopmap').classList.contains('nob'),'| lit',lit().join(','));
 const r3=w.__t.route(h.start,h.answer); for(const c of r3) w.__t.guess(c); await sleep(1500);
 d.querySelector('#eShare').click(); await sleep(10); console.log('      won',h.won,'| borders back after end',!d.querySelector('#hopmap').classList.contains('nob'),'| share:',JSON.stringify(w.__copied));
 // many random pairs: always 3-5 in between, and a route exists
 const r=w.__t.mb(42); let bad=0,mins={}; for(let i=0;i<300;i++){const p=w.__t.pair(r);const rt=w.__t.route(p.start,p.answer);if(!rt||rt.length!==p.min||p.min<3||p.min>5)bad++;mins[p.min]=(mins[p.min]||0)+1;}
 console.log('      300 random pairs: bad',bad,'| fewest-in-between counts',JSON.stringify(mins));
}
(async()=>{await reel();await tune();await geo();await geoNoDb();await world();process.exit(0)})().catch(e=>{console.error('ERR',e);process.exit(1)});

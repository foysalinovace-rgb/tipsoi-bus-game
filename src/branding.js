// Tipsoi artwork and distance-spaced, pooled roadside advertising.
const TIPSOI_ASSETS=[];
function startOnMymensinghHighway(){
  const road=RD.find(r=>r.id==='N3'&&r.name==='Dhaka–Mymensingh Highway');
  // Start beyond the Dhaka junction, in the left lane heading towards Mymensingh.
  const p=roadPoint(road,Math.min(180,road.len/2));
  teleport(p.x,p.z,[p.x+p.tx*100,p.z+p.tz*100]);
  st.speed=0;st.road=road;st.onRoad=true;updateHUD();
}
let TIPSOI_QUALITY='high';
try{TIPSOI_QUALITY=localStorage.getItem('tipsoi.graphics')||'high'}catch(_){}
if(!['high','balanced'].includes(TIPSOI_QUALITY))TIPSOI_QUALITY='high';
async function loadTipsoiAssets(){await Promise.all(['fastface-8.png','fastface-5-pro.png','fastface-go.png'].map((f,i)=>new Promise(resolve=>{const im=new Image();im.onload=()=>{TIPSOI_ASSETS[i]=im;resolve()};im.onerror=resolve;im.src='assets/'+f;})));}
function applyTipsoiQuality(value=TIPSOI_QUALITY){
  TIPSOI_QUALITY=value;const high=value==='high';
  if(renderer){renderer.setPixelRatio(Math.min(window.devicePixelRatio,high?2:1.25));renderer.setSize(innerWidth,innerHeight,false);renderer.shadowMap.enabled=high;renderer.shadowMap.needsUpdate=true;}
  const select=document.getElementById('graphicsQuality');if(select)select.value=value;
  const label=document.getElementById('qualityLbl');if(label)label.textContent=high?'Graphics · High':'Graphics · Balanced';
  document.documentElement.dataset.graphics=value;try{localStorage.setItem('tipsoi.graphics',value)}catch(_){}
}
const TIPSOI_BOARDS={locations:[],pool:[],timer:0};
function buildTipsoiBoards(){
  const labels=['FastFace 8','FastFace 5 Pro FP','FastFace Go Lite'],subtitles=['AI FACE RECOGNITION','FACE + FINGERPRINT','PORTABLE ATTENDANCE'];
  const mats=labels.map((name,i)=>{
    const c=document.createElement('canvas');c.width=2048;c.height=1024;const g=c.getContext('2d');
    const grad=g.createLinearGradient(0,0,2048,1024);grad.addColorStop(0,'#101323');grad.addColorStop(1,'#242445');g.fillStyle=grad;g.fillRect(0,0,2048,1024);
    g.fillStyle='#b5a0ff';g.fillRect(0,0,28,1024);g.fillStyle='#d6caff';g.font='800 176px sans-serif';g.fillText('tipsoi',100,225);
    g.fillStyle='#fff';g.font='700 88px sans-serif';g.fillText(name,100,425);g.fillStyle='#bcb9d8';g.font='500 36px sans-serif';g.fillText(subtitles[i],105,510);
    g.fillStyle='#b5a0ff';g.fillRect(105,580,80,5);g.fillStyle='#ebe7ff';g.font='40px sans-serif';g.fillText('Smart attendance. Every day.',105,680);g.font='700 48px sans-serif';g.fillText('tipsoi.pro',105,900);
    if(TIPSOI_ASSETS[i]){g.fillStyle='#fff';g.fillRect(1240,76,730,872);g.drawImage(TIPSOI_ASSETS[i],1240,120,730,730);}
    const texture=new THREE.CanvasTexture(c);texture.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());return new THREE.MeshBasicMaterial({map:texture});
  });
  for(const [ri,r] of RD.entries()){
    if(r.narrow)continue;let j=1,slot=0;
    for(let d=90;d<r.len-50;d+=240){
      while(j<r.N-1&&r.cum[j]<d)j++;
      const t=(d-r.cum[j-1])/Math.max(.001,r.cum[j]-r.cum[j-1]);
      const x=r.xs[j-1]+(r.xs[j]-r.xs[j-1])*t,z=r.zs[j-1]+(r.zs[j]-r.zs[j-1])*t;
      const side=slot%2?1:-1,bx=x+r.tz[j]*side*(r.hw+12),bz=z-r.tx[j]*side*(r.hw+12);
      if(!isWater(bx,bz))TIPSOI_BOARDS.locations.push({x:bx,z:bz,y:heightAt(bx,bz),yaw:Math.atan2(r.tx[j],r.tz[j])+.14*side,ad:(ri+slot)%3});slot++;
    }
  }
  const steel=new THREE.MeshLambertMaterial({color:'#4c5260'}),back=new THREE.MeshLambertMaterial({color:'#202332'});
  const panelG=new THREE.PlaneGeometry(15,7.5),frameG=new THREE.BoxGeometry(15.4,7.9,.35),poleG=new THREE.CylinderGeometry(.17,.24,8,8);
  for(let k=0;k<28;k++){
    const group=new THREE.Group(),frame=new THREE.Mesh(frameG,back);frame.position.y=10;frame.castShadow=true;group.add(frame);
    const faceA=new THREE.Mesh(panelG,mats[0]);faceA.position.set(0,10,.19);group.add(faceA);
    const faceB=new THREE.Mesh(panelG,mats[0]);faceB.position.set(0,10,-.19);faceB.rotation.y=Math.PI;group.add(faceB);
    for(const x of [-5.4,5.4]){const pole=new THREE.Mesh(poleG,steel);pole.position.set(x,4,0);pole.castShadow=true;group.add(pole)}
    group.visible=false;scene.add(group);TIPSOI_BOARDS.pool.push({group,faceA,faceB});
  }
  TIPSOI_BOARDS.mats=mats;document.getElementById('gl').dataset.billboardLocations=TIPSOI_BOARDS.locations.length;
}
function updateTipsoiBoards(dt){
  TIPSOI_BOARDS.timer-=dt;if(TIPSOI_BOARDS.timer>0||!TIPSOI_BOARDS.pool.length)return;TIPSOI_BOARDS.timer=.65;
  const nearby=TIPSOI_BOARDS.locations.map(p=>({p,d:(p.x-st.x)**2+(p.z-st.z)**2})).filter(v=>v.d<1900**2).sort((a,b)=>a.d-b.d).slice(0,TIPSOI_BOARDS.pool.length);
  TIPSOI_BOARDS.pool.forEach((item,i)=>{const p=nearby[i]?.p;item.group.visible=!!p;if(!p)return;item.group.position.set(p.x,p.y,p.z);item.group.rotation.y=p.yaw;item.faceA.material=item.faceB.material=TIPSOI_BOARDS.mats[p.ad]});
  document.getElementById('gl').dataset.billboardsVisible=nearby.length;
  document.getElementById('gl').dataset.nearestBillboard=Math.round(Math.sqrt(nearby[0]?.d||0));
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('graphicsQuality').value=TIPSOI_QUALITY;
  document.getElementById('graphicsQuality').addEventListener('change',e=>applyTipsoiQuality(e.target.value));
  document.getElementById('bQuality').addEventListener('click',()=>applyTipsoiQuality(TIPSOI_QUALITY==='high'?'balanced':'high'));
  const toggle=document.getElementById('gameMenuToggle');
  const menu=document.createElement('dialog');menu.id='gameMenu';menu.setAttribute('aria-labelledby','gameMenuTitle');
  menu.innerHTML='<header class="game-menu-head"><h2 id="gameMenuTitle">গেম মেনু</h2><button type="button" id="gameMenuClose" aria-label="Close game menu">✕</button></header>';
  const options=document.getElementById('ctrls'),keys=document.getElementById('keys');
  menu.append(options,keys);document.body.append(menu);
  let wasPaused=true;
  function closeMenu(){if(!menu.open)return;menu.close();toggle.setAttribute('aria-expanded','false');paused=wasPaused;last=performance.now();toggle.focus();}
  toggle.addEventListener('click',()=>{wasPaused=paused;paused=true;Object.keys(input).forEach(k=>input[k]=0);menu.showModal();toggle.setAttribute('aria-expanded','true');});
  document.getElementById('gameMenuClose').addEventListener('click',closeMenu);
  menu.addEventListener('cancel',e=>{e.preventDefault();closeMenu()});
  menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeMenu();}});
  options.addEventListener('click',e=>{if(e.target.closest('#bMap,#bHelp,#bProducts'))closeMenu();},true);
  // Keep menu keyboard navigation from reaching the driving shortcuts.
  addEventListener('keydown',e=>{if(!menu.open)return;e.stopImmediatePropagation();if(e.code==='Escape'){e.preventDefault();closeMenu();}},true);
});

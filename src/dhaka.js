// Dhaka-only adaptation of Baper Rasta's avenue/street district layout.
// Neighborhood ordering: https://baperrasta.com/ (2026-11-02).
// Scenery is rebuilt for this game's Three r128 world; no vehicles are imported.
const DHAKA_LAYOUT=__DHAKA_LAYOUT__;
const DHAKA={cx:0,cz:0,x0:-265,x1:335,z0:-485,z1:535,cols:[-3,-2,-1,0,1,2,3,4],rows:[],roads:[],group:null,buildings:0,entrances:[],metro:0,originalRoads:0,adSites:[],gates:[],exitGrid:new Map(),treeSites:[]};
const ROAD_ENTRANCES={grid:new Map()};
function dhakaContains(x,z,margin=0){return x-DHAKA.cx>DHAKA.x0-margin&&x-DHAKA.cx<DHAKA.x1+margin&&z-DHAKA.cz>DHAKA.z0-margin&&z-DHAKA.cz<DHAKA.z1+margin;}
function dhakaHeight(x,z){return Math.max(0,heightAt(x,z))+.34;}
function dhakaDistrict(col,row){if(col===0)return DHAKA_LAYOUT.central[row+9]||['ঢাকা','dense'];const list=DHAKA_LAYOUT.blocks[row],i=[-3,-2,-1,1,2,3,4].indexOf(col);return list&&list[i]||['ঢাকা','dense'];}
function installDhakaRoads(){
  const city=cityByName('Dhaka');DHAKA.cx=city.x;DHAKA.cz=city.z;DHAKA.originalRoads=RD.length;
  for(let row=-6;row<=12;row++)DHAKA.rows.push(row);
  const add=(name,pts,width,axis,index)=>{
    const xs=[],zs=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/STEP);for(let j=i===1?0:1;j<=steps;j++){const t=j/steps;xs.push(DHAKA.cx+a[0]+(b[0]-a[0])*t);zs.push(DHAKA.cz+a[1]+(b[1]-a[1])*t);}}
    const N=xs.length,cum=new Float32Array(N),tx=new Float32Array(N),tz=new Float32Array(N);for(let i=0;i<N;i++){if(i)cum[i]=cum[i-1]+Math.hypot(xs[i]-xs[i-1],zs[i]-zs[i-1]);const a=Math.max(0,i-1),b=Math.min(N-1,i+1),L=Math.hypot(xs[b]-xs[a],zs[b]-zs[a]);tx[i]=(xs[b]-xs[a])/L;tz[i]=(zs[b]-zs[a])/L;}
    const r={id:'D',name,narrow:false,dhaka:true,axis,index,w:width,hw:width/2,shw:width/2+3.8,xs:Float32Array.from(xs),zs:Float32Array.from(zs),cum,tx,tz,ys:new Float32Array(N),br:new Float32Array(N),N,len:cum[N-1],next:[null,null]};RD.push(r);DHAKA.roads.push(r);
  };
  for(const c of DHAKA.cols)add(c===0?'Dhaka Metro Avenue · মেট্রোরেল এভিনিউ':`Dhaka Avenue ${c+4}` ,[[c*70,-465],[c*70,515]],c===0?22.4:14,'avenue',c);
  for(const row of DHAKA.rows)add(dhakaDistrict(0,row)[0]+' সড়ক',[[-245,180-row*52],[315,180-row*52]],14,'street',row);
  add('Dhaka City Ring · ঢাকা নগর সরণি',[[-245,-465],[315,-465],[315,515],[-245,515],[-245,-465]],24,'ring',0);
  // Gateways join the retained national roads at their actual projected position.
  for(const [x,z] of [[0,-465],[0,515],[-245,24],[315,336]]){
    let best=null;for(let ri=0;ri<DHAKA.originalRoads;ri++){const r=RD[ri];if(r.narrow)continue;for(let i=1;i<r.N;i++){const a={x:r.xs[i-1]-DHAKA.cx,z:r.zs[i-1]-DHAKA.cz},b={x:r.xs[i]-DHAKA.cx,z:r.zs[i]-DHAKA.cz},p=ruralSegmentDistance(x,z,a,b);if(!best||p.d<best.d)best={d:p.d,x:a.x+(b.x-a.x)*p.t,z:a.z+(b.z-a.z)*p.t};}}
    if(best&&best.d>2&&dhakaContains(DHAKA.cx+best.x,DHAKA.cz+best.z))add('Dhaka Highway Link · নগর সংযোগ',[[x,z],[best.x,best.z]],28,'link',0);
  }
  for(let ri=0;ri<DHAKA.originalRoads;ri++){const r=RD[ri];if(r.narrow)continue;for(let i=1;i<r.N;i++)if(dhakaContains(r.xs[i-1],r.zs[i-1])!==dhakaContains(r.xs[i],r.zs[i]))DHAKA.gates.push({ri,s:(r.cum[i-1]+r.cum[i])/2,x:(r.xs[i-1]+r.xs[i])/2,z:(r.zs[i-1]+r.zs[i])/2});}
  buildRoadEntranceClearances();
}
function roadClearanceIndex(grid,item,padding=16){const x0=Math.min(item.a.x,item.b.x)-item.hw-padding,x1=Math.max(item.a.x,item.b.x)+item.hw+padding,z0=Math.min(item.a.z,item.b.z)-item.hw-padding,z1=Math.max(item.a.z,item.b.z)+item.hw+padding;for(let x=Math.floor(x0/64);x<=Math.floor(x1/64);x++)for(let z=Math.floor(z0/64);z<=Math.floor(z1/64);z++){const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);}}
function buildRoadEntranceClearances(){
  ROAD_ENTRANCES.grid.clear();const put=(a,b,hw)=>roadClearanceIndex(ROAD_ENTRANCES.grid,{a,b,hw});
  for(const r of RD)for(const end of [0,1])for(let i=1;i<r.N;i++){const s=end?r.N-i:i;if((end?r.len-r.cum[s]:r.cum[s-1])>50)break;put({x:r.xs[s-1],z:r.zs[s-1]},{x:r.xs[s],z:r.zs[s]},r.hw+7);}
  for(const j of JUNCTIONS){const p={x:j.x,z:j.z};put(p,p,Math.max(RD[j.main].hw,RD[j.side].hw)+12);}
  for(const col of DHAKA.cols)for(const row of DHAKA.rows){const p={x:DHAKA.cx+col*70,z:DHAKA.cz+180-row*52};put(p,p,(col===0?11.2:7)+9);}
  for(const g of DHAKA.gates){const p={x:g.x,z:g.z};put(p,p,25);}
}
function roadEntranceClearance(x,z,padding=0){const items=ROAD_ENTRANCES.grid.get(Math.floor(x/64)+','+Math.floor(z/64))||[];return items.some(s=>ruralSegmentDistance(x,z,s.a,s.b).d<s.hw+padding);}
function dhakaTreeAllowed(x,z,crown=2){if(roadEntranceClearance(x,z,crown))return false;const n=nearestRoad(x,z,1);return n.d>n.hw+crown+2&&!dhakaExitAt(x,z,crown+2);}
function dhakaExitWidth(r,i){let width=r.w;if(r.wet&&r.wet[i]||r.br&&r.br[i]>.05)return width;for(const g of DHAKA.gates)if(RD[g.ri]===r){const t=Math.max(0,Math.min(1,(160-Math.abs(r.cum[i]-g.s))/110));width=Math.max(width,r.w+(28-r.w)*t*t*(3-2*t));}return width;}
function dhakaExitAt(x,z,padding=0){const items=DHAKA.exitGrid.get(Math.floor(x/64)+','+Math.floor(z/64))||[];let best=null;for(const s of items){const p=ruralSegmentDistance(x,z,s.a,s.b),hw=s.aw+(s.bw-s.aw)*p.t;if(p.d<hw+padding&&(!best||p.d<best.d))best={d:p.d,y:s.a.y+(s.b.y-s.a.y)*p.t,road:s.road};}return best;}
function buildDhakaExitLanes(hard,white){
  const strips=[];DHAKA.exitGrid.clear();let count=0;
  for(const ri of new Set(DHAKA.gates.map(g=>g.ri))){const r=RD[ri];for(let i=1;i<r.N;i++){const aw=dhakaExitWidth(r,i-1),bw=dhakaExitWidth(r,i);if(aw<=r.w+.01&&bw<=r.w+.01)continue;
    const a={x:r.xs[i-1],z:r.zs[i-1],y:r.ys[i-1]+.055},b={x:r.xs[i],z:r.zs[i],y:r.ys[i]+.055},L=Math.hypot(b.x-a.x,b.z-a.z),s={a,b,aw:aw/2,bw:bw/2,hw:Math.max(aw,bw)/2,road:r};roadClearanceIndex(DHAKA.exitGrid,s);const part=ribbon([a.x,b.x],[a.z,b.z],k=>k?bw:aw,k=>k?b.y:a.y,true,[r.cum[i-1],r.cum[i]]);for(let k=0;k<part.uv.length;k+=2){part.uv[k]*=Math.max(aw,bw)/7;part.uv[k+1]*=3;}strips.push(part);count++;
    const x=(a.x+b.x)/2,z=(a.z+b.z)/2,y=(a.y+b.y)/2,yaw=Math.atan2(b.x-a.x,b.z-a.z),tx=(b.x-a.x)/L,tz=(b.z-a.z)/L;hard.box(.17,.018,L,x,y+.025,z,'#e2ba38',0,yaw);if((aw+bw)/2>21&&i%2===0)for(const side of [-1,1])white.box(.14,.018,Math.min(4,L),x+tz*side*6.8,y+.025,z-tx*side*6.8,'#ecece1',0,yaw);
    for(const side of [-1,1]){const edge=(p,w)=>[p.x+tz*side*w/2,p.y-.015,p.z-tx*side*w/2],ea=edge(a,aw),eb=edge(b,bw);if(dhakaContains(ea[0],ea[2])&&dhakaContains(eb[0],eb[2]))continue;const toe=e=>{const d=2+Math.max(0,e[1]-heightAt(e[0],e[2]))*2,xx=e[0]+tz*side*d,zz=e[2]-tx*side*d;return [xx,Math.max(-.2,heightAt(xx,zz))+.025,zz];},ta=toe(ea),tb=toe(eb);if(side>0)hard.quad(ea,eb,tb,ta,'#a99c78');else hard.quad(eb,ea,ta,tb,'#a99c78');}
  }}
  if(strips.length){const mesh=new THREE.Mesh(combine(strips),new THREE.MeshLambertMaterial({map:dhakaAsphalt(),polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-6}));mesh.receiveShadow=true;DHAKA.group.add(mesh);ENV.roadMats.push(mesh.material);}document.getElementById('gl').dataset.dhakaExitGates=DHAKA.gates.length;document.getElementById('gl').dataset.dhakaExitSegments=count;
}
function buildDhakaBillboards(materials){
  const group=new THREE.Group(),frameG=new THREE.BoxGeometry(8.7,4.6,.22),panelG=new THREE.PlaneGeometry(8.4,4.25),steel=new THREE.MeshLambertMaterial({color:'#343a4a'});
  for(let i=0;i<DHAKA.adSites.length;i++){const p=DHAKA.adSites[i],mount=new THREE.Group(),frame=new THREE.Mesh(frameG,steel),face=new THREE.Mesh(panelG,materials[i%materials.length]);frame.castShadow=true;face.position.z=.13;mount.add(frame,face);for(const x of [-3.4,3.4]){const bracket=new THREE.Mesh(new THREE.BoxGeometry(.14,1.3,.5),steel);bracket.position.set(x,-2.6,-.05);mount.add(bracket);}mount.position.set(p.x,p.y,p.z);mount.rotation.y=p.yaw;group.add(mount);}
  scene.add(group);document.getElementById('gl').dataset.dhakaBillboards=DHAKA.adSites.length;
}
function prepareDhakaHeights(){
  for(const r of RD)for(let i=0;i<r.N;i++){const x=r.xs[i],z=r.zs[i];if(!dhakaContains(x,z)||r.wet[i])continue;const d=Math.min(x-DHAKA.cx-DHAKA.x0,DHAKA.cx+DHAKA.x1-x,z-DHAKA.cz-DHAKA.z0,DHAKA.cz+DHAKA.z1-z),blend=Math.min(1,d/20);r.ys[i]=r.ys[i]*(1-blend)+dhakaHeight(x,z)*blend;r.emb[i]*=1-blend;r.br[i]*=1-blend;}
}
function pruneDhakaSites(){for(let i=SITES.length-1;i>=0;i--)if(dhakaContains(SITES[i].x,SITES[i].z,25))SITES.splice(i,1);for(const r of RD)r.sites=r.sites.filter(o=>SITES.includes(o));}
function pruneDhakaRoundabouts(){for(let i=ROUNDABOUTS.length-1;i>=0;i--)if(dhakaContains(ROUNDABOUTS[i].x,ROUNDABOUTS[i].z,25))ROUNDABOUTS.splice(i,1);for(const j of JUNCTIONS)if(j.ra&&!ROUNDABOUTS.includes(j.ra))delete j.ra;}
function dhakaNearest(x,z){let best=null;for(const r of DHAKA.roads)for(let i=1;i<r.N;i++){const a={x:r.xs[i-1],z:r.zs[i-1]},b={x:r.xs[i],z:r.zs[i]},p=ruralSegmentDistance(x,z,a,b);if(!best||p.d<best.d)best={d:p.d,x:a.x+(b.x-a.x)*p.t,z:a.z+(b.z-a.z)*p.t,tx:r.tx[i],tz:r.tz[i],y:r.ys[i],road:r};}return best;}
function dhakaNameAt(x,z){const col=DHAKA.cols.reduce((a,b)=>Math.abs(x-DHAKA.cx-a*70)<Math.abs(x-DHAKA.cx-b*70)?a:b),row=Math.max(-6,Math.min(12,Math.round((180-(z-DHAKA.cz))/52)));return dhakaDistrict(col,row)[0];}
function dhakaJump(col,row){const x=DHAKA.cx+col*70,z=DHAKA.cz+180-row*52;teleport(x,z,[x,z-100]);closeMap();toast(dhakaDistrict(col,row)[0]+' · ঢাকা');}
function addDhakaJumpButtons(){const host=document.createElement('div');host.innerHTML='<h3>DHAKA CITY / ঢাকা নগর</h3>';for(const [c,r,label] of [[0,0,'Shahbag · শাহবাগ'],[-1,-3,'Gulistan · গুলিস্তান'],[0,7,'Mirpur 10 · মিরপুর ১০'],[0,12,'Uttara · উত্তরা'],[0,-6,'Jatrabari · যাত্রাবাড়ী']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>dhakaJump(c,r);host.append(b);}document.getElementById('jump').prepend(host);}
function dhakaMap(ctx,k){ctx.save();ctx.fillStyle='#b9b4a3';ctx.fillRect(DHAKA.cx+DHAKA.x0,DHAKA.cz+DHAKA.z0,DHAKA.x1-DHAKA.x0,DHAKA.z1-DHAKA.z0);for(const r of DHAKA.roads)strokeLine(ctx,Array.from(r.xs,(x,i)=>[x,r.zs[i]]),Math.max(r.w,Math.min(k,16)),r.axis==='avenue'&&r.index===0?'#bc689b':'#e9e2d4');ctx.restore();}
function dhakaBrickMaterial(){const t=sceneryTexture((g,s)=>{g.fillStyle='#b76043';g.fillRect(0,0,s,s);for(let row=0;row<32;row++)for(let c=-1;c<9;c++){const x=c*34+(row%2?17:0);g.strokeStyle='#bcb29c';g.lineWidth=1;g.strokeRect(x,row*8,34,8);}detailNoise(g,s,123,2600);g.fillStyle='#e5ddcb';g.fillRect(48,45,160,166);g.fillStyle='#43545a';g.fillRect(57,54,142,147);g.strokeStyle='#e0d7c3';g.lineWidth=6;g.strokeRect(57,54,142,147);g.beginPath();g.moveTo(128,54);g.lineTo(128,201);g.moveTo(57,126);g.lineTo(199,126);g.stroke();});const m=new THREE.MeshLambertMaterial({map:t});m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_INSTANCING
vec3 bs=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));vUv=uv*vec2(abs(normal.x)>.5?bs.z:bs.x,bs.y)/3.3;
#endif`);};m.customProgramCacheKey=()=> 'dhaka-brick-v1';return m;}
function buildDhakaCity(){
  const group=new THREE.Group();DHAKA.group=group;scene.add(group);const hard=new GB(),dark=new GB(),yellow=new GB(),white=new GB(),metal=new GB(),trees=new GB();const lanes=[],walks=[],buildingData=[],shopData=[],signs=[],curbs=[];
  const Y=new THREE.Vector3(0,1,0),m=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),scale=new THREE.Vector3();
  const plane=(list,x,z,w,d,y)=>list.push({x,z,w,d,y});
  buildDhakaExitLanes(hard,white);
  planMetroEntrances();
  const streetCross=(r,x,z,extra=0)=>DHAKA.roads.some(o=>o!==r&&((r.axis==='avenue'&&o.axis==='street'&&Math.abs(z-o.zs[0])<o.hw+extra)||(r.axis==='street'&&o.axis==='avenue'&&Math.abs(x-o.xs[0])<o.hw+extra)));
  // Road surfaces share the engine's height field, traction and map routing.
  for(const r of DHAKA.roads){const strip=ribbon(r.xs,r.zs,()=>r.w,i=>r.ys[i]+.025,true,r.cum);for(let i=0;i<strip.uv.length;i+=2){strip.uv[i]*=r.w/7;strip.uv[i+1]*=3;}lanes.push(strip);if(r.axis!=='avenue'&&r.axis!=='street')continue;
    for(let s=0;s<r.N-1;s++){const x=(r.xs[s]+r.xs[s+1])/2,z=(r.zs[s]+r.zs[s+1])/2,y=(r.ys[s]+r.ys[s+1])/2,along=r.cum[s],L=r.cum[s+1]-along,tx=r.tx[s],tz=r.tz[s],yaw=Math.atan2(tx,tz);if(streetCross(r,x,z,4))continue;
      for(const side of [-1,1]){const wx=x+tz*side*(r.hw+2),wz=z-tx*side*(r.hw+2);if(dhakaExitAt(wx,wz,L/2+2))continue;walks.push({x:wx,z:wz,w:4,d:L+.1,y:y+.13,yaw,side});
        for(let k=0;k<L;k+=1.8){const px=r.xs[s]+tx*k+tz*side*(r.hw+.16),pz=r.zs[s]+tz*k-tx*side*(r.hw+.16);curbs.push({x:px,z:pz,y:y+.12,len:Math.min(1.8,L-k),yaw,yellow:Math.floor((along+k)/1.8)%2});}
      }
      if(r.axis==='avenue'&&r.index===0&&!dhakaExitAt(x,z,2)){hard.box(2.8,.16,L,x,y+.08,z,'#c8c6b5');for(const sd of [-1,1])(Math.floor(along/4)%2?yellow:dark).box(.18,.24,L,x+sd*1.4,y+.12,z,Math.floor(along/4)%2?'#ebc739':'#292d27');if(s%3===0&&!roadEntranceClearance(x,z,1))trees.ball(.48,x,y+.35,z,'#66834b',.65,1.3);}
      for(const off of r.w>20?[-7.4,-3.7,3.7,7.4]:[-3.5,3.5])if(Math.floor(along/6)%2===0)white.box(.1,.018,Math.min(3,L),x+tz*off,y+.05,z-tx*off,'#deded4',0,yaw);
    }
  }
  // Street-facing blocks, clear door approaches and ground-floor shop fronts.
  for(const col of DHAKA.cols)for(const row of DHAKA.rows)for(const side of [-1,1]){
    const r=DHAKA.roads.find(r=>r.axis==='avenue'&&r.index===col),[name,look]=dhakaDistrict(col,row),z=DHAKA.cz+180-row*52+25.8,x=DHAKA.cx+col*70+side*(r.hw+11.3),w=11.5,d=18;
    const n=nearestRoad(x,z,2);if(n.d<n.hw+10||dhakaExitAt(x,z,11)||isWater(x,z)||!dhakaContains(x,z, -8))continue;
    if(col===0&&buildDhakaLandmark(row,side,x,z,hard,dark,trees,signs)){DHAKA.entrances.push({x:DHAKA.cx+side*(r.hw+2.3),z,along:'z'});continue;}
    const campus=look==='campus'&&hash2(col,row)>.35;if(campus){const yy=dhakaHeight(x,z);hard.box(17,.16,22,x,yy-.05,z,'#84936b');for(let k=0;k<3;k++){const zz=z-7+k*7;if(!dhakaTreeAllowed(x,zz,2.5))continue;trees.cyl(.13,3,x,yy+1.5,zz,'#766246',7);trees.ball(2,x,yy+4,zz,'#4a7649',1.2,.9);}for(let k=0;k<10;k++)metal.box(.07,1.1,.07,x-side*8.5,yy+.65,z-10+k*2.2,'#28463c');metal.box(.08,.08,22,x-side*8.5,yy+1.1,z,'#28463c');continue;}
    const seed=col*81+row,lookH=look==='office'||look==='posh'?27:look==='old'?9:17,h=lookH+hash2(seed,21)*12,y=dhakaHeight(x,z),yaw=side>0?-Math.PI/2:Math.PI/2;
    buildingData.push({x,z,y,h,w,d,yaw,brick:look==='old'||look==='campus'||hash2(seed,7)<.35,seed});DHAKA.buildings++;
    if(col%2===0&&row%3===0&&h>13)DHAKA.adSites.push({x:x-side*(d/2+.3),y:y+8.4,z,yaw});
    if(col===0&&row%3===1&&h>13)DHAKA.adSites.push({x,y:y+8.4,z:z+w/2+.3,yaw:0});
    addStaticBox(x,z,d/2,w/2,0,'wall');const door={x:DHAKA.cx+col*70+side*(r.hw+2.3),z,along:'z'};DHAKA.entrances.push(door);
    plane(walks,x,z,18,22,y-.025);shopData.push({x:x-side*(d/2+.025),z,y:y+1.7,yaw,seed,name});
    hard.box(d+.35,.25,w+.35,x,y+h+.2,z,'#b8b2a4');hard.box(d,.55,.2,x,y+h+.55,z-w/2,'#d3cbbb');hard.box(d,.55,.2,x,y+h+.55,z+w/2,'#d3cbbb');
    if(h>22){hard.cyl(1.05,1.7,x+2,y+h+1.1,z+2,'#525c5c',10);hard.box(1.3,.8,.55,x-side*(d/2+.25),y+5.4,z+3,'#c7c6bc');}
    dark.box(.14,2.45,1.5,x-side*(d/2+.07),y+1.25,z,'#253b38');
  }
  for(const c of curbs)if(!dhakaEntranceAt(c.x,c.z)&&!dhakaExitAt(c.x,c.z,1))(c.yellow?yellow:dark).box(.28,.27,c.len,c.x,c.y,c.z,c.yellow?'#f4ca37':'#242928',0,c.yaw);
  const surfaceMaterial=new THREE.MeshLambertMaterial({map:dhakaAsphalt(),polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-5});const roadMesh=new THREE.Mesh(combine(lanes),surfaceMaterial);roadMesh.receiveShadow=true;group.add(roadMesh);ENV.roadMats.push(surfaceMaterial);
  const footTex=sceneryTexture((g,s)=>{g.fillStyle='#9d8d76';g.fillRect(0,0,s,s);for(let j=0;j<16;j++)for(let i=-1;i<8;i++){g.fillStyle=(i+j)%3?'#ab7560':'#aaa18a';g.fillRect(i*36+(j%2?18:0)+1,j*16+1,34,14);}detailNoise(g,s,83,1800);});
  const footMat=new THREE.MeshLambertMaterial({map:footTex});footMat.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_INSTANCING
vUv=(instanceMatrix*vec4(position,1.0)).xz/4.0;
#endif`);};footMat.customProgramCacheKey=()=> 'dhaka-paving-world-v1';
  const foot=dhakaInstances(new THREE.BoxGeometry(1,1,1),footMat,walks.length,group);walks.forEach((p,i)=>{q.setFromAxisAngle(Y,p.yaw||0);m.compose(v.set(p.x,p.y-.11,p.z),q,scale.set(p.w,.22,p.d));foot.setMatrixAt(i,m);});foot.receiveShadow=true;
  const facadeMats=tipsoiBuildingMaterial(),brick=dhakaBrickMaterial();for(const isBrick of [false,true]){const data=buildingData.filter(p=>p.brick===isBrick),g=new THREE.BoxGeometry(1,1,1);if(!isBrick)g.groups.forEach(a=>a.materialIndex=a.materialIndex===2||a.materialIndex===3?1:0);const im=dhakaInstances(g,isBrick?brick:facadeMats,data.length,group);data.forEach((b,i)=>{q.setFromAxisAngle(Y,b.yaw);m.compose(v.set(b.x,b.y+b.h/2,b.z),q,scale.set(b.w,b.h,b.d));im.setMatrixAt(i,m);im.setColorAt(i,new THREE.Color(b.brick?'#ffffff':['#e1d2bd','#b9c8c5','#d0c5b2'][Math.abs(b.seed)%3]));});im.castShadow=im.receiveShadow=true;}
  buildDhakaShops(shopData,group);buildDhakaMetro(hard,dark,metal,signs);buildDhakaStreetDetails(hard,metal,white,trees,signs);
  for(const g of [hard,dark,yellow,white,metal,trees]){const mesh=new THREE.Mesh(g.geometry(),new THREE.MeshLambertMaterial({vertexColors:true}));mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
  for(const s of signs)dhakaSign(s.text,s.x,s.y,s.z,s.yaw,s.w,s.h,group);
  buildFootpathMarkets(walks);
  const cv=document.getElementById('gl');cv.dataset.dhakaRoads=DHAKA.roads.length;cv.dataset.dhakaBuildings=DHAKA.buildings;cv.dataset.dhakaDistricts=DHAKA.rows.length*DHAKA.cols.length;cv.dataset.dhakaMetroPiers=DHAKA.metro;
}
function dhakaEntranceAt(x,z){return DHAKA.entrances.some(p=>Math.abs(p.x-x)<4&&Math.abs(p.z-z)<2.2);}
function buildDhakaLandmark(row,side,x,z,hard,dark,trees,signs){
  const key=row+','+side,name=({'0,-1':'বাংলাদেশ জাতীয় জাদুঘর','-1,-1':'কেন্দ্রীয় শহীদ মিনার','-1,1':'কার্জন হল','3,-1':'জাতীয় সংসদ ভবন','-3,-1':'শাপলা চত্বর'})[key];if(!name)return false;
  const y=dhakaHeight(x,z),front=x-side*9.2,yaw=side>0?-Math.PI/2:Math.PI/2;
  hard.box(18,.22,22,x,y+.02,z,'#c5bea9');
  if(key==='-1,-1'){
    hard.box(13,.38,13,x,y+.3,z,'#e3d9c7');dark.ball(2.2,x+1,y+4.3,z,'#b52f36',1,.12);
    for(let k=-2;k<=2;k++){const zz=z+k*2,h=6.2-Math.abs(k)*1.2;for(const d of [-.5,.5])hard.box(.3,h,.26,x,y+.55+h/2,zz+d,'#f2eee1');hard.box(.3,.3,1.3,x,y+.55+h,zz,'#f2eee1');}
  }else if(key==='-3,-1'){
    hard.cyl(4,.5,x,y+.3,z,'#b6aa8a',24);hard.cyl(.7,3,x,y+1.9,z,'#d4d9bc',12);for(let k=0;k<7;k++){const a=k*Math.PI*2/7;hard.ball(1.1,x+Math.cos(a)*1.5,y+3.8,z+Math.sin(a)*1.5,'#eae6c9',.45,.8);}hard.ball(.8,x,y+4,z,'#ead694',.6);
  }else{
    const curzon=key==='-1,1',parliament=key==='3,-1',h=parliament?12:curzon?10:11;
    if(parliament){hard.cyl(7.3,h,x,y+h/2,z,'#c3bfae',8);for(const zz of [-3.6,0,3.6])dark.ball(1.25,front+side*1.8,y+6,z+zz,'#3e4745',1,.12);hard.box(6,3,7,x,y+h+1,z,'#d0c9b6');}
    else{hard.box(15,h,18,x,y+h/2,z,curzon?'#ad5138':'#c5bda5');for(let k=-3;k<=3;k++)for(let floor=0;floor<3;floor++){const zz=z+k*2.3;dark.box(.12,1.7,1.15,front+side*1.65,y+2+floor*2.8,zz,'#334b48');hard.box(.2,.2,1.5,front+side*1.55,y+3+floor*2.8,zz,'#decfb3');}hard.box(16,.4,19,x,y+h+.2,z,'#e2d5bd');if(curzon)for(const zz of [-8.2,8.2]){hard.cyl(1.3,h+1,x,y+(h+1)/2,z+zz,'#af5136',8);hard.cone(1.6,2,x,y+h+2,z+zz,'#c2b38f',8);}}
    addStaticBox(x,z,7.6,9.1,0,'wall');DHAKA.buildings++;
  }
  signs.push({text:name,x:front,y:y+3,z,yaw,w:12,h:1.5});return true;
}
function dhakaInstances(g,mat,n,group){const im=new THREE.InstancedMesh(g,mat,Math.max(1,n));im.count=n;im.frustumCulled=false;group.add(im);return im;}
function dhakaAsphalt(){return sceneryTexture((g,s)=>{g.fillStyle='#777c78';g.fillRect(0,0,s,s);detailNoise(g,s,38,14000);for(let i=0;i<12;i++){g.fillStyle='rgba(37,41,39,.17)';g.fillRect(hash2(i,1)*s,hash2(i,2)*s,20+hash2(i,3)*60,4+hash2(i,4)*30);}g.strokeStyle='rgba(32,33,31,.38)';g.lineWidth=1;for(let i=0;i<16;i++){let x=hash2(i,22)*s,y=hash2(i,23)*s;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=hash2(i,j+30)*20-10;y+=8;g.lineTo(x,y);}g.stroke();}});}
function dhakaSign(text,x,y,z,yaw,w,h,group){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#154f45';g.fillRect(0,0,512,128);g.strokeStyle='#e9e4c8';g.lineWidth=5;g.strokeRect(5,5,502,118);g.fillStyle='#fff2c4';g.textAlign='center';let size=48;do{g.font=`700 ${size--}px "Hind Siliguri",sans-serif`;}while(g.measureText(text).width>475&&size>16);g.fillText(text,256,83);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=yaw;group.add(mesh);}
function buildDhakaShops(data,group){const c=document.createElement('canvas');c.width=1024;c.height=1024;const g=c.getContext('2d'),names=['মায়ের দোয়া স্টোর','ঢাকা ফার্মেসী','টিপসই স্মার্ট ডিভাইস','বিসমিল্লাহ হোটেল','সোনার বাংলা বস্ত্রালয়','জননী টেলিকম','নূর ইলেকট্রনিক্স','রহমান ট্রেডার্স'];for(let i=0;i<16;i++){const x=i%4*256,y=Math.floor(i/4)*256;g.fillStyle=['#ddd5c0','#d4ddd4','#b7c4c9'][i%3];g.fillRect(x,y,256,256);g.fillStyle=['#224d44','#a54a38','#335b7c','#6d4770'][i%4];g.fillRect(x+4,y+8,248,68);g.fillStyle='#fff4d3';g.font='700 24px "Hind Siliguri",sans-serif';g.textAlign='center';g.fillText(names[i%8],x+128,y+52,238);g.fillStyle='#66736e';g.fillRect(x+9,y+83,238,167);g.strokeStyle='#434b47';for(let j=0;j<15;j++){g.beginPath();g.moveTo(x+9,y+88+j*11);g.lineTo(x+247,y+88+j*11);g.stroke();}g.fillStyle='#253d3b';g.fillRect(x+101,y+94,54,156);g.fillStyle='#ddd1a6';g.fillRect(x+147,y+170,3,12);}
  const mat=new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide});const geometries=[];for(const p of data){const slot=Math.abs(p.seed)%16,geo=new THREE.PlaneGeometry(10,3.4),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(slot%4+uv.getX(i))/4,1-(Math.floor(slot/4)+1-uv.getY(i))/4);geo.rotateY(p.yaw);geo.translate(p.x,p.y,p.z);geometries.push(geo);}if(geometries.length)group.add(new THREE.Mesh(combineSceneryGeometries(geometries),mat));
}
function buildDhakaMetro(hard,dark,metal,signs){buildDhakaMetroLine(hard,dark,metal,signs);}
function buildDhakaStreetDetails(hard,metal,white,trees,signs){
  for(const row of DHAKA.rows){const z=DHAKA.cz+180-row*52,y=dhakaHeight(DHAKA.cx,z);for(const side of [-1,1])for(let k=-8;k<=8;k++)white.box(.5,.02,3,DHAKA.cx+side*17+k*.65,y+.065,z+side*15,'#e4e2d6');
    if(row%3===0)for(const side of [-1,1]){const x=DHAKA.cx+side*15.8;metal.box(.13,6.3,.13,x,y+3.2,z+18,'#545a56');signs.push({text:dhakaDistrict(0,row)[0],x,y:y+5.5,z:z+18,yaw:0,w:8,h:1.4});}
    for(const col of DHAKA.cols){const x=DHAKA.cx+col*70+18,zz=z+20,n=nearestRoad(x,zz,1);if(isWater(x,zz)||n.d<n.hw+1||dhakaExitAt(x,zz,1))continue;const yy=dhakaHeight(x,zz);metal.cyl(.12,8.1,x,yy+4.05,zz,'#707b75',8);metal.box(2.4,.13,.2,x-1.1,yy+8,zz,'#5e6d65');white.box(.7,.1,.35,x-2,yy+7.9,zz,'#e3e3ca');
      if((col+row)%3===0&&dhakaTreeAllowed(x,zz+6,2.2)){trees.cyl(.15,3.2,x,yy+1.6,zz+6,'#7f684c',7);trees.ball(1.8,x,yy+4,zz+6,'#496c3d',1.1,.9,1.1);}
    }
  }
  for(let row=-6;row<=12;row+=3){const z=DHAKA.cz+180-row*52+18,y=dhakaHeight(DHAKA.cx,z)+7;for(let k=-7;k<8;k++){const x=DHAKA.cx+k*2,col=k%2?'#a33440':'#286248',a=[x,y,z],b=[x+1.3,y,z],c=[x+.65,y-.7,z];hard.tri(a,b,c,col);hard.tri(c,b,a,col);}}
  // Overhead utility wires, without gameplay actors.
  const pos=[];for(const col of [-1,1])for(let row=-5;row<12;row++){const x=DHAKA.cx+col*70-12,z=DHAKA.cz+180-row*52,y=dhakaHeight(x,z)+7.5;for(let k=0;k<4;k++)for(let s=0;s<8;s++){const a=s/8,b=(s+1)/8;pos.push(x+k*.17,y-Math.sin(a*Math.PI)*.9,z-a*52,x+k*.17,y-Math.sin(b*Math.PI)*.9,z-b*52);}}
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));DHAKA.group.add(new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:'#35423b'})));
}

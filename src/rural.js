// Streamed, driveable building approaches and working roadside farms.
const TIPSOI_ACCESS={paths:[],segments:[],grid:new Map(),buildings:[],buildingGrid:new Map(),mesh:null,doors:null};
const TIPSOI_FARMS={plots:[],time:0,cropTimer:0,soil:null,crops:null,upper:null,legs:null,arms:null,tools:null,workers:[]};
const ruralKey=(x,z)=>Math.floor(x/32)+','+Math.floor(z/32);
function ruralSegmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return {d:Math.hypot(x-a.x-dx*t,z-a.z-dz*t),t};}
function ruralGround(x,z){const n=nearestRoad(x,z,2);return Math.max(surfaceY0(x,z,n),apronY(x,z));}
function ruralGridAdd(grid,item,x0,z0,x1,z1){for(let z=Math.floor(z0/32);z<=Math.floor(z1/32);z++)for(let x=Math.floor(x0/32);x<=Math.floor(x1/32);x++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(item);}}
function accessRoadAt(x,z,padding=0){const radius=Math.ceil(Math.max(0,padding-10)/32),cx=Math.floor(x/32),cz=Math.floor(z/32);let best=null;for(let j=-radius;j<=radius;j++)for(let i=-radius;i<=radius;i++){const list=TIPSOI_ACCESS.grid.get((cx+i)+','+(cz+j));if(!list)continue;for(const s of list){const q=ruralSegmentDistance(x,z,s.a,s.b);if(q.d<s.hw+padding&&(!best||q.d<best.d))best={d:q.d,y:s.a.y+(s.b.y-s.a.y)*q.t,road:{id:'A',name:'Building access road · সংযোগ সড়ক',narrow:false}};}}return best;}
function ruralBuildingAt(x,z,padding=0){const radius=Math.ceil(padding/32),cx=Math.floor(x/32),cz=Math.floor(z/32);for(let j=-radius;j<=radius;j++)for(let i=-radius;i<=radius;i++){const list=TIPSOI_ACCESS.buildingGrid.get((cx+i)+','+(cz+j));if(list)for(const b of list)if(Math.hypot(x-b.x,z-b.z)<b.radius+padding)return true;}return false;}
function farmPlotAt(x,z,padding=0){for(const p of TIPSOI_FARMS.plots){const dx=x-p.x,dz=z-p.z,u=dx*p.tx+dz*p.tz,v=dx*p.tz-dz*p.tx;if(Math.abs(u)<p.length/2+padding&&Math.abs(v)<p.width/2+padding)return true;}return false;}
function ruralVegetationBlocked(x,z,padding=8){return !!accessRoadAt(x,z,padding)||farmPlotAt(x,z,padding);}
function reserveBuildingAccess(x,z,w,d,n){
  if(n.ri<0||n.d>310||ruralBuildingAt(x,z,Math.hypot(w,d)/2+4))return null;
  // Leave existing approaches open when placing later buildings.
  const radius=Math.hypot(w,d)/2;
  for(let a=0;a<8;a++){const t=a*Math.PI/4;if(accessRoadAt(x+Math.cos(t)*radius,z+Math.sin(t)*radius,4))return null;}
  if(accessRoadAt(x,z,radius+4))return null;
  const road=RD[n.ri],a={x:road.xs[n.s]+(road.xs[n.s+1]-road.xs[n.s])*n.t,z:road.zs[n.s]+(road.zs[n.s+1]-road.zs[n.s])*n.t};
  const length=Math.hypot(x-a.x,z-a.z);if(length<d/2+road.hw+5)return null;
  const tx=(x-a.x)/length,tz=(z-a.z)/length;
  const start={x:a.x+tx*(road.hw-.3),z:a.z+tz*(road.hw-.3)},end={x:x-tx*(d/2+.9),z:z-tz*(d/2+.9)};
  const points=[],steps=Math.max(2,Math.ceil(Math.hypot(end.x-start.x,end.z-start.z)/5));
  for(let k=0;k<=steps;k++){const t=k/steps,px=start.x+(end.x-start.x)*t,pz=start.z+(end.z-start.z)*t;if(isWater(px,pz)||ruralBuildingAt(px,pz,3.3)||siteBlocksPoint(nearestRoad(px,pz,2),px,pz))return null;points.push({x:px,z:pz,y:ruralGround(px,pz)+.075});}
  const b={x,z,radius,w,d,y:ruralGround(x,z),yaw:Math.atan2(-tx,-tz),entrance:end};TIPSOI_ACCESS.buildings.push(b);ruralGridAdd(TIPSOI_ACCESS.buildingGrid,b,x-radius-5,z-radius-5,x+radius+5,z+radius+5);
  TIPSOI_ACCESS.paths.push(points);
  for(let k=1;k<points.length;k++){const s={a:points[k-1],b:points[k],hw:2.8};TIPSOI_ACCESS.segments.push(s);ruralGridAdd(TIPSOI_ACCESS.grid,s,Math.min(s.a.x,s.b.x)-14,Math.min(s.a.z,s.b.z)-14,Math.max(s.a.x,s.b.x)+14,Math.max(s.a.z,s.b.z)+14);}
  return b;
}
function planTipsoiBuildings(cx,cz,okLand){
  TIPSOI_ACCESS.paths=[];TIPSOI_ACCESS.segments=[];TIPSOI_ACCESS.grid.clear();TIPSOI_ACCESS.buildings=[];TIPSOI_ACCESS.buildingGrid.clear();TIPSOI_FARMS.plots=[];
  for(let j=cz-CR;j<=cz+CR;j++)for(let i=cx-CR;i<=cx+CR;i++){
    const x0=-W/2+i*CELL,z0=-H/2+j*CELL,[sun_,haor,city]=zoneAt(x0+80,z0+80);let cityR=0;
    if(city>.05){let bd=1e9;for(const c of CITY){const q=Math.hypot(c.x-x0,c.z-z0)/c.r;if(q<bd){bd=q;cityR=c.r;}}}
    const tallMax=Math.max(0,Math.min(1,(cityR-90)/450))*75,hill=Math.min(1,Math.max(0,heightAt(x0+80,z0+80)/20)),nBld=Math.round(Math.pow(city,1.4)*30);
    for(let k=0;k<nBld&&V.nb<MAX_BLD;k++){
      const r1=hash3(i,j,k*3+101),r2=hash3(i,j,k*3+102),r3=hash3(i,j,k*3+103),x=x0+r1*CELL,z=z0+r2*CELL,w=8+r3*14,d=8+hash3(i,j,k+211)*14;
      const n=okLand(x,z,Math.max(w,d)*.75+8);if(!n||tipsoiBillboardClearance(x,z,Math.hypot(w,d)/2+22))continue;
      const b=reserveBuildingAccess(x,z,w,d,n);if(!b)continue;const tall=city>.5?Math.pow(hash3(i,j,k+307),2.2)*tallMax*city:0,h=4+r3*(cityR>120?12:7)+tall;
      _q.setFromAxisAngle(_Y,b.yaw);obBox(x,z,w/2,d/2,b.yaw,'wall');_p.set(x,b.y-.5,z);_s.set(w,h+.5,d);_m.compose(_p,_q,_s);bldIM.setMatrixAt(V.nb,_m);_c.set(BLD_COLS[Math.floor(hash3(i,j,k+503)*BLD_COLS.length)]);bldIM.setColorAt(V.nb++,_c);
    }
    if(sun_<.3&&hill<.5&&city<.3)for(let k=0;k<Math.floor(hash3(i,j,61)*4)&&V.nhut<MAX_HUT;k++){
      const x=x0+hash3(i,j,71+k)*CELL,z=z0+hash3(i,j,81+k)*CELL;if(vnoise(x/120,z/120)<.55)continue;const n=okLand(x,z,0,14);if(!n)continue;const sc=.9+hash3(i,j,95+k)*.35;
      const b=reserveBuildingAccess(x,z,5.6*sc,4.6*sc,n);if(!b)continue;putInst(hutIM,'nhut',MAX_HUT,x,b.y,z,b.yaw,sc,.82+hash3(i,j,97+k)*.25);obBox(x,z,2.8*sc,2.3*sc,b.yaw,'house');
    }
  }
  planTipsoiFarms();
}
function ruralGeometry(positions,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
function ruralQuad(P,U,a,b,c,d,repeat=1){for(const [p,u,v] of [[a,0,0],[b,1,0],[c,0,repeat],[b,1,0],[d,1,repeat],[c,0,repeat]]){P.push(...p);U.push(u,v);}}
function buildTipsoiAccessGeometry(){
  if(!TIPSOI_ACCESS.mesh)return;const P=[],U=[];
  for(const s of TIPSOI_ACCESS.segments){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,L=Math.hypot(dx,dz),nx=dz/L*s.hw,nz=-dx/L*s.hw;
    ruralQuad(P,U,[s.a.x+nx,s.a.y,s.a.z+nz],[s.a.x-nx,s.a.y,s.a.z-nz],[s.b.x+nx,s.b.y,s.b.z+nz],[s.b.x-nx,s.b.y,s.b.z-nz],L/5);}
  TIPSOI_ACCESS.mesh.geometry.dispose();TIPSOI_ACCESS.mesh.geometry=ruralGeometry(P,U);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),scale=new THREE.Vector3();let count=0;
  for(const b of TIPSOI_ACCESS.buildings){q.setFromAxisAngle(new THREE.Vector3(0,1,0),b.yaw);v.set(b.entrance.x,b.y+1.3,b.entrance.z);m.compose(v,q,scale.set(1.4,2.6,.14));TIPSOI_ACCESS.doors.setMatrixAt(count++,m);}
  TIPSOI_ACCESS.doors.count=count;TIPSOI_ACCESS.doors.instanceMatrix.needsUpdate=true;
  const cv=document.getElementById('gl');cv.dataset.accessRoads=TIPSOI_ACCESS.paths.length;cv.dataset.connectedBuildings=TIPSOI_ACCESS.buildings.length;
}
function planTipsoiFarms(){
  const candidates=[];
  for(let ri=0;ri<RD.length;ri++){const r=RD[ri];for(let s=3;s<r.N-3;s+=4){if(r.br[s]>.05||r.wet[s])continue;const distance=Math.hypot(r.xs[s]-st.x,r.zs[s]-st.z);if(distance>650)continue;
    if(Math.floor(r.cum[s]/70)%2)continue;for(const side of [-1,1]){const off=r.hw+22+hash2(ri,s)*8,x=r.xs[s]+r.tz[s]*side*off,z=r.zs[s]-r.tx[s]*side*off;
      candidates.push({x,z,tx:r.tx[s],tz:r.tz[s],yaw:Math.atan2(r.tx[s],r.tz[s]),length:30+hash2(s,ri)*12,width:20,seed:ri*991+s*7+side,distance});}}
  }
  candidates.sort((a,b)=>a.distance-b.distance);
  for(const p of candidates){if(TIPSOI_FARMS.plots.length>=24)break;const zone=zoneAt(p.x,p.z);if(zone[0]>.3||zone[1]>.6||zone[2]>.85||farmPlotAt(p.x,p.z,16))continue;let good=true,minY=1e9,maxY=-1e9;
    for(const u of [-.5,-.25,0,.25,.5])for(const v of [-.5,0,.5]){const x=p.x+p.tx*u*p.length+p.tz*v*p.width,z=p.z+p.tz*u*p.length-p.tx*v*p.width,n=nearestRoad(x,z,2),y=ruralGround(x,z);
      if(isWater(x,z)||maskAt(x,z)<140||maskAt(x,z)>200||n.d<n.hw+6||accessRoadAt(x,z,5)||ruralBuildingAt(x,z,7)||siteBlocksPoint(n,x,z)||raAt(x,z,8)||endBlocks(x,z)){good=false;break;}minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    if(good&&maxY-minY<2.2){p.rows=Math.floor(p.width/1.5);p.cols=Math.floor(p.length/1.7);TIPSOI_FARMS.plots.push(p);}
  }
}
function upgradeTipsoiRural(){
  const make=(g,m,n)=>{const o=new THREE.InstancedMesh(g,m,n);o.count=0;o.frustumCulled=false;scene.add(o);return o;};
  const gravel=sceneryTexture((g,s)=>{g.fillStyle='#8c887e';g.fillRect(0,0,s,s);detailNoise(g,s,52,4500);g.fillStyle='#b3afa3';g.fillRect(0,0,5,s);g.fillRect(s-5,0,5,s);});
  TIPSOI_ACCESS.mesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshLambertMaterial({map:gravel,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));TIPSOI_ACCESS.mesh.receiveShadow=true;TIPSOI_ACCESS.mesh.frustumCulled=false;scene.add(TIPSOI_ACCESS.mesh);
  TIPSOI_ACCESS.doors=make(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:'#35454d'}),MAX_BLD+MAX_HUT);
  const soil=sceneryTexture((g,s)=>{g.fillStyle='#6c593b';g.fillRect(0,0,s,s);detailNoise(g,s,53,5000);for(let y=0;y<s;y+=24){g.fillStyle='#998058';g.fillRect(0,y,s,7);g.fillStyle='#504630';g.fillRect(0,y+8,s,3);}});
  TIPSOI_FARMS.soil=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshLambertMaterial({map:soil,side:THREE.DoubleSide}));TIPSOI_FARMS.soil.receiveShadow=true;TIPSOI_FARMS.soil.frustumCulled=false;scene.add(TIPSOI_FARMS.soil);
  const cropTex=sceneryTexture((g,s)=>{g.clearRect(0,0,s,s);for(let k=0;k<17;k++){const x=s/2+(hash2(k,8)-.5)*80,h=80+hash2(k,3)*145;g.strokeStyle=k%3?'#e1e5b5':'#bbc99c';g.lineWidth=2.5;g.beginPath();g.moveTo(x,s);g.quadraticCurveTo(x-20,s-h*.5,x+(k%2?34:-34),s-h);g.stroke();for(let j=1;j<4;j++){const y=s-h*j/4;g.beginPath();g.moveTo(x,y+28);g.quadraticCurveTo(x+(k%2?42:-42),y-18,x+(k%2?62:-62),y-10);g.stroke();}g.fillStyle='#ded09b';g.beginPath();g.ellipse(x+(k%2?34:-34),s-h,3,12,.4,0,Math.PI*2);g.fill();}});
  const blades=[];for(let k=0;k<4;k++){const g=new THREE.PlaneGeometry(.75,1.15);g.translate(0,.575,0);g.rotateY(k*Math.PI/4);blades.push(g);}
  TIPSOI_FARMS.crops=make(combineSceneryGeometries(blades),new THREE.MeshLambertMaterial({map:cropTex,alphaTest:.4,side:THREE.DoubleSide}),6500);TIPSOI_FARMS.crops.receiveShadow=true;
  const upper=new GB();upper.box(.4,.55,.23,0,.3,0,'#ded1ae');upper.ball(.135,0,.83,0,'#9f6c49');upper.cyl(.24,.035,0,1.0,0,'#bea570',12);upper.cone(.18,.13,0,1.075,0,'#c9b27a',10);
  const legs=new GB();legs.box(.37,.62,.27,0,.52,0,'#425d6c');for(const x of [-.11,.11]){legs.box(.12,.25,.12,x,.16,0,'#9a6a45');legs.box(.13,.07,.23,x,.035,.04,'#5c4b36');}
  const hoe=new GB();hoe.cyl(.018,1.2,0,.6,0,'#987349',6);hoe.box(.23,.045,.25,0,.04,.1,'#686e6b');
  TIPSOI_FARMS.upper=make(upper.geometry(),new THREE.MeshLambertMaterial({vertexColors:true}),48);TIPSOI_FARMS.legs=make(legs.geometry(),new THREE.MeshLambertMaterial({vertexColors:true}),48);
  TIPSOI_FARMS.arms=make(new THREE.CylinderGeometry(.047,.05,1,6),new THREE.MeshLambertMaterial({color:'#9f6c49'}),96);TIPSOI_FARMS.tools=make(hoe.geometry(),new THREE.MeshLambertMaterial({vertexColors:true}),48);
  TIPSOI_FARMS.upper.castShadow=TIPSOI_FARMS.legs.castShadow=true;
}
function rebuildTipsoiFarms(){
  if(!TIPSOI_FARMS.soil)return;const P=[],U=[];TIPSOI_FARMS.workers=[];
  for(const p of TIPSOI_FARMS.plots){const pos=(u,v)=>{const x=p.x+p.tx*u+p.tz*v,z=p.z+p.tz*u-p.tx*v;return [x,ruralGround(x,z)+.035,z];};
    for(let u=-p.length/2;u<p.length/2;u+=4)for(let v=-p.width/2;v<p.width/2;v+=4)ruralQuad(P,U,pos(u,v),pos(u,Math.min(v+4,p.width/2)),pos(Math.min(u+4,p.length/2),v),pos(Math.min(u+4,p.length/2),Math.min(v+4,p.width/2)),1);
    p.clumps=[];for(let row=0;row<p.rows;row++)for(let col=0;col<p.cols;col++){const u=(col+.5)/p.cols*p.length-p.length/2,w=(row+.5)/p.rows*p.width-p.width/2,x=p.x+p.tx*u+p.tz*w,z=p.z+p.tz*u-p.tx*w;p.clumps.push({x,z,y:ruralGround(x,z)+.05,yaw:hash2(col+row*31,p.seed)*Math.PI});}
    for(let k=0;k<2;k++)TIPSOI_FARMS.workers.push({plot:p,phase:hash2(p.seed,k+3)*6.28,lane:(k?1:-1)*p.width*.23,seed:p.seed+k*19});
  }
  TIPSOI_FARMS.soil.geometry.dispose();TIPSOI_FARMS.soil.geometry=ruralGeometry(P,U);TIPSOI_FARMS.cropTimer=0;updateTipsoiFarming(0);
  const cv=document.getElementById('gl');cv.dataset.farmPlots=TIPSOI_FARMS.plots.length;cv.dataset.farmers=TIPSOI_FARMS.workers.length;
}
function updateTipsoiFarming(dt){
  if(!TIPSOI_FARMS.crops)return;TIPSOI_FARMS.time+=dt;TIPSOI_FARMS.cropTimer-=dt;
  const time=TIPSOI_FARMS.time,m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),s=new THREE.Vector3(),base=new THREE.Matrix4(),local=new THREE.Matrix4();
  if(TIPSOI_FARMS.cropTimer<=0){TIPSOI_FARMS.cropTimer=2;let n=0;
    for(const p of TIPSOI_FARMS.plots){const growth=(time/180+hash2(p.seed,92))%1,h=growth>.92?.12:.18+Math.min(1,growth/.8)*.9,color=new THREE.Color().setHSL(growth>.7?.135:.23,growth>.7?.47:.43,growth>.7?.44:.27);
      for(const c of p.clumps){if(n>=6500)break;q.setFromAxisAngle(new THREE.Vector3(0,1,0),c.yaw);m.compose(v.set(c.x,c.y,c.z),q,s.set(.85,h,.85));TIPSOI_FARMS.crops.setMatrixAt(n,m);TIPSOI_FARMS.crops.setColorAt(n++,color);}}
    TIPSOI_FARMS.crops.count=n;TIPSOI_FARMS.crops.instanceMatrix.needsUpdate=true;if(TIPSOI_FARMS.crops.instanceColor)TIPSOI_FARMS.crops.instanceColor.needsUpdate=true;document.getElementById('gl').dataset.cropClumps=n;
  }
  let i=0;for(const worker of TIPSOI_FARMS.workers){const p=worker.plot,t=time*.75+worker.phase,travel=Math.sin(time*.045+worker.phase)*p.length*.34,x=p.x+p.tx*travel+p.tz*worker.lane,z=p.z+p.tz*travel-p.tx*worker.lane,y=ruralGround(x,z),yaw=p.yaw+(Math.cos(time*.045+worker.phase)<0?Math.PI:0),bend=.3+.5*(.5+.5*Math.sin(t));
    q.setFromEuler(e.set(0,yaw,0));base.compose(v.set(x,y,z),q,s.set(1,1,1));TIPSOI_FARMS.legs.setMatrixAt(i,base);
    q.setFromEuler(e.set(bend,0,0));local.compose(v.set(0,.85,0),q,s.set(1,1,1));m.multiplyMatrices(base,local);TIPSOI_FARMS.upper.setMatrixAt(i,m);
    q.setFromEuler(e.set(.2+.3*Math.sin(t),0,0));local.compose(v.set(.2,.05,.48),q,s.set(1,1,1));m.multiplyMatrices(base,local);TIPSOI_FARMS.tools.setMatrixAt(i,m);
    for(const side of [-1,1]){const a=new THREE.Vector3(side*.25,1.28,.1),b=new THREE.Vector3(side*.1,.8+.1*Math.sin(t),.53),direction=b.clone().sub(a),length=direction.length();q.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());local.compose(a.add(b).multiplyScalar(.5),q,s.set(1,length,1));m.multiplyMatrices(base,local);TIPSOI_FARMS.arms.setMatrixAt(i*2+(side>0?1:0),m);}i++;
  }
  for(const [mesh,count] of [[TIPSOI_FARMS.upper,i],[TIPSOI_FARMS.legs,i],[TIPSOI_FARMS.tools,i],[TIPSOI_FARMS.arms,i*2]]){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;}
}

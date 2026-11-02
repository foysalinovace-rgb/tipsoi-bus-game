// Footpath van stalls and bounded shopping animations; no road traffic actors.
const FOOTPATH_MARKET={sites:[],grid:new Map(),walkSections:0,time:0,timer:0,visible:[],carts:[],bodies:[],heads:null,legs:null,arms:null,bags:null,capacity:96};
function marketReservedAt(x,z,padding=0){const list=FOOTPATH_MARKET.grid.get(Math.floor(x/64)+','+Math.floor(z/64))||[];return list.some(p=>Math.hypot(x-p.a.x,z-p.a.z)<p.hw+padding);}
function marketFootprint(w,shift=0){const side=w.side||1,yaw=w.yaw+(side<0?Math.PI:0),nx=Math.cos(yaw),nz=-Math.sin(yaw),tx=Math.sin(w.yaw),tz=Math.cos(w.yaw),x=w.x+nx*.8+tx*shift,z=w.z+nz*.8+tz*shift;return {x,z,y:w.y,yaw,nx,nz,cx:x-nx*.6,cz:z-nz*.6,hx:1.3,hz:2.6,radius:3.1,owner:w.owner||null};}
function marketSiteClear(p){
  if(marketReservedAt(p.cx,p.cz,7)||roadsideReservedAt(p.cx,p.cz,3.4)||!roadsideStaticFootprintClear(p.cx,p.cz,p.hx,p.hz,p.yaw)||!roadsideFootprintClear(p.cx,p.cz,p.hx,p.hz,p.yaw,.6))return false;
  if(DHAKA.entrances.some(d=>Math.hypot(d.x-p.cx,d.z-p.cz)<5))return false;
  return !(DHAKA.treeSites||[]).some(t=>Math.hypot(t.x-p.cx,t.z-p.cz)<t.r+3);
}
function registerMarketWalks(walks){
  for(const w of walks){if(!w.side||w.w<3.4||w.d<6)continue;FOOTPATH_MARKET.walkSections++;
    for(const shift of [0,-w.d*.23,w.d*.23]){const p=marketFootprint(w,shift);if(Math.abs(shift)+p.hz>w.d/2-.15||!marketSiteClear(p))continue;
      p.kind=FOOTPATH_MARKET.sites.length%3;p.seed=hash2(Math.floor(p.x*3),Math.floor(p.z*3));FOOTPATH_MARKET.sites.push(p);roadClearanceIndex(FOOTPATH_MARKET.grid,{a:{x:p.cx,z:p.cz},b:{x:p.cx,z:p.cz},hw:p.radius},20);addStaticBox(p.x,p.z,.7,1.65,p.yaw,'shop');break;
    }
  }
  reportFootpathMarkets();
}
function registerBazaarMarkets(site){
  if(site.marketRegistered)return;site.marketRegistered=true;const r=RD[site.ri],walks=[];
  for(let s=site.s0+12;s<site.s1-10;s+=18)for(const side of [-1,1]){const p=roadPoint(r,s);walks.push({x:p.x+p.tz*side*(r.hw+1.8),z:p.z-p.tx*side*(r.hw+1.8),y:p.y-.18,w:3.6,d:10,yaw:Math.atan2(p.tx,p.tz),side,owner:site});}
  registerMarketWalks(walks);FOOTPATH_MARKET.timer=0;
}
function marketCartGeometry(kind){
  const g=new GB(),wood='#947043',steel='#515d5e',colors=['#b95072','#438b5b','#e8a636'],color=colors[kind];
  g.box(1.12,.15,2.6,0,.79,0,wood);g.box(1.18,.28,2.62,0,.59,0,color);for(const z of [-1.22,1.22])g.box(1.2,.18,.06,0,.93,z,wood);
  for(const x of [-.65,.65]){g.cyl(.39,.075,x,.4,-.4,'#242b2b',16,0,0,Math.PI/2);g.cyl(.31,.081,x,.4,-.4,'#a5b1ae',16,0,0,Math.PI/2);g.cyl(.275,.087,x,.4,-.4,'#344345',16,0,0,Math.PI/2);for(let k=0;k<8;k++)g.box(.095,.012,.57,x,.4,-.4,'#d6d6c5',k*Math.PI/4);}
  g.cyl(.26,.07,0,.27,1.25,'#283234',12,Math.PI/2);g.box(.6,.06,.06,0,.9,1.6,steel);g.box(.06,.6,.06,-.27,.6,1.6,steel);g.box(.06,.6,.06,.27,.6,1.6,steel);
  for(const x of [-.57,.57])for(const z of [-1.15,1.15])g.box(.045,1.45,.045,x,1.55,z,steel);
  for(let k=0;k<7;k++)g.box(.2,.055,2.9,-.6+k*.2,2.31,0,k%2?'#efe7cf':color);g.box(1.4,.24,.04,0,2.2,-1.44,color);g.box(1.4,.24,.04,0,2.2,1.44,color);
  if(kind===0){
    for(let k=0;k<5;k++){const z=-.9+k*.43,c=['#d75571','#468bb9','#e9c447','#73a77c','#ddd7c7'][k];g.box(.65,.045,.34,-.13,.94+k*.016,z,c);g.box(.56,.04,.29,-.13,.985+k*.016,z,'#d9c9bd');}
    g.box(.045,.7,2.1,.44,1.65,0,steel);for(let k=0;k<4;k++){const z=-.78+k*.52,c=['#b54264','#397ba0','#dea629','#597c4d'][k];g.box(.035,.5,.3,.42,1.62,z,c);g.box(.045,.16,.5,.42,1.84,z,c);g.box(.06,.055,.1,.42,1.95,z,'#e8d5b1');}
  }else{
    for(let bin=0;bin<4;bin++){const z=-.93+bin*.6;g.box(.98,.12,.54,0,.94,z,'#756039');for(const x of [-.5,.5])g.box(.035,.16,.55,x,1.04,z,'#b3975b');for(const dz of [-.27,.27])g.box(1,.16,.035,0,1.04,z+dz,'#b3975b');
      for(let a=0;a<4;a++)for(let b=0;b<3;b++){const x=-.35+a*.23,zz=z-.17+b*.17,y=1.1+(a+b)%2*.025;if(kind===1){const c=['#4d8a34','#c74634','#b7bd62','#448854'][bin];g.ball(.115,x,y,zz,c,bin===3?.65:1,bin===3?1.2:1);if(bin===0)g.ball(.065,x,y+.085,zz,'#bdd499',.7,1.1);}
        else{const c=['#e48d25','#bc3b3e','#8baf48','#e5c244'][bin];if(bin===3){g.box(.065,.065,.23,x,y,zz,c,0,.35);g.box(.065,.06,.16,x+.05,y+.025,zz,c,0,.2);}else g.ball(.105,x,y,zz,c);}
      }
    }
  }
  return g.geometry();
}
function marketPersonBody(role){const g=new GB(),col=['#398d84','#e5dfd1','#b95779'][role];g.box(.45,.62,.25,0,.34,0,col);g.box(.12,.27,.27,-.28,.44,0,col);g.box(.12,.27,.27,.28,.44,0,col);if(role===0)g.box(.38,.43,.27,0,-.13,0,'#4c6374');if(role===2){g.box(.42,.7,.29,0,-.19,0,col);g.box(.17,.65,.035,-.11,.4,.155,'#e7be6d');}return g.geometry();}
function buildFootpathMarkets(walks){
  registerMarketWalks(walks);const M=FOOTPATH_MARKET,mat=new THREE.MeshLambertMaterial({vertexColors:true}),make=(g,n,material=mat)=>{const im=new THREE.InstancedMesh(g,material,n);im.count=0;im.frustumCulled=false;im.castShadow=true;scene.add(im);return im;};
  M.carts=[0,1,2].map(k=>make(marketCartGeometry(k),M.capacity));M.bodies=[0,1,2].map(k=>make(marketPersonBody(k),M.capacity));
  const head=new GB();head.ball(.145,0,.91,0,'#aa7958',1.1);head.ball(.149,0,1.015,-.015,'#34332c',.5);head.box(.055,.065,.07,0,.91,.14,'#a77451');for(const x of [-.055,.055])head.ball(.013,x,.95,.137,'#282b27');M.heads=make(head.geometry(),M.capacity*3);
  const leg=new GB();leg.box(.14,.65,.16,0,-.325,0,'#3f4e60');leg.box(.17,.08,.29,0,-.69,.045,'#574b3d');M.legs=make(leg.geometry(),M.capacity*6);
  M.arms=make(new THREE.CylinderGeometry(.043,.048,1,6),M.capacity*6,new THREE.MeshLambertMaterial({color:'#ac7955'}));
  const bag=new GB();bag.box(.27,.32,.16,0,-.12,0,'#ceb17a');for(const x of [-.08,.08])bag.box(.025,.16,.025,x,.1,0,'#9c7e4f');bag.box(.18,.025,.025,0,.18,0,'#9c7e4f');M.bags=make(bag.geometry(),M.capacity*3);
  const labels=['জামা-কাপড়','তাজা সবজি','তাজা ফল'],c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');for(let i=0;i<3;i++){ctx.fillStyle=['#a53d63','#246348','#a35f23'][i];ctx.fillRect(i*256,0,256,128);ctx.fillStyle='#fff6d9';ctx.textAlign='center';ctx.font='700 44px "Hind Siliguri",sans-serif';ctx.fillText(labels[i],i*256+128,82,240);}M.signs=[0,1,2].map(k=>{const g=new THREE.PlaneGeometry(2.25,.34);g.rotateY(-Math.PI/2);g.translate(-.716,2.18,0);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+k)/3);return make(g,M.capacity,new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));});
  M.timer=0;updateFootpathMarkets(0);
}
function reportFootpathMarkets(){const cv=document.getElementById('gl');cv.dataset.marketSites=FOOTPATH_MARKET.sites.length;cv.dataset.marketWalkSections=FOOTPATH_MARKET.walkSections;cv.dataset.marketRoadOverlaps=FOOTPATH_MARKET.sites.filter(p=>!roadsideFootprintClear(p.cx,p.cz,p.hx,p.hz,p.yaw,.55)).length;cv.dataset.marketKinds='clothes,vegetables,fruit';}
const MARKET_POSE={m:null,q:null,e:null,p:null,s:null,base:null,local:null};
function marketShopperPose(time,seed,role){const phase=(time/20+seed+role*.37)%1,approach=Math.max(0,1-phase/.25),leave=Math.max(0,(phase-.78)/.22),walking=role>0&&(phase<.25||phase>.78);return {phase,walking,bag:role>0&&phase>.7,lx:role===0?0:-1.2,lz:role===0?-1.95:(role===1?1:-1)*(.45+Math.max(approach,leave)*1.5),yaw:role===0?0:walking?(role===1?phase<.25?Math.PI:0:phase<.25?0:Math.PI):Math.PI/2,step:walking?Math.sin(time*7+seed*20):0,reach:role===0?.35+.2*Math.sin(time*1.8+seed*10):phase>.27&&phase<.78?.65:0};}
function updateFootpathMarkets(dt){
  const M=FOOTPATH_MARKET;if(!M.carts.length)return;M.time+=dt;M.timer-=dt;
  const V=MARKET_POSE;if(!V.m){V.m=new THREE.Matrix4();V.q=new THREE.Quaternion();V.e=new THREE.Euler();V.p=new THREE.Vector3();V.s=new THREE.Vector3();V.base=new THREE.Matrix4();V.local=new THREE.Matrix4();V.armA=new THREE.Vector3();V.armB=new THREE.Vector3();V.direction=new THREE.Vector3();V.up=new THREE.Vector3(0,1,0);}
  const {m,q,e,p,s,base,local}=V;
  if(M.timer<=0){M.timer=.6;M.visible=M.sites.filter(a=>(!a.owner||a.owner.built)&&Math.hypot(a.x-st.x,a.z-st.z)<230).sort((a,b)=>Math.hypot(a.x-st.x,a.z-st.z)-Math.hypot(b.x-st.x,b.z-st.z)).slice(0,M.capacity);const counts=[0,0,0];for(const a of M.visible){q.setFromEuler(e.set(0,a.yaw,0));m.compose(p.set(a.x,a.y,a.z),q,s.set(1,1,1));const n=counts[a.kind]++;M.carts[a.kind].setMatrixAt(n,m);M.signs[a.kind].setMatrixAt(n,m);}for(let k=0;k<3;k++)for(const mesh of [M.carts[k],M.signs[k]]){mesh.count=counts[k];mesh.instanceMatrix.needsUpdate=true;}document.getElementById('gl').dataset.marketVisible=M.visible.length;document.getElementById('gl').dataset.marketShoppers=M.visible.length*2;}
  let actor=0;
  for(let index=0;index<M.visible.length;index++){const a=M.visible[index],sn=Math.sin(a.yaw),cs=Math.cos(a.yaw);
    for(let role=0;role<3;role++,actor++){
      const pose=marketShopperPose(M.time,a.seed,role),{lx,lz,step,reach,walking}=pose,x=a.x+cs*lx+sn*lz,z=a.z-sn*lx+cs*lz,yaw=a.yaw+pose.yaw;
      q.setFromEuler(e.set(0,yaw,0));base.compose(p.set(x,a.y,z),q,s.set(1,1,1));q.setFromEuler(e.set(reach*.09,0,0));local.compose(p.set(0,.79,0),q,s.set(1,1,1));m.multiplyMatrices(base,local);M.bodies[role].setMatrixAt(index,m);M.heads.setMatrixAt(actor,m);
      for(const side of [-1,1]){const k=actor*2+(side>0?1:0);q.setFromEuler(e.set(step*.35*side,0,0));local.compose(p.set(side*.13,.77,0),q,s.set(1,1,1));m.multiplyMatrices(base,local);M.legs.setMatrixAt(k,m);
        const aa=V.armA.set(side*.29,1.32,0),bb=V.armB.set(side*.22,1.0+reach*.15,reach+(walking?step*side*.18:0)),d=V.direction.copy(bb).sub(aa),length=d.length();q.setFromUnitVectors(V.up,d.normalize());local.compose(p.copy(aa).add(bb).multiplyScalar(.5),q,s.set(1,length,1));m.multiplyMatrices(base,local);M.arms.setMatrixAt(k,m);
      }
      q.setFromEuler(e.set(0,0,0));local.compose(p.set(-.28,.81,.08),q,s.setScalar(pose.bag?1:0));m.multiplyMatrices(base,local);M.bags.setMatrixAt(actor,m);
    }
  }
  for(const mesh of M.bodies){mesh.count=M.visible.length;mesh.instanceMatrix.needsUpdate=true;}for(const [mesh,n] of [[M.heads,actor],[M.legs,actor*2],[M.arms,actor*2],[M.bags,actor]]){mesh.count=n;mesh.instanceMatrix.needsUpdate=true;}
}

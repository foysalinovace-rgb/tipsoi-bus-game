// Elevated, double-track Dhaka metro with bounded terminal-to-terminal service.
const DHAKA_METRO={lo:-467,hi:513,railY:12.98,trackX:1.9,carLength:10,carPitch:10.4,cars:4,clock:92,cycle:0,schedule:[],stations:[{z:-427,name:'উত্তরা উত্তর',terminal:true,length:82},{z:-159,name:'মিরপুর ১০',length:64},{z:205,name:'শাহবাগ',length:64},{z:475,name:'যাত্রাবাড়ী',terminal:true,length:82}],entrances:[],trains:[],cab:null,middle:null,doors:null,lamps:null,displays:null,pose:null,reportTime:0};
function metroRideProfile(distance){const accel=1.4,speed=Math.min(9,Math.sqrt(distance*accel)),ramp=speed/accel,cruise=Math.max(0,(distance-speed*ramp)/speed);return {accel,speed,ramp,cruise,duration:ramp*2+cruise};}
function planMetroService(){
  const M=DHAKA_METRO;M.schedule=[];M.cycle=0;const route=[0,1,2,3,2,1];
  for(let i=0;i<route.length;i++){const from=route[i],to=route[(i+1)%route.length],a=M.stations[from],b=M.stations[to],dwell=a.terminal?12:8,profile=metroRideProfile(Math.abs(b.z-a.z));M.schedule.push({kind:'stop',from,to,start:M.cycle,duration:dwell});M.cycle+=dwell;M.schedule.push({kind:'ride',from,to,start:M.cycle,duration:profile.duration,profile});M.cycle+=profile.duration;}
}
function metroTrainState(time,offset=0){
  const M=DHAKA_METRO;if(!M.cycle)planMetroService();const t=((time+offset)%M.cycle+M.cycle)%M.cycle;
  for(const leg of M.schedule){if(t>=leg.start+leg.duration)continue;const u=Math.max(0,t-leg.start),a=M.stations[leg.from],b=M.stations[leg.to],dir=Math.sign(b.z-a.z);
    if(leg.kind==='stop')return {z:a.z,speed:0,dir,station:leg.from,door:Math.max(0,Math.min(1,u/.85,(leg.duration-u)/1.2))};
    const p=leg.profile;let distance,speed;
    if(u<p.ramp){distance=.5*p.accel*u*u;speed=p.accel*u;}else if(u<p.ramp+p.cruise){distance=.5*p.speed*p.ramp+p.speed*(u-p.ramp);speed=p.speed;}else{const v=u-p.ramp-p.cruise;distance=.5*p.speed*p.ramp+p.speed*p.cruise+p.speed*v-.5*p.accel*v*v;speed=Math.max(0,p.speed-p.accel*v);}
    return {z:a.z+dir*Math.min(Math.abs(b.z-a.z),distance),speed,dir,station:-1,door:0};
  }
  return {z:M.stations[0].z,speed:0,dir:1,station:0,door:0};
}
function metroBaseY(z){return dhakaHeight(DHAKA.cx,z);}
function metroStationAt(z,padding=0){return DHAKA_METRO.stations.some(s=>Math.abs(z-(DHAKA.cz+s.z))<s.length/2+padding);}
function metroPierPositions(){const positions=[];for(let z=DHAKA.cz+DHAKA_METRO.lo+21;z<DHAKA.cz+DHAKA_METRO.hi;z+=26)if(!dhakaExitAt(DHAKA.cx,z,2.5)&&!DHAKA.rows.some(row=>Math.abs(z-(DHAKA.cz+180-row*52))<16))positions.push(z);return positions;}
function planMetroEntrances(){
  for(const station of DHAKA_METRO.stations)for(const side of [-1,1])for(const shift of [0,6,-6]){
    const x=DHAKA.cx+side*14.3,z=DHAKA.cz+station.z+(station.terminal?(station.z<0?9:-9):0)+shift;
    if(roadsideReservedAt(x,z,7)||!roadsideFootprintClear(x,z,2,6.2,0,.6)||!roadsideStaticFootprintClear(x,z,2,6.2,0,.5))continue;
    const entry={x,z,hx:2,hz:6.2,yaw:0,kind:'metro-stairs',station,side};DHAKA_METRO.entrances.push(entry);reserveRoadsideSite(entry);break;
  }
}
function buildMetroStation(s,hard,metal,signs){
  const x=DHAKA.cx,z=DHAKA.cz+s.z,y=metroBaseY(z),L=s.length;
  hard.box(22,2,L,x,y+11.6,z,'#c9c6b7');
  for(const side of [-1,1]){
    hard.box(7.45,1,L,x+side*7.025,y+13.18,z,'#ddd8c8');hard.box(.18,.06,L-1,x+side*3.4,y+13.72,z,'#edc83b');
    hard.box(11.8,.22,L+2,x+side*5.8,y+18.55,z,'#879f9b',0,0,side*.07);
    for(let dz=-L/2+2;dz<=L/2-2;dz+=8){metal.box(.18,4.9,.18,x+side*10.55,y+16.1,z+dz,'#5b7976');hard.box(.08,1.05,6.8,x+side*10.8,y+14.35,z+dz+3.3,'#607f79');}
    metal.box(.12,.12,L,x+side*10.8,y+14.92,z,'#c5d1c5');hard.box(.32,.35,L+2,x+side*11.7,y+18.15,z,'#617d78');
    signs.push({text:s.name+(s.terminal?' · শেষ স্টেশন':' মেট্রো স্টেশন'),x:x+side*11.82,y:y+16.25,z,yaw:side*Math.PI/2,w:s.terminal?24:20,h:1.8});
    // Benches and platform lamps sit above the road, outside the train envelope.
    for(const dz of [-L*.26,L*.26]){hard.box(.55,.12,3,x+side*7.8,y+14.2,z+dz,'#719083');for(const d of [-1,1])metal.box(.08,.55,.08,x+side*7.8,y+13.95,z+dz+d,'#465c58');hard.box(.5,.08,2.4,x+side*8.7,y+18.1,z+dz,'#f6edc7');}
    const entry=DHAKA_METRO.entrances.find(e=>e.station===s&&e.side===side);
    if(entry){const stairZ=entry.z,stairX=entry.x;
      const ground=roadsideGroundY(stairX,stairZ),rise=y+13.68-ground,n=24,dy=rise/(n*2),run=9.6;
      for(let k=0;k<n;k++){const zz=stairZ-run/2+k*.4;hard.box(1.5,.15,.43,x+side*13.4,ground+(k+1)*dy-.075,zz,'#b5b7aa');hard.box(1.5,.15,.43,x+side*15.2,ground+rise/2+(k+1)*dy-.075,stairZ+run/2-k*.4,'#c2c1b4');}
      hard.box(3.5,.2,1.3,stairX,ground+rise/2-.1,stairZ+5.1,'#c4c6b6');hard.box(5.5,.2,1.4,x+side*13.25,y+13.58,stairZ-5.1,'#c4c6b6');
      for(const [sx,upper] of [[12.55,false],[14.25,false],[14.35,true],[16.05,true]]){const pitch=(upper?1:-1)*Math.atan2(rise/2,run),length=Math.hypot(run,rise/2),yy=ground+rise*(upper?.75:.25);metal.box(.07,.07,length,x+side*sx,yy+1,stairZ,'#647c74',pitch);metal.box(.12,.2,length,x+side*sx,yy-.22,stairZ,'#87958b',pitch);}
      addStaticBox(stairX,stairZ,2,6.2,0,'wall');
    }
  }
  if(s.terminal){
    const end=s.z<0?DHAKA.cz+DHAKA_METRO.lo:DHAKA.cz+DHAKA_METRO.hi,front=s.z<0?-1:1;
    // The deck and rails finish inside a roofed headhouse, behind buffer stops.
    hard.box(22,5.1,.65,x,y+16.2,end+front*.45,'#a3b5aa');hard.box(8.8,1.2,.6,x,y+12.3,end,'#b2aa94');
    for(const lane of [-1,1]){const xx=x+lane*DHAKA_METRO.trackX,zz=end-front*2.6;metal.box(2,.3,.3,xx,y+13.55,zz,'#c33837');for(const dx of [-.65,.65])metal.box(.18,.7,.65,xx+dx,y+13.2,zz,'#424c4a');hard.box(.22,.32,.1,xx,y+14.15,zz,'#f14b37');}
    signs.push({text:s.name+' TERMINAL · লাইন সমাপ্ত',x,y:y+16.7,z:end+front*.81,yaw:front>0?0:Math.PI,w:18,h:1.5});
  }
}
function buildDhakaMetroLine(hard,dark,metal,signs){
  const M=DHAKA_METRO,x=DHAKA.cx,lo=DHAKA.cz+M.lo,hi=DHAKA.cz+M.hi;planMetroService();
  for(let z=lo;z<hi;z+=12){const L=Math.min(12,hi-z),mid=z+L/2,y=metroBaseY(mid);hard.box(8.8,1.05,L+.03,x,y+12.3,mid,'#b2aa94');for(const side of [-1,1]){hard.box(.32,1.3,L+.02,x+side*4.25,y+13.4,mid,'#c4baa2');for(const rail of [-1,1])metal.box(.1,.14,L+.02,x+side*M.trackX+rail*.7,y+12.95,mid,'#65716e');}}
  for(let z=lo+.6;z<hi;z+=1.4)for(const side of [-1,1])dark.box(1.75,.08,.18,x+side*M.trackX,metroBaseY(z)+12.87,z,'#817f71');
  for(const z of metroPierPositions()){const y=metroBaseY(z);hard.box(1.6,11.7,1.8,x,y+5.85,z,'#c5baa2');hard.box(7.2,1.1,2.1,x,y+11.3,z,'#b1a58d');hard.box(2.9,.2,7,x,y+.12,z,'#d6d2be');for(let k=0;k<7;k++)(k%2?dark:hard).box(.24,.22,1,x-1.45,y+.2,z-3+k,k%2?'#272e2b':'#e8c637');addStaticBox(x,z,.95,1,0,'wall');DHAKA.metro++;}
  for(let z=lo+18;z<hi;z+=42){if(metroStationAt(z,5))continue;const y=metroBaseY(z);for(const side of [-1,1])metal.box(.1,4.6,.1,x+side*3.95,y+15.2,z,'#658078');metal.box(8,.12,.12,x,y+17.48,z,'#658078');}
  const wire=[];for(let z=lo;z<hi;z+=12){const next=Math.min(hi,z+12);for(const side of [-1,1])wire.push(x+side*M.trackX,metroBaseY(z)+17.15,z,x+side*M.trackX,metroBaseY(next)+17.15,next);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(wire,3));DHAKA.group.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#4f625e'})));
  for(const station of M.stations)buildMetroStation(station,hard,metal,signs);
  buildMetroTrains();document.getElementById('gl').dataset.metroTerminals=2;document.getElementById('gl').dataset.metroStations=M.stations.length;document.getElementById('gl').dataset.metroEntrances=M.entrances.length;
}
function metroCarGeometry(cab){
  const g=new GB();g.box(2.55,2.2,10,0,1.85,0,'#e4e9dd');g.box(2.59,.36,10.02,0,1.06,0,'#238764');g.box(2.5,.22,9.9,0,3.02,0,'#c4cec4');g.box(2.12,.3,2.7,0,3.27,0,'#96a59e');
  for(const side of [-1,1]){for(const z of [-3.65,-1.2,1.2,3.65]){g.box(.045,.82,1.15,side*1.292,2.19,z,'#294b50');g.box(.05,.055,1.2,side*1.32,1.76,z,'#689a90');}for(const z of [-2.4,0,2.4])g.box(.045,1.89,.72,side*1.29,1.74,z,'#263f3f');}
  for(const z of [-3.35,3.35]){g.box(1.65,.26,1.6,0,.43,z,'#3d4947');for(const side of [-1,1])for(const dz of [-.48,.48])g.cyl(.25,.12,side*.7,.25,z+dz,'#343b39',12,0,0,Math.PI/2);}
  g.box(.32,.25,.8,0,.65,-5.2,'#48514e');g.box(.32,.25,.8,0,.65,5.2,'#48514e');
  if(cab){g.box(2.2,.85,.05,0,2.23,5.035,'#264c50');g.box(2.4,.45,.07,0,1.4,5.045,'#238b65');g.ball(.17,0,1.4,5.1,'#b8393e',1,.85);g.box(1.35,.26,.06,0,2.78,5.065,'#1b3637');}
  else{g.box(.08,.8,.8,0,3.7,0,'#596b65',.38);g.box(.95,.035,.15,0,4.14,.17,'#405551');}
  return g.geometry();
}
function buildMetroTrains(){
  const M=DHAKA_METRO,make=(g,n,mat)=>{const im=new THREE.InstancedMesh(g,mat,n);im.frustumCulled=false;im.castShadow=true;DHAKA.group.add(im);return im;},mat=new THREE.MeshLambertMaterial({vertexColors:true});
  M.cab=make(metroCarGeometry(true),4,mat);M.middle=make(metroCarGeometry(false),4,mat);
  const door=new GB();door.box(.065,1.85,.32,0,0,0,'#dee5da');door.box(.072,.67,.22,0,.38,0,'#355a5c');door.box(.075,.28,.32,0,-.6,0,'#278b66');M.doors=make(door.geometry(),96,mat);
  M.lamps=make(new THREE.SphereGeometry(.09,8,6),8,new THREE.MeshBasicMaterial({color:'#ffffff'}));
  const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#183c36';ctx.fillRect(0,0,512,96);ctx.fillStyle='#e7f1c3';ctx.textAlign='center';ctx.font='700 58px "Hind Siliguri",sans-serif';ctx.fillText('ঢাকা মেট্রো',256,70);M.displays=make(new THREE.PlaneGeometry(1.28,.24),4,new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));
  M.trains=[{lane:-1,phase:0},{lane:1,phase:M.cycle/2}];M.pose={m:new THREE.Matrix4(),q:new THREE.Quaternion(),e:new THREE.Euler(),p:new THREE.Vector3(),s:new THREE.Vector3(1,1,1),color:new THREE.Color()};updateDhakaMetro(0);
}
function updateDhakaMetro(dt){
  const M=DHAKA_METRO;if(!M.pose)return;M.clock+=dt;M.budget=(M.budget||0)+dt;const interval=Math.hypot(st.x-DHAKA.cx,st.z-DHAKA.cz)>1600?1:1/30;if(M.updated&&M.budget<interval)return;M.updated=true;M.budget=0;const {m,q,e,p,s,color}=M.pose;let cab=0,middle=0,door=0,lamp=0,display=0;const states=[];
  for(const train of M.trains){const state=metroTrainState(M.clock,train.phase),x=DHAKA.cx+train.lane*M.trackX,z=DHAKA.cz+state.z;states.push({z:+state.z.toFixed(2),speed:+state.speed.toFixed(2),station:state.station,doors:+state.door.toFixed(2)});
    for(let k=0;k<M.cars;k++){const zz=z+(k-(M.cars-1)/2)*M.carPitch,y=metroBaseY(zz)+M.railY,isCab=k===0||k===M.cars-1,flip=k===0?Math.PI:0;q.setFromEuler(e.set(0,isCab?flip:0,0));m.compose(p.set(x,y,zz),q,s);if(isCab)M.cab.setMatrixAt(cab++,m);else M.middle.setMatrixAt(middle++,m);
      for(const side of [-1,1])for(const center of [-2.4,0,2.4])for(const half of [-1,1]){q.setFromEuler(e.set(0,0,0));m.compose(p.set(x+side*1.32,y+1.74,zz+center+half*(.17+state.door*.3)),q,s);M.doors.setMatrixAt(door++,m);}
      if(isCab){const outward=k===0?-1:1,front=outward===state.dir;for(const side of [-1,1]){q.setFromEuler(e.set(0,0,0));m.compose(p.set(x+side*.83,y+1.36,zz+outward*5.1),q,s);M.lamps.setMatrixAt(lamp,m);M.lamps.setColorAt(lamp++,color.set(front?'#fff5bf':'#d34036'));}q.setFromEuler(e.set(0,flip,0));m.compose(p.set(x,y+2.78,zz+outward*5.105),q,s);M.displays.setMatrixAt(display++,m);}
    }
  }
  for(const mesh of [M.cab,M.middle,M.doors,M.lamps,M.displays])mesh.instanceMatrix.needsUpdate=true;M.lamps.instanceColor.needsUpdate=true;
  M.reportTime-=interval;if(M.reportTime<=0){M.reportTime=.4;const cv=document.getElementById('gl');cv.dataset.metroTrains=2;cv.dataset.metroCars=8;cv.dataset.metroService=JSON.stringify(states);}
}

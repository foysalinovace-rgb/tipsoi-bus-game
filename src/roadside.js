// Place the entire fixture footprint outside every nearby carriageway.
const ROADSIDE={sites:[],grid:new Map(),signals:[],stops:[],roadGrid:null};
function buildRoadsideRoadIndex(){const grid=new Map();for(const r of RD)for(let i=1;i<r.N;i++){const aw=dhakaExitWidth(r,i-1)/2,bw=dhakaExitWidth(r,i)/2;roadClearanceIndex(grid,{a:{x:r.xs[i-1],z:r.zs[i-1]},b:{x:r.xs[i],z:r.zs[i]},aw,bw,hw:Math.max(aw,bw)},8);}ROADSIDE.roadGrid=grid;}
function roadsideRoadAt(x,z,gap=0){
  if(!ROADSIDE.roadGrid)buildRoadsideRoadIndex();const ci=Math.floor(x/64),cj=Math.floor(z/64),radius=Math.ceil(Math.max(0,gap-8)/64);
  for(let j=cj-radius;j<=cj+radius;j++)for(let i=ci-radius;i<=ci+radius;i++)for(const s of ROADSIDE.roadGrid.get(i+','+j)||[]){const p=ruralSegmentDistance(x,z,s.a,s.b);if(p.d<s.aw+(s.bw-s.aw)*p.t+gap)return true;}
  return !!raAt(x,z,gap);
}
function roadsideReservedAt(x,z,padding=0){const list=ROADSIDE.grid.get(Math.floor(x/64)+','+Math.floor(z/64))||[];return list.some(p=>Math.hypot(x-p.a.x,z-p.a.z)<p.hw+padding);}
function reserveRoadsideSite(p){p.radius=Math.hypot(p.hx,p.hz);ROADSIDE.sites.push(p);roadClearanceIndex(ROADSIDE.grid,{a:p,b:p,hw:p.radius},20);}
function roadsideFootprintClear(x,z,hx,hz,yaw,gap=.75){
  const c=Math.cos(yaw),s=Math.sin(yaw),nx=Math.max(1,Math.ceil(hx*2)),nz=Math.max(1,Math.ceil(hz*2));
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const u=-hx+2*hx*i/nx,v=-hz+2*hz*j/nz,px=x+c*u+s*v,pz=z-s*u+c*v;
    if(roadsideRoadAt(px,pz,gap)||isWater(px,pz)||maskAt(px,pz)<140)return false;
  }
  return true;
}
function roadsideStaticClear(x,z,radius){
  return !STATICS.some(p=>{if(p.box){const dx=x-p.x,dz=z-p.z,u=dx*p.c-dz*p.s,v=dx*p.s+dz*p.c;return Math.hypot(Math.max(0,Math.abs(u)-p.hx),Math.max(0,Math.abs(v)-p.hz))<radius;}return Math.hypot(x-p.x,z-p.z)<radius+(p.r||0);});
}
function roadsideStaticFootprintClear(x,z,hx,hz,yaw,gap=.2){
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return !STATICS.some(p=>{const dx=p.x-x,dz=p.z-z,u=dx*c-dz*s,v=dx*s+dz*c;
    if(!p.box)return Math.hypot(Math.max(0,Math.abs(u)-hx),Math.max(0,Math.abs(v)-hz))<(p.r||0)+gap;
    const a=Math.abs(c*p.c+s*p.s),b=Math.abs(c*p.s-s*p.c);
    if(Math.abs(u)>hx+gap+p.hx*a+p.hz*b||Math.abs(v)>hz+gap+p.hx*b+p.hz*a)return false;
    return Math.abs(dx*p.c-dz*p.s)<=p.hx+gap+hx*a+hz*b&&Math.abs(dx*p.s+dz*p.c)<=p.hz+gap+hx*b+hz*a;
  });
}
function findRoadsideSite(r,s,dir,kind){
  const stop=kind==='stop',hx=stop?1.6:.5,hz=stop?3.3:.5,shifts=stop?[0,12,-12,24,-24,40,-40,60,-60,90,-90]:[0,-dir*3,-dir*6,-dir*12],choices=[];
  for(const shift of shifts)for(const extra of [0,.8,1.6,3.2,5.5,8])choices.push({shift,extra,score:Math.abs(shift)+extra*3});choices.sort((a,b)=>a.score-b.score);
  for(const choice of choices){const at=s+choice.shift;if(at<5||at>r.len-5)continue;const p=roadPoint(r,at),index=idxAt(r,at),hw=dhakaExitWidth(r,index)/2,off=hw+hx+1+choice.extra,fx=p.tx*dir,fz=p.tz*dir,x=p.x+fz*off,z=p.z-fx*off,yaw=Math.atan2(fx,fz),radius=Math.hypot(hx,hz);
    if(roadsideReservedAt(x,z,radius+.6)||!roadsideStaticClear(x,z,radius)||!roadsideFootprintClear(x,z,hx,hz,yaw))continue;
    return {x,z,s:at,yaw,hx,hz,kind};
  }
  return null;
}
function roadsideGroundY(x,z){return dhakaContains(x,z)?Math.max(surfaceY(x,z),dhakaHeight(x,z)+.13):surfaceY(x,z);}
function reportRoadsidePlacement(){
  const cv=document.getElementById('gl'),bad=ROADSIDE.sites.filter(p=>!roadsideFootprintClear(p.x,p.z,p.hx,p.hz,p.yaw,.7));
  cv.dataset.roadsideStops=ROADSIDE.stops.length;cv.dataset.roadsideSignals=ROADSIDE.signals.length;cv.dataset.roadsideRoadOverlaps=bad.length;
}

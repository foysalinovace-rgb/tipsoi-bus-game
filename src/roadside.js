// Place the entire fixture footprint outside every nearby carriageway.
const ROADSIDE={sites:[],grid:new Map(),signals:[],stops:[]};
function roadsideRoadAt(x,z,gap=0){
  const ci=Math.floor((x+W/2)/BK),cj=Math.floor((z+H/2)/BK);
  for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){const bucket=BUCKETS.get(bkey(i,j));if(!bucket)continue;
    for(let k=0;k<bucket.length;k+=2){const r=RD[bucket[k]],s=bucket[k+1],p=ruralSegmentDistance(x,z,{x:r.xs[s],z:r.zs[s]},{x:r.xs[s+1],z:r.zs[s+1]}),hw=(dhakaExitWidth(r,s)*(1-p.t)+dhakaExitWidth(r,s+1)*p.t)/2;
      if(p.d<hw+gap)return true;
    }
  }
  return !!raAt(x,z,gap);
}
function roadsideReservedAt(x,z,padding=0){const list=ROADSIDE.grid.get(Math.floor(x/64)+','+Math.floor(z/64))||[];return list.some(p=>Math.hypot(x-p.x,z-p.z)<p.radius+padding);}
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

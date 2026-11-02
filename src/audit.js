// Shared placement rules and read-only diagnostics for the complete game world.
const GAME_AUDIT={billboards:{legacyPositions:0,legacyRoadOverlaps:0,relocated:0,omitted:0},roads:null};
function billboardRoadOverlap(p,hx=8.8,hz=.5){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);for(let i=-hx;i<=hx+.01;i+=hx/8)for(const j of [-hz,0,hz])if(roadsideRoadAt(p.x+c*i+s*j,p.z-s*i+c*j,1))return true;return false;}
function billboardPlacementClear(p){
  if(dhakaContains(p.x,p.z,12)||!roadsideFootprintClear(p.x,p.z,8.8,.5,p.yaw,1.5)||roadsideReservedAt(p.x,p.z,9)||!roadsideStaticFootprintClear(p.x,p.z,8.8,.5,p.yaw,1))return false;
  const n=nearestRoad(p.x,p.z,1);if(siteBlocksPoint(n,p.x,p.z))return false;
  return Math.abs(heightAt(p.x+Math.cos(p.yaw)*6.4,p.z-Math.sin(p.yaw)*6.4)-heightAt(p.x-Math.cos(p.yaw)*6.4,p.z+Math.sin(p.yaw)*6.4))<1.5;
}
function planSafeBillboards(){
  const places=[],stats=GAME_AUDIT.billboards;stats.legacyPositions=stats.legacyRoadOverlaps=stats.relocated=stats.omitted=0;
  for(const [ri,r] of RD.entries()){
    if(r.narrow||r.dhaka)continue;let slot=0;
    for(let distance=90;distance<r.len-50;distance+=240,slot++){
      const p=roadPoint(r,distance),side=slot%2?1:-1,legacy={x:p.x+p.tz*side*(r.hw+10),z:p.z-p.tx*side*(r.hw+10),yaw:Math.atan2(p.tx,p.tz)+.14*side};
      if(!dhakaContains(legacy.x,legacy.z,10)&&!isWater(legacy.x,legacy.z)){stats.legacyPositions++;if(billboardRoadOverlap(legacy))stats.legacyRoadOverlaps++;}
      let chosen=null;
      for(const along of [0,-24,24]){const at=Math.max(30,Math.min(r.len-30,distance+along)),q=roadPoint(r,at),hw=dhakaExitWidth(r,q.i)/2;
        for(const off of [12,20,30,44,56]){const site={x:q.x+q.tz*side*(hw+off),z:q.z-q.tx*side*(hw+off),tx:q.tx,tz:q.tz,yaw:Math.atan2(q.tx,q.tz)+.14*side,ad:(ri+slot)%3};
          if(places.some(a=>Math.hypot(a.x-site.x,a.z-site.z)<30)||!billboardPlacementClear(site))continue;site.y=heightAt(site.x,site.z);chosen=site;break;
        }if(chosen)break;
      }
      if(chosen){if(Math.hypot(chosen.x-legacy.x,chosen.z-legacy.z)>3)stats.relocated++;places.push(chosen);}else stats.omitted++;
    }
  }
  return places;
}
function collectGameAudit(){
  let invalid=0,zero=0,maxGrade=0,segments=0;const steep=[];
  for(const r of RD)for(let i=1;i<r.N;i++){segments++;const length=Math.hypot(r.xs[i]-r.xs[i-1],r.zs[i]-r.zs[i-1]),grade=Math.abs(r.ys[i]-r.ys[i-1])/Math.max(.001,length);if(!Number.isFinite(length+grade+r.tx[i]+r.tz[i]))invalid++;if(length<.01)zero++;maxGrade=Math.max(maxGrade,grade);if(grade>.2)steep.push({road:r.name,grade:+grade.toFixed(3),location:toLL(r.xs[i],r.zs[i]).map(v=>+v.toFixed(4))});}
  const boardOverlaps=TIPSOI_BOARDS.locations.filter(p=>billboardRoadOverlap(p)).length,cityOverlaps=DHAKA.adSites.filter(p=>billboardRoadOverlap(p,4.4,.35)).length;
  GAME_AUDIT.roads={roads:RD.length,segments,invalid,zeroLength:zero,maxGrade:+maxGrade.toFixed(3),steepSegments:steep.length,steepest:steep.sort((a,b)=>b.grade-a.grade).slice(0,3)};
  const snapshot={roads:GAME_AUDIT.roads,billboards:{...GAME_AUDIT.billboards,placed:TIPSOI_BOARDS.locations.length,roadOverlaps:boardOverlaps,cityBoards:DHAKA.adSites.length,cityRoadOverlaps:cityOverlaps},roadside:{stops:ROADSIDE.stops.length,signals:ROADSIDE.signals.length,roadOverlaps:ROADSIDE.sites.filter(p=>!roadsideFootprintClear(p.x,p.z,p.hx,p.hz,p.yaw,.55)).length},metro:{trains:DHAKA_METRO.trains.length,stations:DHAKA_METRO.stations.length,terminals:DHAKA_METRO.stations.filter(s=>s.terminal).length,piers:DHAKA.metro,entrances:DHAKA_METRO.entrances.length}};
  document.getElementById('gl').dataset.audit=JSON.stringify(snapshot);return snapshot;
}

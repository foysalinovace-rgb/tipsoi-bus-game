const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');

const source = fs.readFileSync('src/reference.html', 'utf8');
const world = source.slice(source.indexOf('const BD_RINGS ='), source.indexOf('// ---------- grids built at load ----------'));
const context = { console, assert };
vm.createContext(context);
vm.runInContext(world, context);
vm.runInContext(`
function cityByName(name) { return CITY.find(c => c.en === name); }
const original = RD.map(r => ({ xs: Array.from(r.xs), zs: Array.from(r.zs) }));
`, context);
const rural = fs.readFileSync('src/rural.js', 'utf8');
vm.runInContext(rural.slice(rural.indexOf('function ruralSegmentDistance'), rural.indexOf('function ruralGround')), context);
vm.runInContext(fs.readFileSync('src/dhaka.js', 'utf8').replace('__DHAKA_LAYOUT__', fs.readFileSync('src/dhaka-layout.json', 'utf8')), context);
vm.runInContext(`
installDhakaRoads();
assert.equal(DHAKA.originalRoads, original.length);
assert.equal(DHAKA.roads.length, 32);
assert.equal(DHAKA.roads.find(r=>r.axis==='ring').w,24);
assert(DHAKA.roads.filter(r=>r.axis==='link').every(r=>r.w===28),'City highway links must be 28 metres wide');
assert(DHAKA.gates.length>0,'Highway exit crossings missing');
assert(dhakaRoadIsFlatLand({wet:[0],br:[0]},0));
assert(!dhakaRoadIsFlatLand({wet:[0],br:[2.5]},0),'Dry bridge approach must retain its ramp height');
assert(!dhakaRoadIsFlatLand({wet:[1],br:[4.5]},0),'Bridge deck must not be flattened');
for(const g of DHAKA.gates){const r=RD[g.ri];let i=0;for(let j=1;j<r.N;j++)if(Math.abs(r.cum[j]-g.s)<Math.abs(r.cum[i]-g.s))i=j;assert.equal(dhakaExitWidth(r,i),28,'Gateway flare not widened');assert(roadEntranceClearance(g.x,g.z,2),'Exit mouth permits trees');}
for(const r of RD)for(const i of [0,r.N-1])assert(roadEntranceClearance(r.xs[i],r.zs[i],3),'Road endpoint permits trees');
const fixture={a:{x:100000,z:100000,y:3},b:{x:100080,z:100000,y:5},hw:14,aw:14,bw:7,road:RD[0]};
roadClearanceIndex(DHAKA.exitGrid,fixture);
assert.equal(dhakaExitAt(100040,100010).y,4,'Widened lane height interpolation failed');
assert.equal(dhakaExitAt(100040,100011),null,'Widened lane collision spills past its taper');
DHAKA.exitGrid.clear();
for (let i = 0; i < original.length; i++) {
  assert.deepEqual(Array.from(RD[i].xs), original[i].xs, 'Existing road X changed');
  assert.deepEqual(Array.from(RD[i].zs), original[i].zs, 'Existing road Z changed');
}
for (const r of DHAKA.roads) {
  assert(r.w >= 14, 'Road is too narrow for the existing bus');
  for (let i = 0; i < r.N; i++) assert(dhakaContains(r.xs[i], r.zs[i]), 'Road escaped Dhaka');
}
for (const c of CITY.filter(c => c.en !== 'Dhaka')) assert(!dhakaContains(c.x, c.z), c.en + ' included in the city patch');
for (const row of DHAKA.rows) for (const col of DHAKA.cols) {
  const n = dhakaNearest(DHAKA.cx + col * 70, DHAKA.cz + 180 - row * 52);
  assert(n && n.d < .01, 'Disconnected district crossing');
}
// The ring, all avenues/streets, and highway connectors must form one network.
function touching(a, b) {
  for (let i = 1; i < a.N; i++) for (let j = 1; j < b.N; j++) {
    const ax=a.xs[i-1], az=a.zs[i-1], bx=a.xs[i], bz=a.zs[i];
    const cx=b.xs[j-1], cz=b.zs[j-1], dx=b.xs[j], dz=b.zs[j];
    const ux=bx-ax, uz=bz-az, vx=dx-cx, vz=dz-cz, cross=ux*vz-uz*vx;
    if (Math.abs(cross) > .00001) {
      const t=((cx-ax)*vz-(cz-az)*vx)/cross, u=((cx-ax)*uz-(cz-az)*ux)/cross;
      if(t>=-.001 && t<=1.001 && u>=-.001 && u<=1.001) return true;
    }
    if (ruralSegmentDistance(ax,az,{x:cx,z:cz},{x:dx,z:dz}).d<.02) return true;
  }
  return false;
}
const seen=new Set([0]), queue=[0];
while(queue.length) { const i=queue.shift(); for(let j=0;j<DHAKA.roads.length;j++) if(!seen.has(j)&&touching(DHAKA.roads[i],DHAKA.roads[j])) {seen.add(j);queue.push(j);} }
assert.equal(seen.size,DHAKA.roads.length,'Disconnected city street or gateway');
console.log('Dhaka checks passed: original road positions, city boundary, bus widths, district crossings and connected street network.');
`, context);

vm.runInContext(source.slice(source.indexOf('// road spatial buckets'),source.indexOf('function nearestRoad')),context);
vm.runInContext(source.match(/function idxAt\(r, s\) \{[^\n]+/)[0],context);
vm.runInContext(source.slice(source.indexOf('function roadPoint(r, s)'),source.indexOf('const _fx =')),context);
vm.runInContext('const STATICS=[]; function isWater(){return false;} function maskAt(){return 160;} function raAt(){return null;}',context);
vm.runInContext(fs.readFileSync('src/roadside.js','utf8'),context);
vm.runInContext(`
for(const g of DHAKA.gates){
  const r=RD[g.ri],p=roadPoint(r,g.s),oldX=p.x+p.tz*(r.hw+1.1),oldZ=p.z-p.tx*(r.hw+1.1);
  assert(!roadsideFootprintClear(oldX,oldZ,.5,.5,Math.atan2(p.tx,p.tz)),'Old signal location should overlap a widened exit');
  for(const kind of ['signal','stop'])for(const dir of [-1,1]){
    const site=findRoadsideSite(r,g.s,dir,kind);assert(site,'No safe roadside location found');
    assert(roadsideFootprintClear(site.x,site.z,site.hx,site.hz,site.yaw),'Fixture overlaps highway flare');
    reserveRoadsideSite(site);
    assert(roadsideReservedAt(site.x,site.z),'Roadside reservation was not spatially indexed');
  }
}
const avenue=DHAKA.roads.find(r=>r.axis==='avenue'&&r.index===0),crossing=180-7*52+465;
const shelter=findRoadsideSite(avenue,crossing,1,'stop');assert(shelter,'Intersection shelter could not be relocated');
assert(Math.abs(shelter.s-crossing)>7,'Shelter stayed in intersecting traffic lanes');
assert(roadsideFootprintClear(shelter.x,shelter.z,shelter.hx,shelter.hz,shelter.yaw));
console.log('Roadside checks passed: both traffic directions, widened exits, full shelter footprints and crossing-road clearance.');
`,context);

context.document={getElementById:()=>({dataset:{}})};
vm.runInContext(fs.readFileSync('src/markets.js','utf8'),context);
vm.runInContext(`
function addStaticBox(x,z,hx,hz,yaw){STATICS.push({x,z,hx,hz,c:Math.cos(yaw),s:Math.sin(yaw),box:true});}
const marketWalks=[];
for(const r of DHAKA.roads.filter(r=>r.axis==='avenue'||r.axis==='street'))for(let i=1;i<r.N;i+=2)for(const side of [-1,1]){
  const x=(r.xs[i-1]+r.xs[i])/2+r.tz[i]*side*(r.hw+2),z=(r.zs[i-1]+r.zs[i])/2-r.tx[i]*side*(r.hw+2);
  marketWalks.push({x,z,y:0,w:4,d:r.cum[i]-r.cum[i-1],yaw:Math.atan2(r.tx[i],r.tz[i]),side});
}
registerMarketWalks(marketWalks);
assert(FOOTPATH_MARKET.sites.length>30,'Footpaths were not populated');
assert.equal(new Set(FOOTPATH_MARKET.sites.map(p=>p.kind)).size,3,'Missing a seller category');
assert(marketReservedAt(FOOTPATH_MARKET.sites[0].cx,FOOTPATH_MARKET.sites[0].cz),'Market reservation was not spatially indexed');
for(const p of FOOTPATH_MARKET.sites)assert(roadsideFootprintClear(p.cx,p.cz,p.hx,p.hz,p.yaw,.55),'Market site enters a traffic lane');
for(const side of [-1,1])for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const walk={x:0,z:0,y:0,w:4,d:12,yaw,side},site=marketFootprint(walk);
  for(let role=0;role<3;role++)for(let time=0;time<=20;time+=.1){
    const pose=marketShopperPose(time,0,role),x=site.x+Math.cos(site.yaw)*pose.lx+Math.sin(site.yaw)*pose.lz,z=site.z-Math.sin(site.yaw)*pose.lx+Math.cos(site.yaw)*pose.lz;
    const u=x*Math.cos(yaw)-z*Math.sin(yaw),v=x*Math.sin(yaw)+z*Math.cos(yaw);
    assert(Math.abs(u)+.4<walk.w/2,'Shopper walks off the footpath');assert(Math.abs(v)+.4<walk.d/2,'Shopper leaves the reserved sidewalk section');
  }
}
assert(marketShopperPose(7,0,1).bag,'Buyer does not carry a purchase after shopping');
assert.notEqual(marketShopperPose(0,0,1).lz,marketShopperPose(10,0,1).lz,'Buyer animation is stationary');
const wallX=100000,wallZ=100000;
STATICS.push({x:wallX,z:wallZ,hx:1,hz:8,c:1,s:0,box:true});
assert(roadsideStaticFootprintClear(wallX-2.65,wallZ,1.4,2.6,0),'Valid narrow sidewalk site rejected');
assert(!roadsideStaticFootprintClear(wallX-2.35,wallZ,1.4,2.6,0),'Van overlaps a shop wall');
STATICS.push({x:wallX+100,z:wallZ,hx:1,hz:8,c:0,s:1,box:true});
assert(roadsideStaticFootprintClear(wallX+100,wallZ+2.65,1.4,2.6,Math.PI/2),'Rotated sidewalk footprint rejected');
const outsideRoad=RD.findIndex(r=>r.id==='N3'),bazaar={ri:outsideRoad,s0:1900,s1:1990,built:{}},beforeBazaar=FOOTPATH_MARKET.sites.length;
registerBazaarMarkets(bazaar);assert(FOOTPATH_MARKET.sites.length>beforeBazaar,'Bazaars outside Dhaka have no van stalls');
const once=FOOTPATH_MARKET.sites.length;registerBazaarMarkets(bazaar);assert.equal(FOOTPATH_MARKET.sites.length,once,'Bazaar rebuild duplicated stalls');
console.log('Market checks passed: all three seller types, traffic clearance and shoppers staying on both sides of rotated footpaths.');
`,context);

vm.runInContext(fs.readFileSync('src/metro.js','utf8'),context);
vm.runInContext(`
planMetroService();
const metro=DHAKA_METRO,nose=((metro.cars-1)*metro.carPitch+metro.carLength)/2;
assert(metro.stations[0].terminal&&metro.stations.at(-1).terminal,'Line endpoints need terminal stations');
assert(metro.stations[0].z-metro.stations[0].length/2<=metro.lo,'Northern deck ends outside its terminal');
assert(metro.stations.at(-1).z+metro.stations.at(-1).length/2>=metro.hi,'Southern deck ends outside its terminal');
assert(metro.trackX*2>2.55+.8,'Opposing trains do not have clearance');
assert(metroPierPositions().length>10,'Viaduct has no regular ground supports');
for(const z of metroPierPositions())assert(!DHAKA.rows.some(row=>Math.abs(z-(DHAKA.cz+180-row*52))<16),'Metro support blocks a cross street');
for(const station of metro.stations)assert(station.length>nose*2+4,'Train is longer than its platform');
for(const offset of [0,metro.cycle/2]){
  let previous=metroTrainState(0,offset),open=0,moving=0;
  for(let time=.1;time<metro.cycle*2;time+=.1){const state=metroTrainState(time,offset);
    assert(state.z-nose>metro.lo+3&&state.z+nose<metro.hi-3,'Train passes a terminal buffer');
    assert(Math.abs(state.z-previous.z)<=.901,'Train teleports between service phases');
    assert(state.speed>=0&&state.speed<=9.001,'Invalid metro speed');
    if(state.door>.01){assert.equal(state.speed,0,'Doors open while moving');assert(state.station>=0,'Doors open away from a station');open++;}
    if(state.speed>1)moving++;previous=state;
  }
  assert(open>0&&moving>0,'Service must stop with doors open and also travel');
}
for(const leg of metro.schedule){const a=metroTrainState(leg.start-.00001),b=metroTrainState(leg.start+.00001);assert(Math.abs(a.z-b.z)<.001,'Discontinuous station arrival or cycle wrap');}
console.log('Metro checks passed: two covered terminals, train/platform clearance, continuous journeys, station stops and door interlocks.');
`,context);

vm.runInContext(source.slice(source.indexOf('function nearestRoad'),source.indexOf('// ---------- build step 1:')),context);
vm.runInContext('function siteBlocksPoint(){return false;} function heightAt(){return 0;}',context);
vm.runInContext(fs.readFileSync('src/audit.js','utf8'),context);
vm.runInContext(`
const safeBoards=planSafeBillboards();assert(safeBoards.length>300,'Most highway branding disappeared');
assert(safeBoards.every(p=>!billboardRoadOverlap(p)),'Billboard frame crosses a road');
const crossRoad=DHAKA.roads.find(r=>r.axis==='street'&&r.index===0);
assert(billboardRoadOverlap({x:DHAKA.cx,z:crossRoad.zs[0],yaw:0}),'Road-centred billboard was not rejected');
assert(GAME_AUDIT.billboards.legacyRoadOverlaps>0,'Legacy billboard regression fixture missing');
console.log('Billboard checks passed: complete panel footprint, junctions, widened exits and safe placement across the road network.');
`,context);
vm.runInContext(fs.readFileSync('src/runtime.js','utf8'),context);
vm.runInContext(`
assert.equal(runtimeScaleFor(1,35,2),.9);assert.equal(runtimeScaleFor(.5,20,2),.5);assert.equal(runtimeScaleFor(1,60,2),1);assert.equal(runtimeScaleFor(.85,20,1),.85);
`,context);
vm.runInContext(fs.readFileSync('src/rural.js','utf8').match(/function farmWorkerY[^\n]+/)[0],context);
vm.runInContext(`
const worker={plot:{length:40},heights:Array.from({length:17},(_,i)=>2+i*.125)};
for(let i=-100;i<=100;i++){const u=i/100*13.6,y=farmWorkerY(worker,u);assert(Number.isFinite(y)&&y>=2&&y<=4,'Invalid cached farmer height');}
assert.equal(farmWorkerY(worker,-100),2);assert.equal(farmWorkerY(worker,100),4);
console.log('Runtime checks passed: adaptive resolution limits and cached farmer path heights.');
`,context);

const html = fs.readFileSync('dist/index.html', 'utf8');
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new vm.Script(match[1]);
assert(html.includes('if (r.dhaka) return false;'), 'City road vehicle exclusion missing');
console.log('Generated scripts parse.');

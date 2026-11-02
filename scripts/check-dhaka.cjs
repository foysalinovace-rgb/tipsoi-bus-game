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
  }
}
const avenue=DHAKA.roads.find(r=>r.axis==='avenue'&&r.index===0),crossing=180-7*52+465;
const shelter=findRoadsideSite(avenue,crossing,1,'stop');assert(shelter,'Intersection shelter could not be relocated');
assert(Math.abs(shelter.s-crossing)>7,'Shelter stayed in intersecting traffic lanes');
assert(roadsideFootprintClear(shelter.x,shelter.z,shelter.hx,shelter.hz,shelter.yaw));
console.log('Roadside checks passed: both traffic directions, widened exits, full shelter footprints and crossing-road clearance.');
`,context);

const html = fs.readFileSync('dist/index.html', 'utf8');
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new vm.Script(match[1]);
assert(html.includes('if (r.dhaka) return false;'), 'City road vehicle exclusion missing');
console.log('Generated scripts parse.');

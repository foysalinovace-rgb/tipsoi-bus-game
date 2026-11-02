// Procedural architectural and botanical detail, shared by instanced scenery.
const TIPSOI_SCENERY={roof:null,tank:null,ac:null,cell:''};
function sceneryTexture(draw,size=256){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function detailNoise(g,s,seed,amount=1400){for(let i=0;i<amount;i++){const x=hash2(i+seed,3)*s,y=hash2(i+seed,7)*s;g.fillStyle=i%2?'rgba(45,39,30,.045)':'rgba(255,255,245,.08)';g.fillRect(x,y,1+hash2(i,9)*3,1+hash2(i,11)*5);}}
function tipsoiBuildingMaterial(){
  const facade=sceneryTexture((g,s)=>{
    g.fillStyle='#bdb8ad';g.fillRect(0,0,s,s);detailNoise(g,s,71,2600);
    g.fillStyle='#9a968e';g.fillRect(0,247,256,9);g.fillStyle='#dedbd3';g.fillRect(0,240,256,7);
    g.fillStyle='rgba(42,39,33,.18)';g.fillRect(28,49,204,161);
    g.fillStyle='#d7d3c8';g.fillRect(26,38,204,159);g.fillStyle='#303c44';g.fillRect(35,47,186,140);
    const glass=g.createLinearGradient(35,47,221,187);glass.addColorStop(0,'#657d88');glass.addColorStop(.45,'#354a56');glass.addColorStop(1,'#20303a');g.fillStyle=glass;g.fillRect(40,52,176,130);
    g.fillStyle='#9b978b';g.fillRect(124,47,7,140);g.fillRect(35,111,186,5);
    g.fillStyle='rgba(193,210,213,.18)';g.beginPath();g.moveTo(45,52);g.lineTo(90,52);g.lineTo(210,182);g.lineTo(165,182);g.fill();
    g.fillStyle='#d4d0c5';g.fillRect(23,190,211,10);g.fillStyle='rgba(41,36,28,.15)';g.fillRect(27,201,204,8);
    g.fillStyle='rgba(59,54,43,.12)';for(let i=0;i<8;i++)g.fillRect(35+i*25,205,2,12+hash2(i,1)*22);
  });
  const roof=sceneryTexture((g,s)=>{g.fillStyle='#aaa79f';g.fillRect(0,0,s,s);detailNoise(g,s,321,4000);g.strokeStyle='#8b8880';g.lineWidth=2;g.strokeRect(1,1,s-2,s-2);g.beginPath();g.moveTo(0,s/2);g.lineTo(s,s/2);g.moveTo(s/2,0);g.lineTo(s/2,s);g.stroke();});
  const materials=[new THREE.MeshLambertMaterial({map:facade}),new THREE.MeshLambertMaterial({map:roof})];
  materials.forEach(m=>{m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_INSTANCING
vec3 buildingScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
if(abs(normal.y)>.5){vUv=uv*buildingScale.xz/6.0;}else{vUv=uv*vec2(abs(normal.x)>.5?buildingScale.z:buildingScale.x,buildingScale.y)/3.2;}
#endif`);};m.customProgramCacheKey=()=> 'tipsoi-facade-world-uv-v1';});return materials;
}
function combineSceneryGeometries(list){const p=[],n=[],uv=[];for(const geometry of list){const g=geometry.index?geometry.toNonIndexed():geometry;for(const v of g.attributes.position.array)p.push(v);for(const v of g.attributes.normal.array)n.push(v);for(const v of g.attributes.uv.array)uv.push(v);}const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(p,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return out;}
function tipsoiTrunkGeometry(){
  const main=new THREE.CylinderGeometry(.13,.26,1,9,3);main.translate(0,.5,0);const parts=[main];
  for(let i=0;i<4;i++){const b=new THREE.CylinderGeometry(.025,.09,.46,5);b.rotateZ(.64);b.translate(-.13,.72,0);b.rotateY(i*2.399);parts.push(b);}return combineSceneryGeometries(parts);
}
function tipsoiBarkMaterial(){return new THREE.MeshLambertMaterial({map:sceneryTexture((g,s)=>{g.fillStyle='#c8b6a0';g.fillRect(0,0,s,s);for(let i=0;i<95;i++){const x=hash2(i,51)*s;g.strokeStyle=i%2?'#a88e73':'#e3d1b5';g.lineWidth=1+hash2(i,3)*3;g.beginPath();g.moveTo(x,0);for(let y=0;y<=s;y+=16)g.lineTo(x+Math.sin(y*.04+i)*3,y);g.stroke();}detailNoise(g,s,811);})});}
function tipsoiLeafTexture(){return sceneryTexture((g,s)=>{
  g.clearRect(0,0,s,s);
  for(let i=0;i<140;i++){const a=hash2(i,51)*Math.PI*2,r=Math.sqrt(hash2(i,81))*.44*s,x=s/2+Math.cos(a)*r,y=s/2+Math.sin(a)*r;
    g.save();g.translate(x,y);g.rotate(a+hash2(i,91));const l=9+hash2(i,4)*15;g.fillStyle=['#d6dfbd','#a9c48f','#e1e7ca','#91b278','#b9d19c'][i%5];g.beginPath();g.ellipse(0,0,l,l*.35,0,0,Math.PI*2);g.fill();g.strokeStyle='rgba(57,78,37,.28)';g.lineWidth=.7;g.beginPath();g.moveTo(-l,0);g.lineTo(l,0);g.stroke();g.restore();}
});}
function tipsoiCanopyGeometry(){
  const parts=[];for(let i=0;i<32;i++){const a=i*2.39996,y=1-2*(i+.5)/32,r=Math.sqrt(1-y*y),radius=.62+.18*hash2(i,31);const p=new THREE.PlaneGeometry(.7+.22*hash2(i,3),.66+.2*hash2(i,7));p.rotateY(a);p.rotateX((hash2(i,9)-.5)*1.8);p.translate(Math.cos(a)*r*radius,y*radius,Math.sin(a)*r*radius);parts.push(p);}return combineSceneryGeometries(parts);
}
function tipsoiLeafMaterial(){return new THREE.MeshLambertMaterial({map:tipsoiLeafTexture(),alphaTest:.45,side:THREE.DoubleSide});}
function tipsoiPalmGeometry(){
  const positions=[],uv=[],indices=[];for(let f=0;f<9;f++){const a=f/9*Math.PI*2;for(let j=0;j<=7;j++){const t=j/7,r=t*3.6,y=Math.sin(t*Math.PI)*.7-t*t*.85,w=.16+Math.sin(t*Math.PI)*.64;for(const side of [-1,1]){positions.push(Math.sin(a)*r+Math.cos(a)*w*side,y,Math.cos(a)*r-Math.sin(a)*w*side);uv.push((side+1)/2,t);}if(j<7){const k=f*16+j*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function tipsoiPalmMaterial(){return new THREE.MeshLambertMaterial({side:THREE.DoubleSide,alphaTest:.45,map:sceneryTexture((g,s)=>{g.clearRect(0,0,s,s);g.strokeStyle='#d0d5a5';g.lineWidth=5;g.beginPath();g.moveTo(s/2,0);g.lineTo(s/2,s);g.stroke();for(let k=0;k<26;k++){const y=k/26*s,w=Math.sin((k+.5)/26*Math.PI)*s*.46;for(const side of [-1,1]){g.fillStyle=k%3?'#bed39b':'#e0e6b4';g.beginPath();g.moveTo(s/2,y);g.quadraticCurveTo(s/2+side*w*.6,y-12,s/2+side*w,y+26);g.lineTo(s/2,y+8);g.fill();}}})});}
function upgradeTipsoiScenery(){
  const make=(g,m,n)=>{const mesh=new THREE.InstancedMesh(g,m,n);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;};
  TIPSOI_SCENERY.roof=make(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:'#a7a297'}),4096);
  TIPSOI_SCENERY.tank=make(new THREE.CylinderGeometry(.72,.76,1.45,10),new THREE.MeshPhongMaterial({color:'#353a39',shininess:24}),192);
  TIPSOI_SCENERY.ac=make(new THREE.BoxGeometry(1,.55,.45),new THREE.MeshLambertMaterial({color:'#b8b9ae'}),384);
}
function syncTipsoiArchitecture(){
  if(!TIPSOI_SCENERY.roof)return;const roof=TIPSOI_SCENERY.roof,tank=TIPSOI_SCENERY.tank,ac=TIPSOI_SCENERY.ac;let nr=0,nt=0,na=0;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),part=new THREE.Matrix4(),local=new THREE.Vector3(),unit=new THREE.Vector3(1,1,1);
  const buildings=[];for(let i=0;i<bldIM.count;i++){bldIM.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);const distance=Math.hypot(position.x-st.x,position.z-st.z);if(distance<420)buildings.push({i,distance});}
  buildings.sort((a,b)=>a.distance-b.distance);for(const {i,distance} of buildings.slice(0,144)){bldIM.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);const w=scale.x,h=scale.y,d=scale.z;
    const box=(x,y,z,sx,sy,sz)=>{if(nr>=4096)return;local.set(x,y,z).applyQuaternion(rotation).add(position);part.compose(local,rotation,unit.set(sx,sy,sz));roof.setMatrixAt(nr++,part);};
    box(0,h+.35,d/2,w,.7,.18);box(0,h+.35,-d/2,w,.7,.18);box(w/2,h+.35,0,.18,.7,d);box(-w/2,h+.35,0,.18,.7,d);
    if(distance<220)for(let y=3.2;y<h-.8;y+=3.2)box(0,y,0,w+.32,.12,d+.32);
    if(nt<192){local.set(w*.23,h+.85,d*.15).applyQuaternion(rotation).add(position);part.compose(local,rotation,unit.set(1,1,1));tank.setMatrixAt(nt++,part);}
    for(let k=0;k<2&&na<384;k++){local.set((k-.5)*w*.45,Math.min(h-1.2,3.2+k*3.2),d/2+.25).applyQuaternion(rotation).add(position);part.compose(local,rotation,unit.set(1,1,1));ac.setMatrixAt(na++,part);}
  }
  for(const [mesh,count] of [[roof,nr],[tank,nt],[ac,na]]){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;}
  document.getElementById('gl').dataset.detailedBuildings=buildings.length;
}
function tipsoiBillboardClearance(x,z,padding=20){
  if(!TIPSOI_BOARDS.grid)return false;const radius=Math.ceil((padding+65)/64),cx=Math.floor(x/64),cz=Math.floor(z/64);
  // A clear approach corridor protects the face, not just the supporting poles.
  for(let i=-radius;i<=radius;i++)for(let j=-radius;j<=radius;j++){const list=TIPSOI_BOARDS.grid.get((cx+i)+','+(cz+j));if(list)for(const p of list){const dx=x-p.x,dz=z-p.z;if(Math.abs(dx*p.tx+dz*p.tz)<padding+65&&Math.abs(dx*p.tz-dz*p.tx)<padding)return true;}}return false;
}

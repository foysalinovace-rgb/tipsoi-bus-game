const assert=require('assert/strict'),fs=require('fs'),path=require('path'),http=require('http');
const {createGameServer}=require('../serve.cjs');
async function run(){
  const server=createGameServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const port=server.address().port,request=(url,method='GET')=>new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path:url,method},res=>{let length=0;res.on('data',b=>length+=b.length);res.on('end',()=>resolve({status:res.statusCode,length,headers:res.headers}));});req.on('error',reject);req.end();});
  try{
    const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
    const refs=new Set(['/']);for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(?:https?:|data:|\/\/)/.test(m[1]))refs.add('/'+m[1].split('#')[0].replace(/^\//,''));
    for(const file of ['coach_horn.mp3','coach_retarder.wav','helper1.mp3','helper2.mp3'])refs.add('/'+file);
    const css=fs.readFileSync(path.join(__dirname,'../dist/assets/fonts.css'),'utf8');for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))if(!m[1].startsWith('data:'))refs.add('/assets/'+m[1].replace(/^\.\//,''));
    for(const url of refs){const r=await request(url);assert.equal(r.status,200,'Missing local asset: '+url);assert(r.length>0,'Empty asset: '+url);}
    assert.equal((await request('/missing-test-file')).status,404);
    assert.equal((await request('/%E0%A4%A')).status,400);
    assert.equal((await request('/%00')).status,400);
    assert.equal((await request('/%2e%2e/%2e%2e/test.txt')).status,403);
    assert.equal((await request('/','POST')).status,405);
    const head=await request('/','HEAD');assert.equal(head.status,200);assert.equal(head.length,0);
    assert.equal((await request('/')).status,200,'Server died after an invalid URL');
    console.log(`Server checks passed: ${refs.size} page/font/image/audio assets, HEAD, missing files, malformed URLs and continued service.`);
  }finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(e=>{console.error(e);process.exitCode=1;});

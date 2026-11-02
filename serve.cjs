const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav'};
function createGameServer(){return http.createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
  let route;try{route=decodeURIComponent(req.url.split('?')[0]);if(route.includes('\0'))throw Error('Invalid URL');}catch(_){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Bad request');}
  const p=path.resolve(root,'.'+(route==='/'?'/index.html':route));
  if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(p,(err,bytes)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:err?'Not found':bytes);});
});}
if(require.main===module)createGameServer().listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
module.exports={createGameServer};

const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav'};
http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(p,(err,b)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(err?'Not found':b)})}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));

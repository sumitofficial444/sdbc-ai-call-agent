import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {createStore} from './store.js';
import {createApp} from './app.js';
import {attachVoice} from './voice.js';
dotenv.config({path:fileURLToPath(new URL('../.env',import.meta.url))});
const port=Number(process.env.PORT||8080);
const origins=new Set(['http://127.0.0.1:5173','http://localhost:5173',`http://127.0.0.1:${port}`,`http://localhost:${port}`,'https://sdbc-ai-call-agent.vercel.app']);
try{
 const store=await createStore({uri:process.env.MONGODB_URI,mode:process.env.LEAD_STORE||'file'});
 const options={store,key:process.env.GEMINI_API_KEY?.trim()||'',model:process.env.GEMINI_MODEL||'gemini-3.8-live',origins};
 const server=createServer(createApp(options));const wss=attachVoice(server,options);
 server.listen(port,'127.0.0.1',()=>{console.log(`SDBC API: http://127.0.0.1:${port} | Storage: ${store.mode} | Voice: ${options.key?'configured':'key needed'}`);});
 server.on('error',err=>{console.error(`Server failed: ${err.code||'unknown error'}`);process.exit(1);});
 const shutdown=()=>{for(const ws of wss.clients)ws.terminate();wss.close();server.close(async()=>{await store.close();process.exit(0);});};
 process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}catch{console.error('Backend could not start. Check MONGODB_URI or use LEAD_STORE=file with no MongoDB URI.');process.exitCode=1;}

import express from 'express';
import {answer,knowledge,validateLead} from './answers.js';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
export function createApp({store,key='',model='gemini-3.8-live',origins}){
 const app=express();app.disable('x-powered-by');
 // CORS — set headers before any route
 app.use((req,res,next)=>{
  res.set('X-Content-Type-Options','nosniff');
  res.set('Referrer-Policy','no-referrer');
  if(req.path.startsWith('/api/'))res.set('Cache-Control','no-store');
  const origin=req.headers.origin;
  if(origin&&origins.has(origin)){
   res.set('Access-Control-Allow-Origin',origin);
   res.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');
   res.set('Access-Control-Allow-Headers','Content-Type');
   res.set('Vary','Origin');
  }
  if(req.method==='OPTIONS')return res.sendStatus(204); // preflight
  if(origin&&!origins.has(origin))return res.status(403).json({error:'Origin not allowed.'});
  next();
 });
 app.use(express.json({limit:'16kb'}));
 app.get('/',(_,res)=>res.type('html').send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>SDBC AI — Backend</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:system-ui,sans-serif;color:#f8fafc}.card{text-align:center;padding:2.5rem 3rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:1.5rem;backdrop-filter:blur(10px)}.dot{display:inline-block;width:12px;height:12px;background:#22c55e;border-radius:50%;margin-right:.5rem;animation:pulse 2s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}h1{margin:.5rem 0;font-size:1.8rem;font-weight:700}p{color:#94a3b8;margin:.5rem 0}a{color:#818cf8;text-decoration:none}</style></head><body><div class="card"><span class="dot"></span><h1>Backend is running ✅</h1><p>SDBC AI Call Agent — API Server</p><p><a href="/api/health">/api/health →</a></p></div></body></html>`));
 app.get('/api/health',(_,res)=>res.json({status:'ok',voiceConfigured:!!key,model,storage:store.mode,remoteStorage:store.remote}));
 app.get('/api/knowledge',(_,res)=>res.json(knowledge));
 app.post('/api/chat',(req,res)=>{
  if(typeof req.body?.text!=='string'||!req.body.text.trim()||req.body.text.length>1500)return res.status(400).json({error:'Provide a question of 1–1500 characters.'});
  const history=req.body.history??[];
  if(!Array.isArray(history)||history.length>6||history.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.text!=='string'||m.text.length>1000))return res.status(400).json({error:'Invalid conversation context.'});
  res.json({answer:answer(req.body.text,history),mode:'guided-demo',source:knowledge.source});
 });
 app.get('/api/leads',async(_,res)=>res.json(await store.list()));
 app.post('/api/leads',async(req,res)=>{const input=validateLead(req.body);if(!input)return res.status(400).json({error:'Name, valid Indian mobile, listed course and explicit consent are required.'});const lead=await store.add(input);res.status(201).json({id:lead.id,message:`Enquiry saved to ${store.mode==='mongodb'?'configured MongoDB':'this device'}. College has not been notified.`});});
 const dist=fileURLToPath(new URL('../../frontend/dist/',import.meta.url));
 if(existsSync(dist)){app.use(express.static(dist));app.get('/{*path}',(req,res,next)=>{if(req.path.startsWith('/api/')||req.path==='/voice')return next();res.sendFile(dist+'index.html');});}
 app.use((_,res)=>res.status(404).json({error:'Not found.'}));
 app.use((err,req,res,next)=>{if(res.headersSent)return next(err);const status=err.status===413?413:err.type==='entity.parse.failed'?400:503;res.status(status).json({error:status===503?'Storage unavailable. Check backend database connection.':'Invalid or oversized request.'});});
 return app;
}

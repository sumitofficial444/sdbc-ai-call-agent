import {WebSocket,WebSocketServer} from 'ws';
import {counsellorInstructions} from './counsellor.js';
export function attachVoice(server,{key,model='gemini-3.8-live',origins}){
 const wss=new WebSocketServer({noServer:true,maxPayload:65536});
 server.on('upgrade',(req,socket,head)=>{
  if(req.url!=='/voice'||!origins.has(req.headers.origin)){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  if(wss.clients.size>=3){socket.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
 });
 wss.on('connection',browser=>{
  let upstream,ready=false,ended=false;const timers=[];
  const send=data=>{if(browser.readyState===WebSocket.OPEN)browser.send(typeof data==='string'?data:JSON.stringify(data));};
  const cleanup=()=>{ended=true;timers.forEach(clearTimeout);if(upstream&&upstream.readyState!==WebSocket.CLOSED)upstream.terminate();};
  const fail=message=>{if(ended)return;send({error:message});cleanup();browser.close(1011,'Voice session ended');};
  browser.on('close',cleanup);browser.on('error',cleanup);
  if(!key){fail('GEMINI_API_KEY is missing. Use the guided text demo.');return;}
  upstream=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent',{headers:{'x-goog-api-key':key},handshakeTimeout:15000,maxPayload:4*1024*1024});
  timers.push(setTimeout(()=>{if(!ready)fail('Gemini setup timed out. Check model access, key and quota.');},20000));
  // Bound each demo call so an abandoned browser cannot consume an open-ended session.
  timers.push(setTimeout(()=>fail('The 10-minute demo session ended. Start a new conversation to continue.'),10*60*1000));
  upstream.on('open',()=>{
   if(ended)return;
   const instructions=counsellorInstructions();
   upstream.send(JSON.stringify({setup:{model:`models/${model}`,generationConfig:{responseModalities:['AUDIO']},systemInstruction:{parts:[{text:instructions}]},inputAudioTranscription:{},outputAudioTranscription:{}}}));
  });
  upstream.on('message',data=>{
   if(ended)return;
   try{const event=JSON.parse(data.toString());if(event.error){fail('Gemini rejected the session. Check your API key, model access and available quota.');return;}if(event.setupComplete){ready=true;upstream.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'Start the session with your brief AI introduction and one education-stage question, in natural Hinglish.'}]}],turnComplete:true}}));}send(event);}catch{fail('Received an invalid voice response.');}
  });
  upstream.on('error',()=>fail('Could not connect to Gemini. Check network, API key and model access.'));
  upstream.on('close',()=>{if(!ended)fail('Gemini closed the voice session. Start a new conversation to reconnect.');});
  browser.on('message',(data,isBinary)=>{
   if(!ready||ended||isBinary)return;
   try{
    const msg=JSON.parse(data.toString()),input=msg.realtimeInput;
    if(Object.keys(msg).length!==1||!input||typeof input!=='object'||Object.keys(input).length!==1)return;
    let safe;
    if(input.audioStreamEnd===true)safe={audioStreamEnd:true};
    else if(input.audio&&typeof input.audio.data==='string'&&input.audio.data.length<=60000&&/^[A-Za-z0-9+/]*={0,2}$/.test(input.audio.data)&&/^audio\/pcm;rate=(16000|24000|44100|48000|96000)$/.test(input.audio.mimeType))safe={audio:{data:input.audio.data,mimeType:input.audio.mimeType}};
    if(safe&&upstream.readyState===WebSocket.OPEN&&upstream.bufferedAmount<256*1024)upstream.send(JSON.stringify({realtimeInput:safe}));
   }catch{browser.close(1007,'Invalid input');}
  });
 });
 return wss;
}

export class VoiceSession {
  constructor(onEvent) { this.onEvent = onEvent; this.nodes = new Set(); this.stopped = false; this.nextTime = 0; }
  async start() {
    this.context = new AudioContext(); await this.context.resume();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(this.stopped){this.stop();return;}
      await this.context.audioWorklet.addModule('/capture-worklet.js');
      await new Promise((resolve,reject)=>{
        this.ws = new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/voice`);
        const timer=setTimeout(()=>reject(new Error('Voice setup timed out. Check backend and Gemini access.')),20000);
        this.ws.onerror=()=>{clearTimeout(timer);reject(new Error('Cannot connect to voice backend.'));};
        this.ws.onclose=()=>{clearTimeout(timer);if(!this.ready)reject(new Error('Voice connection closed.'));if(!this.stopped)this.onEvent({closed:true});this.stop();};
        this.ws.onmessage=e=>{
          const msg=JSON.parse(e.data);
          if(msg.error){clearTimeout(timer);reject(new Error(typeof msg.error==='string'?msg.error:'Gemini rejected the session. Check model access and quota.'));this.onEvent({error:typeof msg.error==='string'?msg.error:'Gemini session error'});return;}
          if(msg.setupComplete){clearTimeout(timer);this.ready=true;resolve();}
          const c=msg.serverContent;
          if(c?.interrupted)this.clearAudio();
          for(const p of c?.modelTurn?.parts||[])if(p.inlineData?.data)this.play(p.inlineData.data);
          if(c?.inputTranscription?.text)this.onEvent({role:'user',text:c.inputTranscription.text});
          if(c?.outputTranscription?.text)this.onEvent({role:'assistant',text:c.outputTranscription.text});
          if(c?.turnComplete||c?.interrupted)this.onEvent({turnComplete:true});
        };
      });
      if(this.stopped)return;
      this.source=this.context.createMediaStreamSource(this.stream);
      this.capture=new AudioWorkletNode(this.context,'pcm-capture');
      this.silent=this.context.createGain();this.silent.gain.value=0;
      this.source.connect(this.capture);this.capture.connect(this.silent);this.silent.connect(this.context.destination);
      this.capture.port.onmessage=({data})=>{
        if(this.ws?.readyState!==WebSocket.OPEN||this.ws.bufferedAmount>65536)return;
        const bytes=new Uint8Array(data);let raw='';for(const b of bytes)raw+=String.fromCharCode(b);
        this.ws.send(JSON.stringify({realtimeInput:{audio:{data:btoa(raw),mimeType:`audio/pcm;rate=${this.context.sampleRate}`}}}));
      };
    } catch(e){this.stop();throw e;}
  }
  play(base64){
    if(this.stopped)return;
    const raw=atob(base64),view=new DataView(new ArrayBuffer(raw.length));for(let i=0;i<raw.length;i++)view.setUint8(i,raw.charCodeAt(i));
    const buffer=this.context.createBuffer(1,Math.floor(raw.length/2),24000),samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(i*2,true)/32768;
    const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.context.destination);
    this.nodes.add(node);node.onended=()=>this.nodes.delete(node);
    const start=Math.max(this.context.currentTime+0.03,this.nextTime);node.start(start);this.nextTime=start+buffer.duration;
  }
  mute(value){this.stream?.getAudioTracks().forEach(t=>{t.enabled=!value;});if(value&&this.ws?.readyState===1)this.ws.send(JSON.stringify({realtimeInput:{audioStreamEnd:true}}));}
  clearAudio(){for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();this.nextTime=0;}
  stop(){this.stopped=true;this.ready=false;this.clearAudio();this.stream?.getTracks().forEach(t=>t.stop());this.source?.disconnect();this.capture?.disconnect();if(this.capture)this.capture.port.onmessage=null;this.silent?.disconnect();this.ws?.close();if(this.context&&this.context.state!=='closed')this.context.close().catch(()=>{});}
}

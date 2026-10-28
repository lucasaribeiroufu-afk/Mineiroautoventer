import assert from 'node:assert/strict';
import express from 'express';
import webpush from 'web-push';
import { createHash, randomBytes } from 'node:crypto';
import { portalRouter } from '../server/portal';
import { dispatchReadyPush, validatePushSubscription } from '../server/push';

const originalFetch=globalThis.fetch, originalSend=webpush.sendNotification;
const oldKey=process.env.SUPABASE_SECRET_KEY, oldPass=process.env.ADMIN_PASSWORD;
process.env.SUPABASE_SECRET_KEY='test-server-key';
process.env.ADMIN_PASSWORD='test-admin-password-only';
const token=randomBytes(32).toString('base64url');
const tokenHash=createHash('sha256').update(token).digest('hex');
const keys=webpush.generateVAPIDKeys();
const subscription={ endpoint:'https://fcm.googleapis.com/fcm/send/test-only',keys:{p256dh:keys.publicKey,auth:randomBytes(16).toString('base64url')} };
const config={public_key:keys.publicKey,private_key:keys.privateKey,worker_hash:createHash('sha256').update('test-worker-token').digest('hex'),subject:'https://example.com'};
let jobs:any[]=[], valid=true, sent=0, gone=false;
const completions:any[]=[];
globalThis.fetch=async(url,init)=>{
 if(!String(url).includes('/rest/v1/rpc/')) return originalFetch(url,init);
 const body=JSON.parse(String(init?.body));
 const name=String(url).split('/').pop();
 if(name==='workshop_push_worker'){
  if(body.p_action==='config') return Response.json(config);
  if(body.p_action==='claim') return Response.json(jobs);
  if(body.p_action==='check') return Response.json({valid});
  if(body.p_action==='complete'){completions.push(body.p_payload);return Response.json({success:true});}
 }
 if(name==='workshop_portal'){
  assert(!JSON.stringify(body).includes(token),'Raw capability must not reach the database');
  if(body.p_action==='public_config') return Response.json({enabled:true,publicKey:keys.publicKey});
  if(body.p_action==='get'){assert.equal(body.p_hash,tokenHash);assert.equal(body.p_id,null);return Response.json({appointment:{id:'AGD-test',status:'novo'},revision:1,messages:[]});}
  if(body.p_action==='create'){assert.equal(body.p_hash,tokenHash);return Response.json({id:'AGD-test',status:'novo'});}
  if(body.p_action==='subscribe'){assert.equal(body.p_hash,tokenHash);return Response.json({subscribed:true});}
  throw Error('Unexpected portal action '+body.p_action);
 }
 throw Error('Unexpected RPC');
};
webpush.sendNotification=(async()=>{sent++;if(gone)throw Object.assign(new Error('Expired'),{statusCode:410});return {statusCode:201,body:'',headers:{}};}) as typeof webpush.sendNotification;
const app=express();app.use(express.json());app.use(portalRouter());
const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
const address=server.address();assert(address&&typeof address!=='string');
const base='http://127.0.0.1:'+address.port;
const request=(path:string,body?:unknown,access?:string)=>fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
try{
 const encrypted = webpush.generateRequestDetails(subscription,'{}',{vapidDetails:{subject:config.subject,publicKey:keys.publicKey,privateKey:keys.privateKey}});
 assert(encrypted.body && encrypted.body.length>0, 'Push payload must encrypt successfully');
 assert.equal(encrypted.endpoint,subscription.endpoint);
 assert.equal((await request('/api/client/appointment')).status,401);
 assert.equal((await request('/api/client/appointment',undefined,token)).status,200);
 assert.equal((await request('/api/admin/appointments/AGD-test/conversation')).status,401);
 assert.equal((await request('/api/push/dispatch',{})).status,401);
 const created=await request('/api/schedule/appointments',{clientToken:token});
 assert.equal(created.status,201);assert.equal((await created.json()).clientToken,token);
 for(const endpoint of ['http://127.0.0.1','https://127.0.0.1','https://fcm.googleapis.com.evil.example/path','https://fcm.googleapis.com:8443/path','https://user:pass@fcm.googleapis.com/path']){
  assert.throws(()=>validatePushSubscription({...subscription,endpoint}));
 }
 assert.equal((await request('/api/client/push/subscribe',{subscription:{...subscription,endpoint:'https://127.0.0.1'}},token)).status,400);
 assert.equal((await request('/api/client/push/subscribe',{subscription},token)).status,200);
 const publicConfig=await(await request('/api/push/config')).json();
 assert(!JSON.stringify(publicConfig).includes(keys.privateKey));
 jobs=[{id:'test-queue',attempts:1,subscription,kind:'reminder',recipientRole:'client'}];
 valid=false;await dispatchReadyPush();assert.equal(sent,0);assert.equal(completions.at(-1).result,'cancelled');
 valid=true;await dispatchReadyPush();assert.equal(sent,1);assert.equal(completions.at(-1).result,'sent');
 gone=true;await dispatchReadyPush();assert.equal(completions.at(-1).result,'gone');
 console.log('PASS: capability hashing, authorization, private config, SSRF protection, subscription, stale reminder rejection and expired endpoint handling');
}finally{
 globalThis.fetch=originalFetch;webpush.sendNotification=originalSend;
 if(oldKey===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=oldKey;
 if(oldPass===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=oldPass;
 server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
}

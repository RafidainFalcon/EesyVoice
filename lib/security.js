const crypto=require('crypto');
const {db,admin}=require('./guard');
const fail=(message,status=403)=>Object.assign(new Error(message),{status});
const emojis=['😀','😍','😎','🥳','😡','😭','🤖','👻','🥶','🤩','😴','😇','😺','🙃','😱'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const day=()=>new Date().toISOString().slice(0,10);
function ip(req){return String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'').split(',')[0].trim().slice(0,64)}
async function risk(req){
 // IP intelligence is opt-in; no false claims of VPN detection without a configured provider.
 const key=process.env.PROXYCHECK_API_KEY;if(!key)return {configured:false,blocked:false};
 const addr=ip(req);if(!/^[0-9a-fA-F:.]+$/.test(addr))return {configured:true,blocked:false};
 try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),2500);let r;try{r=await fetch('https://proxycheck.io/v2/'+encodeURIComponent(addr)+'?vpn=1&asn=1&key='+encodeURIComponent(key),{signal:ctl.signal})}finally{clearTimeout(t)}
 const d=await r.json();const item=d[addr]||{};return {configured:true,blocked:item.proxy==='yes',type:item.type||null};
 }catch{return {configured:true,blocked:false,unavailable:true}}
}
async function gate(req,uid,action,{captcha=false,limit=12,windowSeconds=3600}={}){
 const key=hash(uid+':'+action+':'+Math.floor(Date.now()/(windowSeconds*1000)));
 const rate=db.collection('securityRate').doc(key);
 const proof=String(req.headers['x-eesy-captcha']||'');
 const p=proof?db.collection('captchaProofs').doc(hash(proof)):null;
 await db.runTransaction(async tx=>{
  const [rs,ps]=await Promise.all([tx.get(rate),p?tx.get(p):Promise.resolve(null)]);
  if((rs.data()?.count||0)>=limit)throw fail('محاولات كثيرة. حاول لاحقاً',429);
  if(captcha&&(!ps?.exists||ps.data().uid!==uid||ps.data().used||ps.data().expires<Date.now()))throw fail('مطلوب إكمال اختبار الإيموجي',428);
  tx.set(rate,{count:admin.firestore.FieldValue.increment(1),uid,action,expires:Date.now()+windowSeconds*1000},{merge:true});
  if(captcha)tx.update(p,{used:true,usedAt:admin.firestore.FieldValue.serverTimestamp()});
 });
}
async function rewardRisk(req,uid,action){
 const net=await risk(req);
 if(net.blocked){await audit(uid,'proxy_block',{action,type:net.type||'unknown'});throw fail('تم رصد اتصال VPN أو Proxy. أوقفه ثم أعد المحاولة، أو تواصل مع الدعم إذا كان الكشف خاطئاً',403)}
 if(net.unavailable&&process.env.VPN_FAIL_CLOSED==='true')throw fail('تعذر فحص الاتصال مؤقتاً، حاول لاحقاً',503);
 return net;
}
async function audit(uid,event,extra={}){try{await db.collection('securityEvents').add({uid,event,...extra,createdAt:admin.firestore.FieldValue.serverTimestamp()})}catch(e){console.error('SECURITY_AUDIT_ERROR',e.message)}}
module.exports={gate,risk,rewardRisk,fail,audit,hash,emojis,day,ip};

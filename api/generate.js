const crypto=require('crypto');
const {gate}=require('../lib/security');
const {admin,db,identify,profile,error}=require('../lib/guard');
const FV=admin.firestore.FieldValue;
const defaults=new Set(['6843639bb79c4b0ba2c15307280465ca','baeba69bf83d47f9adb0e66e8f8f1658','8ea1c102258b4496b2234e6e7d20b5c2','060bb46361764a668119db1f06f00982']);
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const isMp3=b=>b.length>=128&&(b.subarray(0,3).toString('ascii')==='ID3'||((b[0]===0xff)&&(b[1]&0xe0)===0xe0&&(b[1]&0x18)!==0x08));
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).end();
 let actor;try{actor=await identify(req);await gate(req,actor.uid,'generate',{limit:30,windowSeconds:3600})}catch(e){return error(res,e)}
 if(Number(req.headers['content-length']||0)>8192)return res.status(413).json({error:'حجم الطلب كبير'});
 const b=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():req.body||{};
 if(!b||typeof b!=='object'||Array.isArray(b))return res.status(400).json({error:'طلب غير صالح'});
 const text=typeof b.text==='string'?b.text.trim():'';const voice=String(b.reference_id||'').toLowerCase();
 if(!text||text.length>500||!/^[a-f0-9]{32}$/.test(voice))return res.status(400).json({error:'النص أو معرف الصوت غير صالح'});
 const key=process.env.FISH_API_KEY;if(!key)return res.status(503).json({error:'خدمة الصوت غير مهيأة'});
 try{const voiceDoc=await db.collection('voices').doc(voice).get();if((voiceDoc.exists&&voiceDoc.data().enabled===false)||(!voiceDoc.exists&&!defaults.has(voice)))throw fail('الصوت غير متاح');}catch(e){return error(res,e)}
 const requestId=String(req.headers['x-request-id']||'');if(requestId&&!/^[a-zA-Z0-9_-]{12,80}$/.test(requestId))return res.status(400).json({error:'معرف الطلب غير صالح'});
 const jobId=requestId?crypto.createHash('sha256').update(actor.uid+':'+requestId).digest('hex'):crypto.randomUUID();
 const job=db.collection('generationJobs').doc(jobId);const userRef=await profile(actor.uid,actor.email);const dailyRef=db.collection('dailyUsage').doc(actor.uid+'_'+new Date().toISOString().slice(0,10));
 const maxDaily=Math.max(1,Math.min(100,Number(process.env.MAX_DAILY_GENERATIONS)||10));
 let reserved=false;
 try{await db.runTransaction(async tx=>{
  const [u,j,d]=await Promise.all([tx.get(userRef),tx.get(job),tx.get(dailyRef)]);
  if(j.exists)throw fail('هذا الطلب مسجل مسبقاً. راجع السجل قبل إعادة المحاولة',409);
  const data=u.data()||{};if(data.status==='blocked')throw fail('الحساب موقوف',403);
  if((data.credits||0)<1)throw fail('رصيدك غير كافٍ',402);
  if(data.activeJob)throw fail('لديك توليد قيد التنفيذ. انتظر اكتماله',429);
  if((d.data()?.count||0)>=maxDaily)throw fail('وصلت للحد اليومي للتوليد',429);
  tx.update(userRef,{credits:data.credits-1,activeJob:jobId});
  tx.set(dailyRef,{uid:actor.uid,date:new Date().toISOString().slice(0,10),count:FV.increment(1)},{merge:true});
  tx.create(job,{uid:actor.uid,voice,textPreview:text.slice(0,100),status:'processing',createdAt:FV.serverTimestamp(),charged:1});
  tx.create(db.collection('walletTransactions').doc(),{uid:actor.uid,delta:-1,type:'generation',jobId,createdAt:FV.serverTimestamp()});
 });reserved=true;}catch(e){return error(res,e)}
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),50000);
 try{
  const upstream=await fetch('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',model:process.env.FISH_MODEL||'s2.1-pro-free'},body:JSON.stringify({text,reference_id:voice,format:'mp3'}),signal:controller.signal});
  if(!upstream.ok)throw fail('خدمة Fish Audio رفضت الطلب: '+upstream.status,502);
  const buffer=Buffer.from(await upstream.arrayBuffer());if(buffer.length<128||buffer.length>15_000_000||!isMp3(buffer)){console.error('FISH_INVALID_AUDIO', {status:upstream.status,contentType:upstream.headers.get('content-type'),bytes:buffer.length,signature:buffer.subarray(0,12).toString('hex')});throw fail('Fish Audio لم يرجع ملف MP3 صالحاً',502);}
  await db.runTransaction(async tx=>{const [j,u]=await Promise.all([tx.get(job),tx.get(userRef)]);if(j.data()?.status!=='processing')throw fail('حالة الطلب تغيرت',409);tx.update(job,{status:'completed',bytes:buffer.length,completedAt:FV.serverTimestamp()});tx.update(userRef,{totalGenerations:FV.increment(1),...(u.data()?.activeJob===jobId?{activeJob:FV.delete()}:{})})});
  res.setHeader('Content-Type','audio/mpeg');res.setHeader('X-Eesy-Job',jobId);return res.status(200).send(buffer);
 }catch(e){
  // Transaction is idempotent: refunds at most once.
  await db.runTransaction(async tx=>{const [j,u]=await Promise.all([tx.get(job),tx.get(userRef)]);if(j.data()?.status!=='processing')return;tx.update(job,{status:'failed',failureCode:e.status||502,completedAt:FV.serverTimestamp()});tx.update(userRef,{credits:FV.increment(1),...(u.data()?.activeJob===jobId?{activeJob:FV.delete()}:{})});tx.create(db.collection('walletTransactions').doc(),{uid:actor.uid,delta:1,type:'refund',jobId,createdAt:FV.serverTimestamp()})}).catch(err=>console.error('REFUND_REQUIRES_RECONCILIATION',jobId,err.message));
  return res.status(e.name==='AbortError'?504:502).json({error:'فشل توليد الصوت؛ تحقق من الرصيد والسجل قبل إعادة المحاولة',jobId});
 }finally{clearTimeout(timer)}
};

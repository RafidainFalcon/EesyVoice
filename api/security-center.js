const {db,identify,isOwner,error,admin}=require('../lib/guard');
const {audit}=require('../lib/security');
module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');try{
 const actor=await identify(req);if(!isOwner(actor.uid))return res.status(403).json({error:'للمالك فقط'});
 if(req.method==='GET'){
  const [events,rates,jobs]=await Promise.all([
   db.collection('securityEvents').orderBy('createdAt','desc').limit(80).get(),
   db.collection('securityRate').limit(100).get(),
   db.collection('generationJobs').orderBy('createdAt','desc').limit(60).get()
  ]);
  const recent=events.docs.map(d=>{const x=d.data();return {id:d.id,uid:x.uid||'',event:x.event||'',action:x.action||'',createdAt:x.createdAt?.toDate?.()?.toISOString?.()||null}});
  const stats={events:events.size,rateCounters:rates.size,processing:jobs.docs.filter(x=>x.data().status==='processing').length,failed:jobs.docs.filter(x=>x.data().status==='failed').length};
  return res.json({stats,events:recent,notice:'الأعداد ضمن آخر سجلات معروضة وليست إحصائيات إجمالية'});
 }
 if(req.method==='POST'){
  const {uid,action}=req.body||{};
  if(action!=='review'||typeof uid!=='string'||uid.length>128)return res.status(400).json({error:'طلب غير صالح'});
  await audit(actor.uid,'admin_review',{targetUid:uid});return res.json({ok:true});
 }
 return res.status(405).end();
 }catch(e){return error(res,e)};
};

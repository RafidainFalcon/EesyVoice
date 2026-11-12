const crypto=require('crypto');
const {db,identify,error,admin}=require('../lib/guard');
const {emojis,hash,fail,gate}=require('../lib/security');
module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');try{
 const a=await identify(req);
 if(req.method==='GET'){
  await gate(req,a.uid,'captcha-create',{limit:25,windowSeconds:3600});
  // Fisher-Yates for unbiased random choices.
  const pool=emojis.slice();for(let i=pool.length-1;i>0;i--){const j=crypto.randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]]}
  const opts=pool.slice(0,3),answer=crypto.randomInt(3),id=crypto.randomBytes(18).toString('hex');
  await db.collection('captchaChallenges').doc(hash(id)).create({uid:a.uid,answer,expires:Date.now()+120000,attempts:0,used:false,createdAt:admin.firestore.FieldValue.serverTimestamp()});
  return res.json({id,target:opts[answer],options:opts,expiresIn:120});
 }
 if(req.method==='POST'){
  await gate(req,a.uid,'captcha-verify',{limit:35,windowSeconds:3600});
  const id=String(req.body?.id||''),choice=Number(req.body?.choice);
  if(!/^[a-f0-9]{36}$/.test(id)||!Number.isInteger(choice)||choice<0||choice>2)throw fail('اختبار غير صالح',400);
  const ref=db.collection('captchaChallenges').doc(hash(id));let token,correct=false;
  await db.runTransaction(async tx=>{const s=await tx.get(ref),v=s.data();if(!v||v.uid!==a.uid||v.used||v.expires<Date.now())throw fail('انتهت صلاحية الاختبار',409);
   tx.update(ref,{used:true});if(v.answer!==choice)return;correct=true;
   token=crypto.randomBytes(32).toString('hex');tx.create(db.collection('captchaProofs').doc(hash(token)),{uid:a.uid,expires:Date.now()+120000,used:false,createdAt:admin.firestore.FieldValue.serverTimestamp()});
  });if(!correct)throw fail('الإجابة غير صحيحة، حاول بتحدٍ جديد',400);return res.json({proof:token,expiresIn:120});
 }
 return res.status(405).end();
 }catch(e){return error(res,e)}};

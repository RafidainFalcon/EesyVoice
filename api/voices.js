const {db,identify,isAdmin,error,admin}=require('../lib/guard');
const defaults=[
{id:'6843639bb79c4b0ba2c15307280465ca',name:'صوت بنية',detail:'صوت أنثوي طبيعي',emoji:'👧'},
{id:'baeba69bf83d47f9adb0e66e8f8f1658',name:'صوت والد',detail:'صوت رجولي دافئ',emoji:'👨'},
{id:'8ea1c102258b4496b2234e6e7d20b5c2',name:'صوت بنية خدرانة',detail:'نبرة هادئة وناعمة',emoji:'😴'},
{id:'060bb46361764a668119db1f06f00982',name:'صوت حلو',detail:'نبرة مميزة',emoji:'✨'}];
const validId=id=>typeof id==='string'&&/^[a-f0-9]{32}$/i.test(id);
module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');try{
 if(req.method==='GET'){const snap=await db.collection('voices').limit(200).get();const overrides=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));const merged=[...defaults.map(v=>({...v,...(overrides.get(v.id)||{})})),...snap.docs.filter(d=>!defaults.some(v=>v.id===d.id)).map(d=>({id:d.id,...d.data()}))];let showAll=false;
 if(req.query?.all==='1'){const actor=await identify(req);showAll=await isAdmin(actor.uid);if(!showAll)return res.status(403).json({error:'غير مصرح'});}
 return res.json({voices:merged.filter(v=>showAll||v.enabled!==false).map(({id,name,detail,emoji,enabled})=>({id,name,detail,emoji:emoji||'🎙️',enabled:enabled!==false}))});}
 const actor=await identify(req);if(!await isAdmin(actor.uid))return res.status(403).json({error:'غير مصرح'});
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};const id=String(b.id||'').toLowerCase();if(!validId(id))return res.status(400).json({error:'معرف Fish غير صالح'});
 const ref=db.collection('voices').doc(id);
 if(req.method==='POST'||req.method==='PATCH'){
 const name=String(b.name||'').trim(),detail=String(b.detail||'').trim();if(name.length<2||name.length>70||detail.length>120)return res.status(400).json({error:'الاسم أو الوصف غير صالح'});
 await ref.set({name,detail,emoji:'🎙️',enabled:b.enabled!==false,updatedAt:admin.firestore.FieldValue.serverTimestamp(),updatedBy:actor.uid},{merge:true});
 await db.collection('auditLogs').add({actor:actor.uid,action:'voice_upsert',target:id,createdAt:admin.firestore.FieldValue.serverTimestamp()});return res.json({ok:true});}
 if(req.method==='DELETE'){await ref.set({enabled:false,updatedBy:actor.uid,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});await db.collection('auditLogs').add({actor:actor.uid,action:'voice_disable',target:id,createdAt:admin.firestore.FieldValue.serverTimestamp()});return res.json({ok:true});}
 return res.status(405).end();}catch(e){return error(res,e)};
};

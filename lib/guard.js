const admin=require('./firebase-admin');
async function identify(req){
 const token=(req.headers.authorization||'').match(/^Bearer (.+)$/)?.[1];
 if(!token)throw Object.assign(new Error('سجّل الدخول أولاً'),{status:401});
 let user;try{user=await admin.auth().verifyIdToken(token,true)}catch{throw Object.assign(new Error('جلسة غير صالحة'),{status:401})}
 if(!user.email_verified)throw Object.assign(new Error('فعّل البريد أولاً'),{status:403});
 return user;
}
const db=admin.firestore();
const isOwner=uid=>(process.env.ADMIN_UIDS||'').split(',').map(x=>x.trim()).filter(Boolean).includes(uid);
async function isAdmin(uid){if(isOwner(uid))return true;const [role,user]=await Promise.all([db.collection('adminRoles').doc(uid).get(),db.collection('users').doc(uid).get()]);return role.exists&&role.data()?.enabled===true&&user.data()?.status!=='blocked';}
async function profile(uid,email){
 const ref=db.collection('users').doc(uid);
 await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)tx.create(ref,{email:email||'',credits:Math.max(0,Math.min(100,Number(process.env.DEFAULT_CREDITS)||10)),createdAt:admin.firestore.FieldValue.serverTimestamp(),totalGenerations:0,status:'active'});});
 return ref;
}
function error(res,e){return res.status(e.status||500).json({error:e.status?e.message:'حدث خطأ في الخادم'})}
module.exports={admin,db,identify,isAdmin,isOwner,profile,error};

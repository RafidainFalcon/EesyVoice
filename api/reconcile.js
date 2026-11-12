const {admin,db}=require('../lib/guard');
const FV=admin.firestore.FieldValue;
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).end();
 if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)return res.status(401).json({error:'unauthorized'});
 const cutoff=admin.firestore.Timestamp.fromMillis(Date.now()-15*60*1000);
 try{const snap=await db.collection('generationJobs').where('status','==','processing').where('createdAt','<',cutoff).limit(50).get();let recovered=0;
 for(const doc of snap.docs){await db.runTransaction(async tx=>{const j=await tx.get(doc.ref);if(j.data()?.status!=='processing')return;const uid=j.data().uid;const ref=db.collection('users').doc(uid);const u=await tx.get(ref);if(!u.exists)return;tx.update(doc.ref,{status:'failed',failureCode:'stale',completedAt:FV.serverTimestamp()});tx.update(ref,{credits:FV.increment(1),...(u.data().activeJob===doc.id?{activeJob:FV.delete()}:{})});tx.create(db.collection('walletTransactions').doc(),{uid,delta:1,type:'refund',jobId:doc.id,reason:'stale-reconciliation',createdAt:FV.serverTimestamp()});recovered++})}
 return res.json({ok:true,recovered});}catch(e){console.error(e);return res.status(500).json({error:'reconciliation failed'})}
};

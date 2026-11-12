const {admin,db,identify,profile,error,isOwner}=require('./guard');
const FV=admin.firestore.FieldValue;
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const today=()=>new Date().toISOString().slice(0,10);
// ISO week starts Monday in UTC. One jackpot per calendar ISO week.
function week(){const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=d.getUTCFullYear();const first=new Date(Date.UTC(y,0,1));return y+'-'+String(Math.ceil((((d-first)/86400000)+1)/7)).padStart(2,'0')}
const maxCredits=100000;
function award(tx,ref,data,uid,amount,type,extra={}){if(!Number.isSafeInteger(amount)||amount<0||amount>500||((data.credits||0)+amount)>maxCredits)throw fail('تعذر إضافة النقاط: الحد الأعلى للرصيد',409);tx.update(ref,{credits:(data.credits||0)+amount});tx.create(db.collection('walletTransactions').doc(),{uid,delta:amount,type,...extra,createdAt:FV.serverTimestamp()})}
module.exports={admin,db,identify,profile,error,isOwner,FV,fail,today,week,award,maxCredits};

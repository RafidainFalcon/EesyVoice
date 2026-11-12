const admin=require('firebase-admin');
if(!admin.apps.length){
  // Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel environment variables (never in git).
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if(!raw)throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing');
  const service=JSON.parse(raw);
  admin.initializeApp({credential:admin.credential.cert(service)});
}
module.exports=admin;

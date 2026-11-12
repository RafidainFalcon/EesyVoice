# Eesy Voice V2 — تعليمات النشر

1. ارفع محتويات هذا المجلد إلى GitHub (لا ترفع ملفات service-account أو .env).
2. في Vercel اربط المستودع، وأضف متغيرات الخادم: `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON كامل)، `FISH_API_KEY`، `ADMIN_UIDS` (UID حساب المدير)، `FISH_MODEL` (اختياري، تحقق من موديل Fish المدعوم)، `MAX_DAILY_GENERATIONS=10`، و`CRON_SECRET` قيمة عشوائية طويلة.
3. من Firebase Authentication → Settings → Authorized domains أضف نطاق Vercel المستخدم.
4. انشر `firestore.rules` بواسطة Firebase CLI: `firebase deploy --only firestore:rules,firestore:indexes` بعد إعداد `firebase.json` و`.firebaserc`، أو انسخ القواعد إلى Firebase Console.
5. لجدولة استرجاع الطلبات المعلقة: اربط GET `/api/reconcile` بجدولة موثوقة ترسل `Authorization: Bearer <CRON_SECRET>` كل 10–15 دقيقة. **Vercel Cron على الخطة المجانية قد لا يدعم هذا التكرار**؛ استخدم مجدولاً خارجياً آمناً أو شغّل المسار يدوياً عند الحاجة. لا تترك الطلبات المعلقة دون متابعة.
6. اختبر: تسجيل Google والبريد، التحقق، منع الزائر، إضافة صوت وإخفاؤه، منع غير المدير، توليد MP3، خصم نقطة، استرجاع النقطة عند فشل Fish، تجاوز الحد اليومي، والحظر.
7. لم يتم التحقق المباشر من Fish API أو من بيانات مشروعك. حفظ MP3 سحابياً والدفع الإلكتروني **غير موجودين**، ولا يتم الإعلان عنهما.
8. سياسة الخصوصية والشروط نصوص أولية ينبغي مراجعتها وفق طريقة التشغيل الحقيقية قبل الإطلاق.

مهم: لا تنشر الخدمة للعامة قبل اختبار مسار التوليد والخصم، لأن نجاح اختبارات الصياغة وحده لا يكفي.

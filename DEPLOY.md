# Eesy Voice V2 — تعليمات النشر

1. ارفع ملفات هذا المجلد إلى مستودع GitHub خاص (Private)، واربطه بمشروع Vercel.
2. Vercel → Settings → Environment Variables: أضف FIREBASE_SERVICE_ACCOUNT_JSON (محتوى JSON كامل، سري)، FISH_API_KEY (سري)، ADMIN_UIDS (Firebase Authentication UID لحساب المدير، يمكن وضع عدة UID بفواصل). لا تضع أيّاً منها في الملفات أو GitHub.
3. Firebase Authentication → Settings → Authorized domains: أضف voicemake.vercel.app أو دومينك الفعلي، بدون https://.
4. Firebase Firestore → Rules: انشر محتوى firestore.rules. هذا يمنع وصول المتصفح مباشرة، وتتعامل API فقط مع البيانات.
5. Firebase Firestore → Indexes: أنشئ Composite Index لمجموعة generationJobs: uid Ascending + createdAt Descending (أو انشر firestore.indexes.json عبر Firebase CLI).
6. Deploy على Vercel، واختبر إنشاء حساب والتحقق من البريد ثم /api/me والتوليد.
7. للحصول على ADMIN_UIDS: من Firebase Console → Authentication → Users انسخ UID الخاص بحسابك بعد تسجيل الدخول؛ لا تستخدم البريد وحده لصلاحيات المدير.

## سلوك النسخة
- كل حساب جديد يحصل على 5 نقاط تجريبية، وكل توليد يستهلك نقطة واحدة.
- خصم الرصيد في Firestore transaction، مع رد النقطة عند فشل Fish Audio المعروف؛ في حالة انقطاع الخادم المفاجئ قد تبقى عملية معلقة وتحتاج مراجعة إدارية.
- سجل بيانات التوليد محفوظ في Firestore؛ ملفات MP3 نفسها **لا تحفظ سحابياً**، بل يمكن تنزيلها أثناء الجلسة.
- لا يوجد شحن مالي أو مدفوعات؛ المدير يضيف الرصيد يدوياً.
- تكلفة Fish Audio وFirestore/Vercel تخضع لحصص وأسعار الخدمات، وليست مجانية بلا حدود.
- قبل فتح الموقع للعامة يوصى بإضافة App Check/مكافحة إساءة الاستخدام، حدود طلبات على الخادم، مراقبة التكلفة، وسياسة خصوصية وشروط استخدام.
- تأكد أن Fish Audio يدعم اسم الموديل في FISH_MODEL (الافتراضي s2.1-pro-free) ومرجعيات الأصوات؛ إذا رفضها API فلن يعمل التوليد حتى تصحح الإعداد.

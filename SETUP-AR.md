# Eesy Voice V2 — المرحلة الأولى

## الموجود حالياً
- واجهة Eesy Voice مع نافذة تسجيل وإنشاء حساب وتسجيل Google واستعادة كلمة المرور.
- التحقق من البريد الإلكتروني قبل التوليد.
- حماية `/api/generate` بالتحقق من Firebase ID token من جهة الخادم.
- الأصوات الأربعة الحالية، دون نظام رصيد بعد.

## Firebase
1. Authentication > Sign-in method: فعّل Email/Password وGoogle.
2. Authentication > Settings > Authorized domains: أضف دومين Vercel المستخدم.
3. Firestore > Rules: انسخ محتوى `firestore.rules` وانشره. القاعدة مغلقة لحين بناء محفظة الرصيد والعمليات الخادمية.
4. Project settings > Service accounts > Generate new private key: نزّل JSON **محلياً فقط**. لا ترفعه إلى GitHub ولا ترسله في الدردشة.

## Vercel
1. ارفع محتويات المجلد إلى مستودع GitHub. Framework Preset: Other. Root Directory: ./.
2. في Settings > Environment Variables، اضبط `FISH_API_KEY` الحالي.
3. أضف `FIREBASE_SERVICE_ACCOUNT_JSON` بقيمة محتوى ملف Service Account JSON الكامل كسطر واحد. **هذا سر حساس جداً**؛ لا تضعه في ملفات المشروع أو الواجهة.
4. Redeploy ثم اختبر التسجيل والتحقق وتوليد الصوت.
5. راجع إعدادات API key restrictions في Google Cloud Console؛ لا تحظر Firebase Auth API المطلوبة بالخطأ.

## تنبيهات مهمة
- لا يوجد رصيد/شحن/لوحة أدمن في هذه المرحلة؛ حماية توليد الصوت حالياً تعتمد على تسجيل الدخول فقط، لذلك لا تفتح المنصة للعامة قبل إضافة حدود الاستخدام والرصيد ومكافحة الإساءة.
- لا تحفظ أي بيانات شخصية أو أسرار في واجهة الويب.
- قد تفشل Google popup في بعض متصفحات الموبايل؛ استخدم متصفح Chrome أو اختبر إعدادات redirect على دومين مخصص.
- راجع حدود خطة Firebase وVercel وخدمة التوليد قبل الإطلاق العام.

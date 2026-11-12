# تدقيق أمان Eesy Voice — 2026-11-08

## ما تحققنا منه في الشيفرة
- Firestore يمنع القراءة والكتابة المباشرة من المتصفح؛ يجب نشر firestore.rules فعلياً.
- الخادم يتحقق من Firebase ID token مع revocation ويشترط تأكيد البريد.
- الرصيد يخصم داخل Firestore transaction، والأدمن يتحقق من UID بالخادم.
- الأصوات القادمة من Firestore كانت تدخل innerHTML دون تعقيم: **ثغرة XSS محتملة**، تم إصلاحها باستخدام textContent.
- أضفنا حد حجم أولي لطلبات التوليد، ورؤوس حماية إضافية مع سياسة CSP أولية.
- منع حظر حسابات الأدمن من API الإدارة.

## قبل النشر العام — ضروري
1. لا ترفع ملف Service Account إلى GitHub. ضع JSON في Vercel Environment Variables، وأضف ADMIN_UIDS وFISH_API_KEY وCRON_SECRET.
2. انشر firestore.rules عبر Firebase CLI، وتأكد من عملها باختبار Emulator.
3. اضبط Authorized domains في Firebase Authentication لدومين Vercel.
4. جرّب Google sign-in وEmail sign-in، فقد تحتاج CSP إلى تعديل حسب مزوّد Google وبيئة النشر.
5. فعّل حماية DDoS/WAF ومعدلات طلبات على مستوى Vercel؛ حدود الحساب اليومية لا توقف الطلبات المجهولة ولا تحمي من كل الإغراق.
6. اختبر استرجاع الرصيد عند انقطاع الاتصال؛ الكود لا يضمن استرداد كل حالة انقطاع حتى تعمل جدولة reconcile.
7. لا تعتمد على ترويسات المتصفح في الهوية أو الرصيد؛ لا توجد حماية مطلقة من الاختراق.
8. اختبر الواجهة على بيئة Preview قبل نشر Production، وأجرِ تدقيقاً ثانياً قبل قبول مستخدمين حقيقيين.

## حدود هذا التدقيق
فحص شيفرة ثابت وفحص بناء JS، بدون اختبار Firebase/Vercel/Fish Audio الحي أو اختبار اختراق.

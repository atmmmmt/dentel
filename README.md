# نظام عيادة الأسنان الاحترافي — Dental Clinic Pro System
### Product Platform by Prootech Agency

---

## نظرة عامة

هذا المجلد هو منصة مستقلة لبيع نظام عيادة الأسنان الاحترافي. يتضمن:

- **موقع عرض المنتج** (Landing Page) كامل وقابل للتحكم
- **لوحة تحكم خاصة** بـ Prootech لإدارة المحتوى والعملاء

> ملاحظة: هذا المشروع **منفصل تماماً** عن مشروع د. أيهم درويش.

---

## المنافذ

| الخدمة     | المنفذ |
|-----------|--------|
| Backend   | 5100   |
| Frontend  | 5180   |

---

## المتطلبات

- Node.js 18+
- MongoDB (محلي أو Atlas)
- حساب Cloudinary (لرفع الصور)

---

## تثبيت Backend

```bash
cd product-platform/backend
cp .env.example .env
# عدّل .env بمعلوماتك الحقيقية
npm install
npm run seed   # لإنشاء البيانات الأولية
npm run dev    # تشغيل التطوير
```

---

## تثبيت Frontend

```bash
cd product-platform/frontend
npm install
npm run dev
```

---

## بيانات الدخول

| البيان | القيمة |
|--------|--------|
| الإيميل | admin@prootech.com |
| كلمة المرور | قيمة `ADMIN_PASSWORD` في `.env` |
| لوحة التحكم | http://localhost:5180/product-admin |

---

## الروابط العامة

| الصفحة | الرابط |
|--------|--------|
| الرئيسية | http://localhost:5180/ |
| الميزات | http://localhost:5180/features |
| الباقات | http://localhost:5180/pricing |
| الديمو | http://localhost:5180/demo |
| تواصل | http://localhost:5180/contact |

---

## API Endpoints

### Public
```
GET  /api/product/public/settings
GET  /api/product/public/landing
GET  /api/product/public/pricing
GET  /api/product/public/testimonials
GET  /api/product/public/faqs
POST /api/product/public/leads
```

### Auth
```
POST /api/product/auth/login
GET  /api/product/auth/me
PUT  /api/product/auth/profile
```

### Admin (JWT Required)
```
GET/PUT  /api/product/admin/settings
GET/PUT  /api/product/admin/landing
GET/POST /api/product/admin/pricing
PUT/DEL  /api/product/admin/pricing/:id
GET/POST /api/product/admin/testimonials
PUT/DEL  /api/product/admin/testimonials/:id
GET/POST /api/product/admin/faqs
PUT/DEL  /api/product/admin/faqs/:id
GET      /api/product/admin/leads
GET/PUT/DEL /api/product/admin/leads/:id
GET      /api/product/admin/dashboard-stats
GET/POST /api/product/admin/media
DEL      /api/product/admin/media/:id
```

---

## متغيرات البيئة

| المتغير | الوصف |
|---------|-------|
| MONGODB_URI | رابط قاعدة البيانات |
| JWT_SECRET | مفتاح التوقيع السري |
| CLOUDINARY_CLOUD_NAME | اسم الحساب Cloudinary |
| CLOUDINARY_API_KEY | مفتاح API |
| CLOUDINARY_API_SECRET | سر API |
| CLOUDINARY_FOLDER | مجلد الرفع (product-platform) |
| FRONTEND_URL | رابط الفرونتند |

---

## ميزة ملف المريض + مخطط الأسنان 3D 🦷 (باقة Premium وما فوق)

لكل مريض ملف كامل: بيانات شخصية، ملاحظات طبية، وسجل جلسات.
كل جلسة تدعم **مخطط أسنان ثلاثي الأبعاد واقعي** (فكّان بـ 32 سناً بترقيم FDI):

- الطبيب يضغط على السن مباشرة في المجسم ويحدد الحالة: قلع، حشوة، معالجة، زرعة، تاج، معالجة عصب، تنظيف
- دوران حر 360°، تقريب، وتلميحات بأسماء الأسنان بالعربية
- "الخريطة السنية الحالية" تدمج آخر حالة لكل سن عبر كل الجلسات
- عرض الجلسة كمخطط أو كقائمة مكتوبة — حسب رغبة الطبيب
- المجسم مولّد برمجياً بالكامل (Three.js) — لا يحتاج ملفات خارجية ويعمل أوفلاين

### API (clinic dashboard)
```
GET/POST /api/clinic/:slug/dash/patients
GET/PUT/DEL /api/clinic/:slug/dash/patients/:id
POST /api/clinic/:slug/dash/patients/:id/sessions
PUT/DEL /api/clinic/:slug/dash/patients/:id/sessions/:sessionId
```
كل المسارات محمية بـ `requireFeature('patient_file')` — متاحة لباقتي Premium وVIP Custom فقط.

---

## العمل أوفلاين ☁️

نظام العيادة يعمل بالكامل بدون إنترنت:

- **PWA + Service Worker**: التطبيق يفتح بدون نت حتى بعد إعادة تشغيل الجهاز
- **كاش IndexedDB**: كل بيانات لوحة التحكم محفوظة محلياً
- **صندوق صادر (Outbox)**: أي إضافة/تعديل/حذف أثناء الانقطاع يُحفظ محلياً ويظهر فوراً في الواجهة، ثم يُرفع تلقائياً عند عودة الاتصال (مع استبدال المعرفات المؤقتة بالحقيقية)
- شريط حالة في لوحة التحكم يعرض وضع الاتصال وعدد التغييرات المنتظرة
- الملفات الأساسية: `frontend/src/services/offlineStore.js` و`clinicApi.js` (interceptors)

ملاحظات: تسجيل الدخول الأول ورفع الصور وواتساب تحتاج اتصالاً.

---

## Seed عيادة د. أيهم درويش (زبون VIP جاهز)

```bash
cd product-platform/backend
npm run seed:ayham
```

ينشئ عيادة كاملة التجهيز (إعدادات، خدمات، أوقات دوام، مريض تجريبي بجلسات ومخطط أسنان):
- الرابط: `/clinic/ayham-darwish/login`
- الدخول: `dr.ayham@clinic.com` / قيمة `AYHAM_PASSWORD` في `.env`
- الباقة: VIP Custom — اشتراك دائم، كل الميزات

---

## النشر

### Backend
```bash
npm start
```

### Frontend
```bash
npm run build
# ثم رفع مجلد dist على Nginx / Vercel / Netlify
```

> ملاحظة نشر: طبقة الأوفلاين تعتبر السيرفر "غير متاح" عند استجابات 502/503/504
> (بوابة nginx عاطلة) وتحوّل تلقائياً للوضع المحلي.

---

## Prootech Agency © 2026

---

## تجهيز عيادة جديدة وربط الدومين (2026-10)

### من لوحة Prootech ← العيادات ← «تجهيز عيادة جديدة»
معالج من 3 خطوات:
1. **الطبيب والعيادة** — رابط العيادة (slug) يُولَّد تلقائياً بأحرف لاتينية من الاسم العربي مع فحص التوفر لحظياً.
2. **الاشتراك** — تفعيل مدفوع فوراً (الاشتراك الأول 13 شهراً) أو فترة تجريبية بعدد أيام تختاره.
3. **الدومين والتسليم** — لديه دومين / نحجز له / لاحقاً.

بعد الإنشاء تظهر **بطاقة التسليم**: رابط الدخول، الموقع، رابط الحجز، شاشة الانتظار، البريد وكلمة المرور + رسالة ترحيب جاهزة تُرسل بزر واحد عبر واتساب أو تُطبع.

### ربط الدومين (للطبيب من لوحته أو للأدمن)
- السجل المطلوب: `CNAME  www  →  PLATFORM_HOST` (+ تحويل الدومين الأساسي إلى www أو `CNAME @` في Cloudflare).
- المعالج يكتشف شركة الدومين تلقائياً (GoDaddy / Namecheap / Hostinger / Cloudflare) ويعرض خطواتها بالعربي.
- الفحص يتحقق من DNS **ومن أن الموقع يفتح فعلاً** (يدعم Cloudflare Proxy)، مع فحص تلقائي كل 20 ثانية.
- زر «اربطوه عني» يسجّل طلب مساعدة يظهر للأدمن كتنبيه في صفحة العيادات.

API جديدة:
```
GET  /api/product/admin/clinics/slug-check?slug=
GET  /api/product/admin/clinics/:id/welcome-kit
POST /api/clinic/:slug/dash/domain/help
```

---

## مجسم الأسنان الثلاثي الأبعاد (2026-10)
- الأسنان مأخوذة من بيانات **BodyParts3D** (مسح CT لأسنان إنسان حقيقي)، كل سن مجسم منفصل برقم FDI، واللثة مبنية بالكود كقاعدة طقم أسنان (أكريليك لامع بعروق حمراء، وحواف ملفوفة، وسقف حلق) حول الأسنان الحقيقية — `components/jaw/denture.js`. الوضع الافتراضي إطباق الفكين، وزر «فتح الفك» يفتحهما للوصول للأسطح الماضغة.
- مكان البيانات: `frontend/src/components/jaw/dentition.data.js`، وتُولَّد بالأمر:
  `node scripts/build-dentition.mjs <مجلد isa_BP3D_4.0_obj_99>`
- المعالجة عند التشغيل في `components/jaw/realDentition.js` (تنعيم Loop subdivision، وتلوين المينا، وقص الجذور داخل اللثة). تُستخدم درجة تنعيم أقل على الموبايل.
- ضروس العقل (18/28/38/48) غير موجودة في البيانات، فتُشتق من الضرس الثاني.
- إذا وُضع ملف `frontend/public/models/jaw.glb` (مسح حقيقي، وكل سن باسم يحتوي رقمه) يُستخدم تلقائياً بدلاً منها. وإذا فشل التحميل يعود النظام للمجسم المرسوم بالكود (`components/jaw/anatomy.js`).
- **ذكر المصدر (إلزامي):** "BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan". ملف البيانات المشتق يبقى تحت الرخصة نفسها.

# دليل الإعداد — Product Platform Setup

---

## الخطوة 1: نسخ ملف البيئة

```bash
cd product-platform/backend
copy .env.example .env
```

افتح `.env` وعدّل القيم:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/prootech_product
JWT_SECRET=<long-random-string>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

---

## الخطوة 2: تثبيت Backend

```bash
cd product-platform/backend
npm install
```

---

## الخطوة 3: تشغيل Seed

```bash
npm run seed
```

سيقوم بـ:
- إنشاء حساب admin
- إنشاء إعدادات افتراضية
- إنشاء محتوى اللاندينغ
- إنشاء الباقات الأربع
- إنشاء 3 شهادات عملاء
- إنشاء 8 أسئلة شائعة

---

## الخطوة 4: تشغيل Backend

```bash
npm run dev
# سيعمل على http://localhost:5100
```

---

## الخطوة 5: تثبيت Frontend

```bash
cd product-platform/frontend
npm install
```

---

## الخطوة 6: تشغيل Frontend

```bash
npm run dev
# سيعمل على http://localhost:5180
```

---

## الخطوة 7: فتح لوحة التحكم

```
http://localhost:5180/product-admin/login
```

```
Email:    admin@prootech.com
Password: (قيمة ADMIN_PASSWORD في .env)
```

---

## إعداد MongoDB

### محلي
تأكد من تشغيل MongoDB:
```bash
mongod
```

### Atlas
عدّل MONGODB_URI بالرابط من MongoDB Atlas Dashboard.

---

## إعداد Cloudinary

1. أنشئ حساباً على cloudinary.com
2. من Dashboard اجلب:
   - Cloud Name
   - API Key
   - API Secret
3. ضعها في ملف `.env`

---

## أخطاء شائعة

### Cannot connect to MongoDB
- تأكد من تشغيل MongoDB
- تحقق من MONGODB_URI

### Cloudinary upload failed
- تأكد من صحة بيانات Cloudinary
- تأكد من صلاحيات المجلد

### JWT errors
- تأكد من وجود JWT_SECRET في `.env`
- يجب أن يكون المفتاح طويلاً ومعقداً

### CORS errors
- تأكد من FRONTEND_URL في backend `.env`
- يجب أن يطابق منفذ الفرونتند (5180)

---

## Prootech Agency © 2026

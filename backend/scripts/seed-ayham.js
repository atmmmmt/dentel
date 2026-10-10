// Seed عيادة د. أيهم درويش كزبون VIP جاهز بالكامل داخل المنصة
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
// No real password in code: use AYHAM_PASSWORD, or generate one (printed below).
const AYHAM_PW = process.env.AYHAM_PASSWORD || require('crypto').randomBytes(9).toString('base64url');

const mongoose = require('mongoose');
const Clinic = require('../src/models/Clinic');
const ClinicSettings = require('../src/models/ClinicSettings');
const ClinicPatient = require('../src/models/ClinicPatient');
const PricingPackage = require('../src/models/PricingPackage');

const SLUG = 'ayham-darwish';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prootech_product');
    console.log('✅ Connected to MongoDB');

    // ── Clinic (VIP Custom — كل الميزات، اشتراك دائم) ──────────────
    await Clinic.deleteOne({ slug: SLUG });
    const clinic = await Clinic.create({
      doctorName: 'د. أيهم درويش',
      clinicName: 'عيادة د. أيهم درويش',
      slug: SLUG,
      email: 'dr.ayham@clinic.com',
      password: AYHAM_PW,
      phone: '+963962707268',
      whatsapp: '+963962707268',
      country: 'سوريا',
      city: 'دمشق',
      package: 'VIP Custom',
      billingCycle: 'lifetime',
      subscriptionStatus: 'active',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // lifetime
      status: 'active',
      onboardingCompleted: true,
      onboardingStep: 5,
      activatedAt: new Date(),
      internalNotes: 'أول زبون — نسخة كاملة بكل الميزات (VIP Custom)',
    });
    console.log('✅ Clinic created:', clinic.clinicName);

    // ── Settings (محتوى كامل جاهز — لا حاجة لأي إعداد يدوي) ────────
    await ClinicSettings.deleteOne({ clinicId: clinic._id });
    await ClinicSettings.create({
      clinicId: clinic._id,
      selectedStyle: 'Medical Blue',
      primaryColor: '#2D6BEB',
      secondaryColor: '#FFFFFF',
      accentColor: '#1A3A7C',
      darkColor: '#18181B',

      clinicNameAr: 'عيادة د. أيهم درويش',
      clinicNameEn: 'Dr. Ayham Darwish Dental Clinic',
      tagline: 'ابتسامتك تبدأ من أساس قوي',
      description: 'د. أيهم درويش طبيب أسنان متخصص يجمع بين الخبرة العلمية والحس الجمالي الرفيع. متخصص في طب الأسنان التجميلي، وزراعة الأسنان، وعلاج الأسنان العام.',
      address: 'الأعظمية - شارع قصر الضيافة',
      phone: '+963 962707268',
      whatsapp: '+963962707268',
      email: 'dr.ayham@clinic.com',

      heroTitle: 'ابتسامتك تبدأ من أساس قوي',
      heroSubtitle: 'رعاية سنية متقدمة تجمع بين الدقة، الخبرة، والتقنيات الحديثة لابتسامة صحية تدوم.',

      metaTitle: 'عيادة د. أيهم درويش | طب وتجميل الأسنان',
      metaDescription: 'عيادة د. أيهم درويش — ابتسامة هوليود، زراعة الأسنان، وطب الأسنان العام بأحدث التقنيات.',
      footerText: 'عيادة د. أيهم درويش © جميع الحقوق محفوظة',

      services: [
        { name: 'ابتسامة هوليود', description: 'حقق ابتسامة مثالية وساطعة مع أحدث تقنيات تجميل الأسنان وقشور البورسلين.', duration: '60 دقيقة', isActive: true, displayOrder: 1 },
        { name: 'زراعة الأسنان', description: 'الحل الأمثل والأكثر ديمومة لاستبدال الأسنان المفقودة بأحدث تقنيات الزراعة.', duration: '60 دقيقة', isActive: true, displayOrder: 2 },
        { name: 'طب الأسنان العام', description: 'فحص دوري، تنظيف، حشوات، علاج لثة، تيجان وجسور — رعاية شاملة.', duration: '30 دقيقة', isActive: true, displayOrder: 3 },
      ],

      workingHours: [
        { day: 'الأحد',    dayEn: 'sunday',    openTime: '09:00', closeTime: '18:00', isOpen: true },
        { day: 'الاثنين',  dayEn: 'monday',    openTime: '09:00', closeTime: '18:00', isOpen: true },
        { day: 'الثلاثاء', dayEn: 'tuesday',   openTime: '09:00', closeTime: '18:00', isOpen: true },
        { day: 'الأربعاء', dayEn: 'wednesday', openTime: '09:00', closeTime: '18:00', isOpen: true },
        { day: 'الخميس',   dayEn: 'thursday',  openTime: '09:00', closeTime: '18:00', isOpen: true },
        { day: 'الجمعة',   dayEn: 'friday',    openTime: '09:00', closeTime: '14:00', isOpen: false },
        { day: 'السبت',    dayEn: 'saturday',  openTime: '10:00', closeTime: '15:00', isOpen: true },
      ],

      whatsappBookingMessage: 'مرحباً، أود حجز موعد في عيادة د. أيهم درويش.',
    });
    console.log('✅ Clinic settings seeded (full content)');

    // ── مريض تجريبي بجلسات + مخطط أسنان — لعرض الميزة ─────────────
    await ClinicPatient.deleteMany({ clinicId: clinic._id });
    await ClinicPatient.create({
      clinicId: clinic._id,
      name: 'محمد الأحمد',
      phone: '+963 944 000 111',
      gender: 'male',
      birthYear: 1990,
      address: 'دمشق — المزة',
      notes: 'لا يوجد حساسية دوائية. مدخّن.',
      sessions: [
        {
          date: '2026-06-10',
          title: 'فحص أولي + معالجة',
          notes: 'فحص شامل، تسوس في الرحى الأولى العلوية اليمنى، تمت المعالجة اللبّية وتحديد موعد للحشوة النهائية.',
          teeth: [
            { tooth: 16, condition: 'root_canal', note: 'معالجة لبّية — جلسة أولى' },
            { tooth: 26, condition: 'filling', note: 'حشوة كومبوزيت' },
          ],
        },
        {
          date: '2026-06-24',
          title: 'قلع + تحضير زرعة',
          notes: 'قلع الرحى السفلية اليسرى المتضررة، وتحضير مكان الزرعة. مراجعة بعد أسبوعين.',
          teeth: [
            { tooth: 36, condition: 'extraction', note: 'قلع جراحي' },
            { tooth: 16, condition: 'crown', note: 'تاج زيركون بعد المعالجة' },
          ],
        },
      ],
    });
    console.log('✅ Sample patient with dental chart sessions seeded');

    // ── إضافة الميزة الجديدة لباقة Premium في صفحة الأسعار ─────────
    const FEATURE_LINE = 'ملف المريض الرقمي + مخطط الأسنان التفاعلي 🦷';
    const premium = await PricingPackage.findOne({ name: 'Premium' });
    if (premium && !premium.features.includes(FEATURE_LINE)) {
      premium.features.push(FEATURE_LINE);
      await premium.save();
      console.log('✅ Premium package updated with dental chart feature');
    }

    console.log('\n🎉 Ayham clinic seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login URL : http://localhost:5180/clinic/ayham-darwish/login');
    console.log('Email     : dr.ayham@clinic.com');
    console.log('Password  : ' + (process.env.AYHAM_PASSWORD ? '(AYHAM_PASSWORD from .env)' : AYHAM_PW));
    console.log('Package   : VIP Custom (كل الميزات — اشتراك دائم)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();

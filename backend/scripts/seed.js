// Load backend .env directly — must be first and with override
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
// No real password in code: use ADMIN_PASSWORD, or generate one (printed below).
const ADMIN_PW = process.env.ADMIN_PASSWORD || require('crypto').randomBytes(9).toString('base64url');

const mongoose = require('mongoose');
const ProductAdmin = require('../src/models/ProductAdmin');
const ProductSettings = require('../src/models/ProductSettings');
const LandingContent = require('../src/models/LandingContent');
const PricingPackage = require('../src/models/PricingPackage');
const Testimonial = require('../src/models/Testimonial');
const FAQ = require('../src/models/FAQ');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prootech_product');
    console.log('✅ Connected to MongoDB');

    // Admin
    const existingAdmin = await ProductAdmin.findOne({ email: 'admin@prootech.com' });
    if (!existingAdmin) {
      await ProductAdmin.create({
        name: 'Prootech Admin',
        email: process.env.ADMIN_EMAIL || 'admin@prootech.com',
        password: ADMIN_PW,
        role: 'super_admin',
      });
      console.log('✅ Admin created: admin@prootech.com / ' + (process.env.ADMIN_PASSWORD ? '(ADMIN_PASSWORD)' : ADMIN_PW));
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Settings
    await ProductSettings.findOneAndUpdate(
      { singleton: 'main' },
      { singleton: 'main' },
      { upsert: true, new: true }
    );
    console.log('✅ Product settings seeded');

    // Landing content
    await LandingContent.findOneAndUpdate(
      { singleton: 'main' },
      { singleton: 'main' },
      { upsert: true, new: true }
    );
    console.log('✅ Landing content seeded');

    // Pricing packages
    const pkgCount = await PricingPackage.countDocuments();
    if (pkgCount === 0) {
      await PricingPackage.insertMany([
        {
          name: 'Starter',
          subtitle: 'مناسب للطبيب الذي يريد حضوراً رقمياً منظماً',
          price: '399',
          currency: '$',
          badge: '',
          isHighlighted: false,
          isActive: true,
          displayOrder: 1,
          buttonText: 'اطلب الآن',
          features: [
            'موقع تعريفي احترافي',
            'صفحة حجز بسيطة',
            'إدارة الخدمات',
            'أوقات الدوام',
            'صفحة تواصل',
            'تصميم واحد جاهز',
            'دعم 7 أيام',
          ],
        },
        {
          name: 'Professional',
          subtitle: 'أفضل خيار لعيادة تريد تنظيماً حقيقياً',
          price: '899',
          currency: '$',
          badge: 'الأكثر طلباً',
          isHighlighted: true,
          isActive: true,
          displayOrder: 2,
          buttonText: 'اطلب الآن',
          features: [
            'كل ميزات Starter',
            'لوحة تحكم كاملة',
            'إدارة المواعيد المتقدمة',
            'سجل المرضى',
            'معرض قبل/بعد',
            'السجل المالي',
            'إدارة محتوى الموقع',
            'تقارير أساسية',
            'اختيار من ستايلين',
            'تدريب أونلاين',
          ],
        },
        {
          name: 'Premium',
          subtitle: 'للعيادات التي تريد تجربة متقدمة وفخمة',
          price: '1499',
          currency: '$',
          badge: '',
          isHighlighted: false,
          isActive: true,
          displayOrder: 3,
          buttonText: 'اطلب الآن',
          features: [
            'كل ميزات Professional',
            'ملف المريض الرقمي + مخطط الأسنان التفاعلي 🦷',
            'تقارير متقدمة',
            'تصدير PDF',
            'واتساب QR',
            'تذكيرات تلقائية',
            'ممرضات وصلاحيات',
            'تخصيص ألوان وهوية',
            'اختيار من 5 ستايلات',
            'SEO أساسي',
            'دعم 30 يوم',
          ],
        },
        {
          name: 'VIP Custom',
          subtitle: 'حل مخصص بالكامل لعيادات طموحة',
          price: 'حسب الطلب',
          currency: '',
          badge: '',
          isHighlighted: false,
          isActive: true,
          displayOrder: 4,
          buttonText: 'تواصل معنا',
          features: [
            'تصميم مخصص بالكامل',
            'فروع متعددة',
            'أطباء متعددون',
            'CRM مخصص',
            'حملات واتساب',
            'تطبيق موبايل لاحقاً',
            'دعم وتسويق شهري',
          ],
        },
      ]);
      console.log('✅ Pricing packages seeded');
    } else {
      console.log('ℹ️  Pricing packages already exist');
    }

    // Testimonials
    const testCount = await Testimonial.countDocuments();
    if (testCount === 0) {
      await Testimonial.insertMany([
        {
          doctorName: 'د. سامر الخطيب',
          clinicName: 'عيادة الخطيب لطب الأسنان',
          location: 'دمشق، سوريا',
          rating: 5,
          text: 'النظام غيّر طريقة عملنا بالكامل. الحجوزات الأونلاين وفّرت علينا وقتاً كبيراً وزادت عدد المرضى.',
          image: '',
          isActive: true,
          displayOrder: 1,
        },
        {
          doctorName: 'د. ليلى حسن',
          clinicName: 'عيادة الابتسامة',
          location: 'عمّان، الأردن',
          rating: 5,
          text: 'لوحة التحكم سهلة الاستخدام جداً. أستطيع الآن متابعة المرضى والدفعات من مكان واحد.',
          image: '',
          isActive: true,
          displayOrder: 2,
        },
        {
          doctorName: 'د. محمد العمري',
          clinicName: 'مركز الأسنان الحديث',
          location: 'الرياض، السعودية',
          rating: 5,
          text: 'الاستثمار في هذا النظام كان من أفضل قراراتي. الموقع الاحترافي والحجز الأونلاين رفعا مستوى عيادتي.',
          image: '',
          isActive: true,
          displayOrder: 3,
        },
      ]);
      console.log('✅ Testimonials seeded');
    }

    // FAQs
    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      await FAQ.insertMany([
        { question: 'هل النظام SaaS مشترك؟', answer: 'لا، يتم تجهيز نسخة خاصة ومنفصلة لكل عيادة حسب هويتها واحتياجاتها. لا يوجد مشاركة في البيانات.', isActive: true, displayOrder: 1 },
        { question: 'هل أستطيع تغيير الألوان والصور؟', answer: 'نعم، يمكن تعديل الشعار، الألوان، الصور، النصوص، والخدمات من لوحة التحكم بكل سهولة.', isActive: true, displayOrder: 2 },
        { question: 'هل يوجد ربط واتساب؟', answer: 'نعم، في الباقات المتقدمة يمكن تفعيل تذكيرات واتساب وربط QR لإرسال رسائل تلقائية للمرضى.', isActive: true, displayOrder: 3 },
        { question: 'هل أحتاج خبرة تقنية لإدارة النظام؟', answer: 'لا، لوحة التحكم مصممة لتكون سهلة وبسيطة. نوفر أيضاً تدريباً كاملاً عند التسليم.', isActive: true, displayOrder: 4 },
        { question: 'هل يمكنني تجربة النظام قبل الشراء؟', answer: 'نعم، نوفر ديمو تجريبي كامل قبل الطلب حتى تتأكد من مناسبة النظام لعيادتك.', isActive: true, displayOrder: 5 },
        { question: 'كم يستغرق تجهيز النظام؟', answer: 'عادةً من 3 إلى 7 أيام عمل اعتماداً على الباقة وحجم التخصيص المطلوب.', isActive: true, displayOrder: 6 },
        { question: 'هل يوجد دعم فني بعد التسليم؟', answer: 'نعم، كل باقة تشمل فترة دعم فني. يمكن تمديد الدعم أو الاشتراك بخطة صيانة شهرية.', isActive: true, displayOrder: 7 },
        { question: 'هل يعمل النظام على الموبايل؟', answer: 'نعم، كل النظام متجاوب مع جميع الشاشات — موبايل، تابلت، وديسكتوب.', isActive: true, displayOrder: 8 },
      ]);
      console.log('✅ FAQs seeded');
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Email    : admin@prootech.com');
    console.log('Admin Password : (ADMIN_PASSWORD from .env)');
    console.log('Dashboard URL  : http://localhost:5180/product-admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();

const mongoose = require('mongoose');

const floatingCardSchema = new mongoose.Schema({ title: String, value: String, icon: String }, { _id: false });
const iconCardSchema = new mongoose.Schema({ icon: String, title: String, description: String }, { _id: false });
const featureItemSchema = new mongoose.Schema({
  icon: String, title: String, description: String,
  badge: String, isActive: { type: Boolean, default: true }, displayOrder: { type: Number, default: 0 },
}, { _id: false });
const workflowStepSchema = new mongoose.Schema({ number: Number, title: String, description: String, icon: String }, { _id: false });
const styleItemSchema = new mongoose.Schema({
  name: String, description: String,
  colors: [String], image: String,
  isActive: { type: Boolean, default: true }, displayOrder: { type: Number, default: 0 },
}, { _id: false });

const landingContentSchema = new mongoose.Schema({
  singleton: { type: String, default: 'main', unique: true },
  hero: {
    badge: { type: String, default: 'نظام جاهز للتخصيص' },
    title: { type: String, default: 'حوّل عيادتك إلى تجربة رقمية احترافية' },
    subtitle: { type: String, default: 'نظام متكامل لعيادات الأسنان يجمع الموقع، الحجز، إدارة المرضى، الدفعات، التقارير، ومعرض الأعمال في تجربة واحدة سهلة وفخمة.' },
    primaryButtonText: { type: String, default: 'شاهد الديمو' },
    primaryButtonLink: { type: String, default: '/demo' },
    secondaryButtonText: { type: String, default: 'اطلب نسخة لعيادتك' },
    secondaryButtonLink: { type: String, default: '/contact' },
    heroImage: { type: String, default: '' },
    floatingCards: { type: [floatingCardSchema], default: [
      { title: 'مريض جديد', value: '+12 اليوم', icon: 'Users' },
      { title: 'مواعيد', value: '8 قادمة', icon: 'Calendar' },
      { title: 'إيرادات', value: '2,400 $', icon: 'TrendingUp' },
    ]},
    badges: { type: [String], default: ['نظام جاهز للتخصيص', 'مناسب لدكاترة الأسنان', 'حجز ومواعيد وواتساب'] },
  },
  problem: {
    title: { type: String, default: 'هل ما زلت تدير عيادتك عبر الورق والواتساب فقط؟' },
    subtitle: { type: String, default: 'كثير من العيادات تعاني من نفس التحديات اليومية' },
    cards: { type: [iconCardSchema], default: [
      { icon: 'Calendar', title: 'مواعيد متداخلة', description: 'صعوبة تنظيم المواعيد وتداخلها يسبب إرباكاً للطبيب والمريض' },
      { icon: 'Users', title: 'متابعة المرضى', description: 'صعوبة متابعة سجلات المرضى وتاريخ علاجاتهم' },
      { icon: 'DollarSign', title: 'الدفعات والمديونيات', description: 'نسيان الدفعات والمديونيات يسبب خسائر مالية' },
      { icon: 'Globe', title: 'غياب الحضور الرقمي', description: 'عدم وجود موقع احترافي يفقد العيادة كثيراً من المرضى الجدد' },
      { icon: 'Image', title: 'معرض أعمال غير منظم', description: 'صور قبل/بعد مبعثرة على واتساب وبدون تنظيم' },
      { icon: 'Star', title: 'تجربة حجز ضعيفة', description: 'المرضى يحتاجون للاتصال للحجز بدلاً من الحجز أونلاين' },
    ]},
  },
  solution: {
    title: { type: String, default: 'نظام واحد ينظم عيادتك من أول حجز حتى آخر تقرير' },
    subtitle: { type: String, default: 'حلول متكاملة لكل تحدي تواجهه في إدارة عيادتك' },
    cards: { type: [iconCardSchema], default: [
      { icon: 'Calendar', title: 'استقبال الحجوزات', description: 'نظام حجز أونلاين يعمل 24/7 بدون انتظار' },
      { icon: 'Clock', title: 'إدارة المواعيد', description: 'تقويم ذكي منظم مع تنبيهات تلقائية' },
      { icon: 'Users', title: 'تنظيم المرضى', description: 'سجلات مرضى كاملة مع تاريخ العلاجات' },
      { icon: 'CreditCard', title: 'متابعة الدفعات', description: 'سجل مالي واضح مع تقارير شهرية' },
      { icon: 'Image', title: 'عرض الأعمال', description: 'معرض قبل/بعد احترافي ومنظم' },
      { icon: 'MessageCircle', title: 'تذكيرات واتساب', description: 'إرسال تذكيرات تلقائية للمرضى' },
    ]},
  },
  features: {
    title: { type: String, default: 'كل ما تحتاجه في نظام واحد' },
    subtitle: { type: String, default: 'ميزات متكاملة صُممت خصيصاً لعيادات الأسنان' },
    items: { type: [featureItemSchema], default: [
      { icon: 'Globe', title: 'موقع احترافي للعيادة', description: 'موقع إلكتروني أنيق يعكس هوية عيادتك', badge: '', isActive: true, displayOrder: 1 },
      { icon: 'Calendar', title: 'حجز مواعيد أونلاين', description: 'نظام حجز سهل يعمل على مدار الساعة', badge: 'جديد', isActive: true, displayOrder: 2 },
      { icon: 'LayoutDashboard', title: 'لوحة تحكم ذكية', description: 'إحصائيات وتقارير فورية بين يديك', badge: '', isActive: true, displayOrder: 3 },
      { icon: 'Users', title: 'إدارة المرضى', description: 'سجل شامل لكل مريض وتاريخه العلاجي', badge: '', isActive: true, displayOrder: 4 },
      { icon: 'Stethoscope', title: 'إدارة الخدمات', description: 'أضف وعدّل خدمات العيادة بسهولة', badge: '', isActive: true, displayOrder: 5 },
      { icon: 'Image', title: 'معرض قبل/بعد', description: 'اعرض إنجازاتك بشكل احترافي', badge: '', isActive: true, displayOrder: 6 },
      { icon: 'Clock', title: 'أوقات الدوام', description: 'حدد مواعيد العمل وإجازات التعقيم', badge: '', isActive: true, displayOrder: 7 },
      { icon: 'CreditCard', title: 'السجل المالي', description: 'تتبع الدفعات والمديونيات بدقة', badge: '', isActive: true, displayOrder: 8 },
      { icon: 'BarChart2', title: 'تقارير ورسوم بيانية', description: 'تقارير تفصيلية لأداء العيادة', badge: '', isActive: true, displayOrder: 9 },
      { icon: 'MessageCircle', title: 'تذكيرات واتساب', description: 'إرسال تذكيرات تلقائية للمرضى', badge: '', isActive: true, displayOrder: 10 },
      { icon: 'Edit3', title: 'إدارة المحتوى', description: 'عدّل نصوص وصور موقعك بسهولة', badge: '', isActive: true, displayOrder: 11 },
      { icon: 'Palette', title: 'ستايلات متعددة', description: 'اختر الهوية البصرية المناسبة لعيادتك', badge: '', isActive: true, displayOrder: 12 },
    ]},
  },
  workflow: {
    title: { type: String, default: 'كيف نجهز نظامك؟' },
    subtitle: { type: String, default: 'خمس خطوات بسيطة ونبدأ رحلتك الرقمية' },
    steps: { type: [workflowStepSchema], default: [
      { number: 1, title: 'نجهز نسخة خاصة بعيادتك', description: 'نبني نظاماً مخصصاً بناءً على احتياجاتك', icon: 'Settings' },
      { number: 2, title: 'نضيف هويتك وخدماتك', description: 'نضيف شعارك وألوانك وخدماتك وصورك', icon: 'Palette' },
      { number: 3, title: 'نربط الدومين والواتساب', description: 'ربط النطاق ورقم الواتساب لعيادتك', icon: 'Link' },
      { number: 4, title: 'ندرّبك على لوحة التحكم', description: 'جلسة تدريبية كاملة حتى تتقن النظام', icon: 'BookOpen' },
      { number: 5, title: 'تبدأ باستقبال الحجوزات', description: 'عيادتك جاهزة للانطلاق رقمياً', icon: 'Rocket' },
    ]},
  },
  dashboardPreview: {
    title: { type: String, default: 'لوحة تحكم متكاملة بين يديك' },
    subtitle: { type: String, default: 'كل ما تحتاجه لإدارة عيادتك في مكان واحد' },
    modules: { type: [iconCardSchema], default: [
      { icon: 'Calendar', title: 'المواعيد', description: 'تقويم ذكي لإدارة الحجوزات' },
      { icon: 'Users', title: 'المرضى', description: 'سجل شامل لجميع المرضى' },
      { icon: 'Stethoscope', title: 'الخدمات', description: 'إدارة خدمات العيادة' },
      { icon: 'Image', title: 'الأعمال', description: 'معرض قبل/بعد' },
      { icon: 'CreditCard', title: 'المالية', description: 'الدفعات والمديونيات' },
      { icon: 'BarChart2', title: 'التقارير', description: 'إحصائيات وتحليلات' },
      { icon: 'MessageCircle', title: 'واتساب', description: 'تذكيرات تلقائية' },
      { icon: 'Edit3', title: 'المحتوى', description: 'تعديل محتوى الموقع' },
      { icon: 'Shield', title: 'المستخدمون', description: 'إدارة الصلاحيات' },
      { icon: 'Settings', title: 'الإعدادات', description: 'تخصيص النظام' },
    ]},
  },
  stylesSection: {
    title: { type: String, default: 'اختر الهوية البصرية لعيادتك' },
    subtitle: { type: String, default: 'ستايلات جاهزة مصممة بعناية لعيادات الأسنان' },
    styles: { type: [styleItemSchema], default: [
      { name: 'Luxury Silver', description: 'أناقة فضية راقية تعكس الاحترافية', colors: ['#C9C9C9', '#1A1A2E', '#F7F7F4', '#8B8B8B'], image: '', isActive: true, displayOrder: 1 },
      { name: 'Medical Blue', description: 'ثقة طبية بلون أزرق هادئ', colors: ['#2D6BEB', '#FFFFFF', '#F0F5FF', '#1A3A7C'], image: '', isActive: true, displayOrder: 2 },
      { name: 'Premium Gold', description: 'ذهبي فاخر لعيادة متميزة', colors: ['#C9A84C', '#1C1C1C', '#FDF9F0', '#8B6914'], image: '', isActive: true, displayOrder: 3 },
      { name: 'Minimal White', description: 'نقاء أبيض بسيط وأنيق', colors: ['#333333', '#FFFFFF', '#F9F9F9', '#CCCCCC'], image: '', isActive: true, displayOrder: 4 },
      { name: 'Dark Luxury', description: 'داكن فاخر لإطلالة عصرية', colors: ['#C9B89A', '#18181B', '#27272A', '#71717A'], image: '', isActive: true, displayOrder: 5 },
    ]},
  },
  demo: {
    title: { type: String, default: 'جرّب النظام قبل الشراء' },
    subtitle: { type: String, default: 'نوفر ديمو تجريبي كامل لمدة 7 أيام' },
    demoUrl: { type: String, default: 'https://demo.prootech.agency' },
    demoEmail: { type: String, default: 'demo@clinic.com' },
    demoPassword: { type: String, default: 'Demo@2026' },
    showCredentials: { type: Boolean, default: true },
    notes: { type: String, default: 'الديمو يحتوي على بيانات تجريبية ويمكنك تجربة جميع الميزات بحرية.' },
    benefits: { type: [String], default: [
      'تجربة لوحة التحكم الكاملة',
      'مشاهدة طريقة الحجز الأونلاين',
      'تجربة التقارير والإحصائيات',
      'استعراض إدارة المرضى',
      'تجربة السجل المالي',
    ]},
  },
  cta: {
    title: { type: String, default: 'جاهز تنقل عيادتك لمستوى جديد؟' },
    subtitle: { type: String, default: 'احصل على نسخة مخصصة من نظام عيادة الأسنان الاحترافي وابدأ بتنظيم مواعيدك ومرضاك بطريقة أسهل وأفخم.' },
    primaryButtonText: { type: String, default: 'اطلب عرض سعر' },
    secondaryButtonText: { type: String, default: 'تواصل عبر واتساب' },
  },
  footer: {
    description: { type: String, default: 'نظام متكامل لعيادات الأسنان — موقع، حجز، مرضى، مالية، تقارير، وأكثر.' },
    quickLinks: { type: [{ label: String, href: String }], default: [
      { label: 'الرئيسية', href: '/' },
      { label: 'الميزات', href: '/features' },
      { label: 'الباقات', href: '/pricing' },
      { label: 'الديمو', href: '/demo' },
      { label: 'تواصل معنا', href: '/contact' },
    ]},
    servicesLinks: { type: [{ label: String, href: String }], default: [
      { label: 'موقع العيادة', href: '#' },
      { label: 'نظام الحجز', href: '#' },
      { label: 'إدارة المرضى', href: '#' },
      { label: 'السجل المالي', href: '#' },
    ]},
  },
}, { timestamps: true });

module.exports = mongoose.model('LandingContent', landingContentSchema);

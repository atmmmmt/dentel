require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Clinic = require('./src/models/Clinic');
const ClinicSettings = require('./src/models/ClinicSettings');
const LandingContent = require('./src/models/LandingContent');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  // Remove existing demo clinic if any
  await Clinic.deleteOne({ slug: 'demo' });

  // Create demo clinic
  const clinic = await Clinic.create({
    doctorName: 'د. ديمو',
    clinicName: 'عيادة الديمو التجريبية',
    slug: 'demo',
    email: 'demo@clinic.com',
    password: 'Demo@2026',
    phone: '0500000000',
    whatsapp: '0500000000',
    package: 'Professional',
    status: 'active',
    subscriptionStatus: 'active',
    onboardingCompleted: true,
    onboardingStep: 5,
    billingCycle: 'monthly',
    trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    activatedAt: new Date(),
  });

  // Remove existing settings
  await ClinicSettings.deleteOne({ clinicId: clinic._id });

  // Create clinic settings
  await ClinicSettings.create({
    clinicId: clinic._id,
    clinicNameAr: 'عيادة الديمو التجريبية',
    clinicNameEn: 'Demo Dental Clinic',
    phone: '0500000000',
    whatsapp: '0500000000',
    email: 'demo@clinic.com',
    heroTitle: 'مرحباً بك في عيادة الديمو',
    heroSubtitle: 'جرّب النظام الكامل بحرية',
    primaryColor: '#2563eb',
    metaTitle: 'عيادة الديمو | Prootech',
    metaDescription: 'ديمو تجريبي لنظام إدارة عيادات الأسنان',
    footerText: 'عيادة الديمو — Prootech Agency',
  });

  // Update landing content demo URL
  const landing = await LandingContent.findOne();
  if (landing) {
    landing.demo.demoUrl = 'http://localhost:5180/clinic/demo/login';
    landing.demo.demoEmail = 'demo@clinic.com';
    landing.demo.demoPassword = 'Demo@2026';
    await landing.save();
    console.log('Landing content updated');
  } else {
    // Create default landing content with updated demo URL
    await LandingContent.create({
      'demo.demoUrl': 'http://localhost:5180/clinic/demo/login',
      'demo.demoEmail': 'demo@clinic.com',
      'demo.demoPassword': 'Demo@2026',
    });
  }

  console.log('✅ Demo clinic created: slug = demo');
  console.log('   Login: demo@clinic.com / Demo@2026');
  console.log('   URL: http://localhost:5180/clinic/demo/login');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });

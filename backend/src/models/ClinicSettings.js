const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: String, description: String,
  price: String, duration: String,
  icon: String, image: String,
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { _id: true });

const workingHourSchema = new mongoose.Schema({
  day: String,          // الأحد، الاثنين...
  dayEn: String,        // sunday, monday...
  openTime: String,
  closeTime: String,
  isOpen: { type: Boolean, default: true },
}, { _id: false });

const galleryItemSchema = new mongoose.Schema({
  beforeImage: String,
  afterImage: String,
  title: String,
  description: String,
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { _id: true });

const clinicSettingsSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, unique: true },

  // Branding
  logo:      { type: String, default: '' },
  favicon:   { type: String, default: '' },
  selectedStyle: { type: String, default: 'Medical Blue' },

  // Colors
  primaryColor:   { type: String, default: '#2D6BEB' },
  secondaryColor: { type: String, default: '#FFFFFF' },
  accentColor:    { type: String, default: '#1A3A7C' },
  darkColor:      { type: String, default: '#18181B' },

  // Clinic Info
  clinicNameAr: { type: String, default: '' },
  clinicNameEn: { type: String, default: '' },
  tagline:      { type: String, default: '' },
  description:  { type: String, default: '' },
  address:      { type: String, default: '' },
  phone:        { type: String, default: '' },
  whatsapp:     { type: String, default: '' },
  email:        { type: String, default: '' },
  instagram:    { type: String, default: '' },
  facebook:     { type: String, default: '' },
  mapUrl:       { type: String, default: '' },

  // Hero
  heroTitle:    { type: String, default: '' },
  heroSubtitle: { type: String, default: '' },
  heroImage:    { type: String, default: '' },

  // SEO
  metaTitle:       { type: String, default: '' },
  metaDescription: { type: String, default: '' },

  // Footer
  footerText: { type: String, default: '' },

  // Content
  services:     { type: [serviceSchema],     default: [] },
  workingHours: { type: [workingHourSchema], default: [
    { day: 'الأحد',    dayEn: 'sunday',    openTime: '09:00', closeTime: '17:00', isOpen: true },
    { day: 'الاثنين',  dayEn: 'monday',    openTime: '09:00', closeTime: '17:00', isOpen: true },
    { day: 'الثلاثاء', dayEn: 'tuesday',   openTime: '09:00', closeTime: '17:00', isOpen: true },
    { day: 'الأربعاء', dayEn: 'wednesday', openTime: '09:00', closeTime: '17:00', isOpen: true },
    { day: 'الخميس',   dayEn: 'thursday',  openTime: '09:00', closeTime: '17:00', isOpen: true },
    { day: 'الجمعة',   dayEn: 'friday',    openTime: '09:00', closeTime: '14:00', isOpen: false },
    { day: 'السبت',    dayEn: 'saturday',  openTime: '09:00', closeTime: '14:00', isOpen: false },
  ]},
  chairs: { type: [{ name: { type: String, trim: true }, isActive: { type: Boolean, default: true } }], default: [{ name: 'الكرسي الرئيسي', isActive: true }] },
  closedDates: { type: [{ date: String, reason: String }], default: [] },
  gallery: { type: [galleryItemSchema], default: [] },

  // FAQ
  faqItems: { type: [{ question: String, answer: String, isActive: { type: Boolean, default: true } }], default: [] },

  // WhatsApp message
  whatsappBookingMessage: { type: String, default: 'مرحباً، أود حجز موعد في عيادتكم.' },

  // ── Waiting-room display screen (شاشة الانتظار) ──────────────────
  waitingScreen: {
    enabled:        { type: Boolean, default: true },
    welcomeMessage: { type: String, default: 'أهلاً وسهلاً بكم في عيادتنا' },
    showQueue:      { type: Boolean, default: true },
    showVideos:     { type: Boolean, default: true },
    showOffers:     { type: Boolean, default: true },
    showInfo:       { type: Boolean, default: true },
    callSound:      { type: Boolean, default: true },  // صوت تنبيه عند المناداة
    maskNames:      { type: Boolean, default: false }, // إخفاء اسم العائلة للخصوصية
    videos: { type: [{
      url:   { type: String, default: '' },   // رابط يوتيوب أو فيديو مباشر (mp4)
      title: { type: String, default: '' },
    }], default: [] },
    offers: { type: [{
      text:   { type: String, default: '' },
      active: { type: Boolean, default: true },
    }], default: [] },
  },
}, { timestamps: true });

module.exports = mongoose.model('ClinicSettings', clinicSettingsSchema);

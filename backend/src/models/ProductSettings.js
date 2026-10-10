const mongoose = require('mongoose');

const productSettingsSchema = new mongoose.Schema({
  singleton: { type: String, default: 'main', unique: true },
  productNameAr: { type: String, default: 'نظام عيادة الأسنان الاحترافي' },
  productNameEn: { type: String, default: 'Dental Clinic Pro System' },
  brandName: { type: String, default: 'Prootech Agency' },
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  primaryColor: { type: String, default: '#C9B89A' },
  secondaryColor: { type: String, default: '#23272B' },
  accentColor: { type: String, default: '#B49D78' },
  darkColor: { type: String, default: '#23272B' },
  fontArabic: { type: String, default: 'Cairo' },
  fontEnglish: { type: String, default: 'Inter' },
  loadingEnabled: { type: Boolean, default: true },
  loadingText: { type: String, default: 'نظام عيادة الأسنان الاحترافي' },
  whatsappNumber: { type: String, default: '' },
  whatsappMessage: { type: String, default: 'مرحباً Prootech، أرغب بالحصول على نسخة من نظام عيادة الأسنان الاحترافي ومعرفة الباقات والتفاصيل.' },
  phone: { type: String, default: '' },
  email: { type: String, default: 'info@prootech.agency' },
  instagram: { type: String, default: '' },
  facebook: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  metaTitle: { type: String, default: 'نظام عيادة الأسنان الاحترافي | Prootech Agency' },
  metaDescription: { type: String, default: 'نظام متكامل لعيادات الأسنان يجمع الموقع والحجز وإدارة المرضى والمالية والتقارير في تجربة واحدة.' },
  metaKeywords: { type: String, default: 'نظام عيادة أسنان, برنامج إدارة عيادة أسنان, موقع عيادة أسنان, حجز مواعيد' },
  ogImage: { type: String, default: '' },
  googleAnalyticsId: { type: String, default: '' },
  pixelId: { type: String, default: '' },
  robots: { type: String, default: 'index, follow' },
  footerDescription: { type: String, default: 'نظام متكامل لعيادات الأسنان — موقع، حجز، مرضى، مالية، تقارير، وأكثر.' },
  copyrightText: { type: String, default: '© 2026 Prootech Agency. جميع الحقوق محفوظة.' },
  // WhatsApp auto-reply (Prootech's own session)
  whatsappApiKey: { type: String, default: () => process.env.WA_OTP_KEY || '' },
  autoReplyEnabled: { type: Boolean, default: false },
  autoReplyMessage: { type: String, default: 'مرحباً {name} 👋\n\nشكراً لتواصلك مع Prootech!\n\nتم استلام طلبك بنجاح وسيقوم فريق الدعم بالتواصل معك في أقرب وقت ممكن.\n\n_فريق Prootech_ 🦷' },
  // WhatsApp session (WaOTP)
  waPhone:     { type: String, default: '' },   // رقم الواتساب المرتبط
  waConnected: { type: Boolean, default: false },
  waStatus:    { type: String, default: 'disconnected' }, // disconnected | qr | ready
  waQr:        { type: String, default: '' },   // آخر QR استُلم
}, { timestamps: true });

module.exports = mongoose.model('ProductSettings', productSettingsSchema);

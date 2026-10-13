const mongoose = require('mongoose');

const productSettingsSchema = new mongoose.Schema({
  singleton: { type: String, default: 'main', unique: true },
  productNameAr: { type: String, default: 'دينتوفي — منصة إدارة عيادات الأسنان' },
  productNameEn: { type: String, default: 'Dentovi' },
  brandName: { type: String, default: 'Prootech Agency' },
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  primaryColor: { type: String, default: '#0FB5A7' },
  secondaryColor: { type: String, default: '#0B2D4A' },
  accentColor: { type: String, default: '#A7EAD9' },
  darkColor: { type: String, default: '#23272B' },
  fontArabic: { type: String, default: 'Tajawal' },
  fontEnglish: { type: String, default: 'Inter' },
  loadingEnabled: { type: Boolean, default: true },
  loadingText: { type: String, default: 'Dentovi — منصة إدارة عيادات الأسنان' },
  whatsappNumber: { type: String, default: '' },
  whatsappMessage: { type: String, default: 'مرحباً، أرغب بالاستفسار عن نظام Dentovi لإدارة عيادات الأسنان والاشتراك السنوي.' },
  phone: { type: String, default: '' },
  email: { type: String, default: 'info@prootech.agency' },
  instagram: { type: String, default: '' },
  facebook: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  metaTitle: { type: String, default: 'Dentovi | منصة إدارة عيادات الأسنان' },
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

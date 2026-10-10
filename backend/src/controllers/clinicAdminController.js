const Clinic = require('../models/Clinic');
const ClinicSettings = require('../models/ClinicSettings');
const crypto = require('crypto');
const axios = require('axios');
const { assignDomain, runDomainCheck } = require('./clinicDashController');
const { removeDomainFromTunnel } = require('../utils/tunnelManager');
const { PLATFORM_HOST, requiredRecords } = require('../utils/domain');

// ── Helpers ────────────────────────────────────────────────────────

const AR_TO_LATIN = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a',
  'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'e', 'ؤ': 'o', 'ء': '',
};

// "عيادة النور" → "eyada-alnwr"; already-latin names stay readable.
const slugify = (text = '') => String(text)
  .toLowerCase()
  .replace(/[ً-ْ]/g, '')
  .split('').map(ch => AR_TO_LATIN[ch] ?? ch).join('')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .substring(0, 32);

const isValidSlug = (s) => /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(s);

async function uniqueSlug(base) {
  let slug = base || `clinic-${crypto.randomBytes(2).toString('hex')}`;
  if (!(await Clinic.exists({ slug }))) return slug;
  for (let i = 2; i < 50; i++) {
    const candidate = `${slug}-${i}`;
    if (!(await Clinic.exists({ slug: candidate }))) return candidate;
  }
  return `${slug}-${crypto.randomBytes(2).toString('hex')}`;
}

const makePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes, b => chars[b % chars.length]).join('') + '@' + (bytes[0] % 90 + 10);
};

const appUrl = (req) => (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || req.headers.origin || `https://${PLATFORM_HOST}`).replace(/\/$/, '');

// Doctors often type their name with the title already — avoid «د. د. أحمد».
const drName = (n = '') => 'د. ' + String(n).trim().replace(/^(د\.|دكتور|الدكتور|Dr\.?)\s*/i, '');

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '');

// Everything the doctor needs on day one, as data + a ready-to-send WhatsApp message.
function buildWelcomeKit(req, clinic, password) {
  const base = appUrl(req);
  const links = {
    login: `${base}/clinic/${clinic.slug}/login`,
    dashboard: `${base}/clinic/${clinic.slug}/dashboard`,
    site: clinic.domain ? `https://${clinic.domain}` : `${base}/clinic/${clinic.slug}`,
    booking: clinic.domain ? `https://${clinic.domain}/book` : `${base}/clinic/${clinic.slug}/book`,
    waitingScreen: `${base}/clinic/${clinic.slug}/waiting`,
  };
  const sub = clinic.subscriptionStatus === 'trial'
    ? `🎁 فترة تجريبية مجانية حتى ${fmtDate(clinic.trialEndDate)}`
    : clinic.billingCycle === 'lifetime'
      ? '♾️ اشتراك دائم مفعّل'
      : `✅ الاشتراك مفعّل حتى ${fmtDate(clinic.subscriptionEnd)}`;

  const lines = [
    `أهلاً ${drName(clinic.doctorName)} 👋`,
    '',
    `تم تجهيز نظام «${clinic.clinicName}» بنجاح وهو جاهز للعمل 🎉`,
    '',
    '🔐 *الدخول للوحة التحكم*',
    links.login,
    `📧 ${clinic.email}`,
    password ? `🔑 ${password}` : null,
    '',
    '🌐 *موقع عيادتك*',
    links.site,
    '📅 *رابط الحجز للمرضى* (ضعه في انستغرام وواتساب)',
    links.booking,
    '📺 *شاشة غرفة الانتظار* (افتحها على التلفاز)',
    links.waitingScreen,
    '',
    sub,
    '',
    '📲 نصيحة: افتح رابط الدخول من الموبايل واضغط «تثبيت التطبيق» ليصبح النظام على شاشتك ويعمل حتى بدون إنترنت.',
    '',
    'أي سؤال؟ نحن معك على هذا الرقم.',
    'فريق Prootech 💙',
  ].filter(l => l !== null);

  return {
    links,
    credentials: { email: clinic.email, password: password || null, slug: clinic.slug },
    subscription: {
      status: clinic.subscriptionStatus,
      trialEndDate: clinic.trialEndDate,
      subscriptionEnd: clinic.subscriptionEnd,
      billingCycle: clinic.billingCycle,
    },
    domain: clinic.domain ? { name: clinic.domain, connected: clinic.domainConnected, records: requiredRecords() } : null,
    message: lines.join('\n'),
  };
}

const whatsappLink = (phone, text) => {
  const num = String(phone || '').replace(/\D/g, '');
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : null;
};

async function sendViaProotechWhatsApp(phone, text) {
  const base = process.env.WA_SERVER_URL;
  const key = process.env.WA_SERVER_KEY;
  const session = process.env.WA_SESSION_ID;
  const num = String(phone || '').replace(/\D/g, '');
  if (!base || !session || !num) return false;
  try {
    await axios.post(`${base}/api/sendText`, { session, to: `${num}@c.us`, text }, { headers: { 'X-Api-Key': key }, timeout: 8000 });
    return true;
  } catch (err) {
    console.error('Welcome WhatsApp failed:', err.message);
    return false;
  }
}

function applyActivation(clinic, { activation, billingCycle, packagePrice, trialDays }) {
  const now = new Date();
  if (activation === 'paid') {
    // First paid activation = 13 months (12 + 1 free). Monthly = 1 month. Lifetime = no expiry.
    const end = new Date(now);
    if (billingCycle === 'lifetime') end.setFullYear(end.getFullYear() + 100);
    else end.setMonth(end.getMonth() + (billingCycle === 'monthly' ? 1 : 13));
    clinic.set({
      subscriptionStatus: 'active',
      subscriptionStart: now,
      subscriptionEnd: end,
      totalRevenue: Number(packagePrice) || 0,
    });
  } else {
    const days = Math.min(Math.max(Number(trialDays) || 15, 1), 90);
    clinic.set({ subscriptionStatus: 'trial', trialStartDate: now, trialEndDate: new Date(now.getTime() + days * 864e5) });
  }
}

// ── Endpoints ──────────────────────────────────────────────────────

exports.getClinics = async (req, res) => {
  try {
    const { search, status, package: pkg, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (pkg) query.package = pkg;
    if (search) {
      const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      query.$or = [{ doctorName: rx }, { clinicName: rx }, { email: rx }, { slug: rx }, { domain: rx }];
    }
    const total = await Clinic.countDocuments(query);
    const clinics = await Clinic.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, clinics, total, pages: Math.ceil(total / limit), domainConfig: { platformDomain: PLATFORM_HOST, records: requiredRecords() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });
    res.json({ success: true, clinic, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkSlug = async (req, res) => {
  const slug = slugify(req.query.slug || '');
  if (!isValidSlug(slug)) return res.json({ success: true, slug, available: false, reason: 'استخدم أحرف إنجليزية وأرقام وشرطة فقط (3 أحرف على الأقل)' });
  const taken = await Clinic.exists({ slug });
  res.json({ success: true, slug, available: !taken, suggestion: taken ? await uniqueSlug(slug) : slug });
};

exports.createClinic = async (req, res) => {
  try {
    const {
      doctorName, clinicName, email, phone, whatsapp, country, city, specialty,
      package: pkg, internalNotes, logo, slug: requestedSlug,
      activation = 'trial', trialDays, billingCycle = 'yearly', packagePrice,
      domain, domainNotes, domainCpanelUrl,
      waApiUrl, waApiKey, waSessionId,
      sendWhatsApp = true,
    } = req.body;

    if (!doctorName?.trim() || !clinicName?.trim() || !email?.trim())
      return res.status(400).json({ success: false, message: 'اسم الطبيب واسم العيادة والبريد مطلوبة' });
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صحيح' });
    if (await Clinic.exists({ email: email.trim().toLowerCase() }))
      return res.status(400).json({ success: false, message: 'هذا البريد مسجّل لعيادة أخرى' });

    let slug;
    if (requestedSlug) {
      slug = slugify(requestedSlug);
      if (!isValidSlug(slug)) return res.status(400).json({ success: false, message: 'رابط العيادة (slug) غير صالح' });
      if (await Clinic.exists({ slug })) return res.status(400).json({ success: false, message: `الرابط «${slug}» مستخدم — جرّب رابطاً آخر` });
    } else {
      slug = await uniqueSlug(slugify(clinicName) || slugify(doctorName) || slugify(email.split('@')[0]));
    }

    const rawPassword = makePassword();
    const clinic = new Clinic({
      doctorName: doctorName.trim(), clinicName: clinicName.trim(), slug, email,
      password: rawPassword,
      phone, whatsapp, country, city,
      package: pkg || 'Unified',
      logo: logo || '',
      status: 'active',
      internalNotes,
      activatedAt: new Date(),
      billingCycle: ['monthly', 'yearly', 'lifetime'].includes(billingCycle) ? billingCycle : 'yearly',
      packagePrice: Number(packagePrice) || 0,
      domainNotes: domainNotes || '',
      domainCpanelUrl: domainCpanelUrl || '',
      waApiUrl: waApiUrl || process.env.WA_SERVER_URL || '',
      waApiKey: waApiKey || process.env.WA_SERVER_KEY || '',
      waSessionId: waSessionId || slug,
      onboardingStep: 0,
    });
    applyActivation(clinic, { activation, billingCycle: clinic.billingCycle, packagePrice, trialDays });
    await clinic.save();

    await ClinicSettings.create({
      clinicId: clinic._id,
      clinicNameAr: clinic.clinicName,
      clinicNameEn: clinic.clinicName,
      doctorName: clinic.doctorName,
      logo: logo || '',
      phone, whatsapp, email,
      city,
      heroTitle: `ابتسامتك تبدأ في ${clinic.clinicName}`,
      heroSubtitle: specialty
        ? `${specialty} — رعاية أسنان دقيقة بأيدي ${drName(clinic.doctorName)}`
        : `رعاية أسنان متكاملة بأيدي ${drName(clinic.doctorName)}. احجز موعدك أونلاين خلال دقيقة.`,
      metaTitle: `${clinic.clinicName}${city ? ` | طبيب أسنان في ${city}` : ' | عيادة أسنان'}`,
      metaDescription: `${clinic.clinicName} — ${drName(clinic.doctorName)}${city ? ` في ${city}` : ''}. احجز موعدك أونلاين: تجميل، زراعة، تقويم وعلاج أسنان.`,
      footerText: `${clinic.clinicName} — نسعى دائماً لابتسامتك`,
    }).catch(err => {
      // Settings schema may not have every field — fall back to the essentials.
      console.warn('ClinicSettings create fallback:', err.message);
      return ClinicSettings.create({ clinicId: clinic._id, clinicNameAr: clinic.clinicName, clinicNameEn: clinic.clinicName, logo: logo || '', phone, whatsapp, email });
    });

    let domainError = null;
    if (domain) {
      const r = await assignDomain(clinic, domain);
      domainError = r.error || null;
    }

    const kit = buildWelcomeKit(req, clinic, rawPassword);
    const doctorPhone = whatsapp || phone;
    const whatsappSent = sendWhatsApp ? await sendViaProotechWhatsApp(doctorPhone, kit.message) : false;

    res.status(201).json({
      success: true,
      clinic,
      kit,
      whatsappSent,
      whatsappLink: whatsappLink(doctorPhone, kit.message),
      domainError,
      // legacy fields kept for older admin UIs
      credentials: kit.credentials,
      loginUrl: `/clinic/${slug}/login`,
      domain: clinic.domain || null,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو الرابط مسجّل مسبقاً' });
    res.status(400).json({ success: false, message: err.message });
  }
};

const EDITABLE = ['doctorName', 'clinicName', 'email', 'phone', 'whatsapp', 'country', 'city', 'package', 'packagePrice',
  'billingCycle', 'status', 'internalNotes', 'logo', 'domainNotes', 'domainCpanelUrl', 'domainConnected',
  'waApiUrl', 'waApiKey', 'waSessionId', 'domainHelpRequested'];

exports.updateClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    EDITABLE.forEach(k => { if (req.body[k] !== undefined) clinic[k] = req.body[k]; });
    await clinic.save({ validateBeforeSave: false });
    if (req.body.domain !== undefined && req.body.domain !== clinic.domain) {
      const { error } = await assignDomain(clinic, req.body.domain);
      if (error) return res.status(400).json({ success: false, message: error });
    }
    res.json({ success: true, clinic, domain: clinic.domain, platformDomain: PLATFORM_HOST, records: requiredRecords() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id).select('+password');
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    const newPassword = makePassword();
    clinic.password = newPassword;
    await clinic.save({ validateBeforeSave: false });
    const kit = buildWelcomeKit(req, clinic, newPassword);
    res.json({ success: true, newPassword, email: clinic.email, kit, whatsappLink: whatsappLink(clinic.whatsapp || clinic.phone, kit.message) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Welcome kit without credentials (password is hashed) — for re-sending links.
exports.getWelcomeKit = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    const kit = buildWelcomeKit(req, clinic, null);
    res.json({ success: true, kit, whatsappLink: whatsappLink(clinic.whatsapp || clinic.phone, kit.message) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndDelete(req.params.id);
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    if (clinic.domain) removeDomainFromTunnel(clinic.domain);
    await ClinicSettings.deleteOne({ clinicId: req.params.id });
    res.json({ success: true, message: 'تم حذف العيادة' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, active, pending, onboarded, domains, domainsLive, domainHelp, byPackage] = await Promise.all([
      Clinic.countDocuments(),
      Clinic.countDocuments({ status: 'active' }),
      Clinic.countDocuments({ status: 'pending' }),
      Clinic.countDocuments({ onboardingCompleted: true }),
      Clinic.countDocuments({ domain: { $ne: '' } }),
      Clinic.countDocuments({ domainConnected: true }),
      Clinic.countDocuments({ domainHelpRequested: true, domainConnected: { $ne: true } }),
      Clinic.aggregate([{ $group: { _id: '$package', count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, stats: { total, active, pending, onboarded, domains, domainsLive, domainHelp, byPackage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyDomain = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    if (!clinic.domain) return res.status(400).json({ success: false, message: 'لم يتم تعيين دومين' });
    const report = await runDomainCheck(clinic);
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

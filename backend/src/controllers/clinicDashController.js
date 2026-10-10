const ClinicSettings = require('../models/ClinicSettings');
const ClinicAppointment = require('../models/ClinicAppointment');
const Clinic = require('../models/Clinic');
const { cloudinary } = require('../config/cloudinary');

const toMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
};
const overlaps = (startA, endA, startB, endB) => startA < endB && startB < endA;

async function validateAppointment(clinicId, data, ignoreId) {
  if (!data.date || !data.time) return 'التاريخ والوقت مطلوبان';
  const settings = await ClinicSettings.findOne({ clinicId }, 'workingHours closedDates chairs');
  if (settings?.closedDates?.some(day => day.date === data.date)) return 'العيادة مغلقة في هذا التاريخ';
  const dayIndex = new Date(`${data.date}T12:00:00`).getDay();
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const hours = settings?.workingHours?.find(day => day.dayEn === dayKeys[dayIndex]);
  const start = toMinutes(data.time);
  const duration = Number(data.durationMinutes || 30);
  if (start === null || duration < 5) return 'وقت أو مدة الموعد غير صالحة';
  if (hours?.isOpen === false) return 'العيادة مغلقة في هذا اليوم';
  if (hours?.openTime && hours?.closeTime && (start < toMinutes(hours.openTime) || start + duration > toMinutes(hours.closeTime))) return 'الموعد خارج أوقات دوام العيادة';
  const chair = data.chair || 'الكرسي الرئيسي';
  const query = { clinicId, date: data.date, chair, status: { $nin: ['cancelled'] } };
  if (ignoreId) query._id = { $ne: ignoreId };
  const existing = await ClinicAppointment.find(query, 'time durationMinutes');
  if (existing.some(item => overlaps(start, start + duration, toMinutes(item.time), toMinutes(item.time) + Number(item.durationMinutes || 30)))) return `يوجد موعد متعارض على ${chair}`;
  return null;
}

// ── Clinic Info (public branding for login page) ─────────
exports.getClinicInfo = async (req, res) => {
  try {
    const clinic = req.clinic;
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id }, 'primaryColor logo clinicNameAr');
    res.json({
      success: true,
      info: {
        doctorName: clinic.doctorName,
        clinicName: clinic.clinicName,
        logo: clinic.logo || settings?.logo || '',
        primaryColor: settings?.primaryColor || '#1a1a1a',
        clinicNameAr: settings?.clinicNameAr || clinic.clinicName,
        domain: clinic.domain,
        subscriptionStatus: clinic.subscriptionStatus,
        package: clinic.package,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Settings ────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    let settings = await ClinicSettings.findOne({ clinicId: req.clinic._id });
    if (!settings) settings = await ClinicSettings.create({ clinicId: req.clinic._id });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await ClinicSettings.findOneAndUpdate(
      { clinicId: req.clinic._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Onboarding ───────────────────────────────────────────
exports.completeOnboardingStep = async (req, res) => {
  try {
    const { step, data } = req.body;
    const clinic = await Clinic.findById(req.clinic._id);

    // Update settings with step data
    if (data && Object.keys(data).length > 0) {
      await ClinicSettings.findOneAndUpdate(
        { clinicId: clinic._id },
        { $set: data },
        { upsert: true, new: true }
      );
    }

    // Advance step
    const nextStep = Math.max(clinic.onboardingStep, step + 1);
    const completed = nextStep >= 5;

    await Clinic.findByIdAndUpdate(clinic._id, {
      onboardingStep: nextStep,
      onboardingCompleted: completed,
      ...(completed ? { status: 'active' } : {}),
    });

    res.json({ success: true, nextStep, completed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Services ─────────────────────────────────────────────
exports.getServices = async (req, res) => {
  try {
    const s = await ClinicSettings.findOne({ clinicId: req.clinic._id }, 'services');
    res.json({ success: true, services: s?.services || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addService = async (req, res) => {
  try {
    const s = await ClinicSettings.findOneAndUpdate(
      { clinicId: req.clinic._id },
      { $push: { services: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, services: s.services });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const s = await ClinicSettings.findOne({ clinicId: req.clinic._id });
    if (!s) return res.status(404).json({ success: false, message: 'لا يوجد إعدادات' });
    const idx = s.services.findIndex(sv => sv._id.toString() === req.params.serviceId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    Object.assign(s.services[idx], req.body);
    await s.save();
    res.json({ success: true, services: s.services });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const s = await ClinicSettings.findOneAndUpdate(
      { clinicId: req.clinic._id },
      { $pull: { services: { _id: req.params.serviceId } } },
      { new: true }
    );
    res.json({ success: true, services: s.services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Working Hours ─────────────────────────────────────────
exports.getWorkingHours = async (req, res) => {
  try {
    const s = await ClinicSettings.findOne({ clinicId: req.clinic._id }, 'workingHours');
    res.json({ success: true, workingHours: s?.workingHours || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateWorkingHours = async (req, res) => {
  try {
    const s = await ClinicSettings.findOneAndUpdate(
      { clinicId: req.clinic._id },
      { $set: { workingHours: req.body.workingHours } },
      { new: true, upsert: true }
    );
    res.json({ success: true, workingHours: s.workingHours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Gallery ───────────────────────────────────────────────
exports.getGallery = async (req, res) => {
  try {
    const s = await ClinicSettings.findOne({ clinicId: req.clinic._id }, 'gallery');
    res.json({ success: true, gallery: s?.gallery || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addGalleryItem = async (req, res) => {
  try {
    const s = await ClinicSettings.findOneAndUpdate(
      { clinicId: req.clinic._id },
      { $push: { gallery: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, gallery: s.gallery });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  try {
    const s = await ClinicSettings.findOneAndUpdate(
      { clinicId: req.clinic._id },
      { $pull: { gallery: { _id: req.params.itemId } } },
      { new: true }
    );
    res.json({ success: true, gallery: s.gallery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Appointments ──────────────────────────────────────────
exports.getAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const query = { clinicId: req.clinic._id };
    if (status) query.status = status;
    if (date) query.date = date;
    const total = await ClinicAppointment.countDocuments(query);
    const appointments = await ClinicAppointment.find(query)
      .sort({ date: -1, time: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, appointments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const error = await validateAppointment(req.clinic._id, req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const appt = await ClinicAppointment.create({ ...req.body, clinicId: req.clinic._id });
    res.status(201).json({ success: true, appointment: appt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const current = await ClinicAppointment.findOne({ _id: req.params.id, clinicId: req.clinic._id });
    if (!current) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    const candidate = { ...current.toObject(), ...req.body };
    if (candidate.status !== 'cancelled') {
      const error = await validateAppointment(req.clinic._id, candidate, current._id);
      if (error) return res.status(400).json({ success: false, message: error });
    }
    const appt = await ClinicAppointment.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinic._id },
      req.body, { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    await ClinicAppointment.findOneAndDelete({ _id: req.params.id, clinicId: req.clinic._id });
    res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Waiting-room queue control ────────────────────────────
// نادِ المريض: يضبط calledAt=now فيصير هو "دورك الآن" على شاشة الانتظار
exports.callAppointment = async (req, res) => {
  try {
    const appt = await ClinicAppointment.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinic._id },
      { calledAt: new Date(), arrived: true },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// تبديل حالة "وصل" للمريض (بغرفة الانتظار)
exports.setArrived = async (req, res) => {
  try {
    const arrived = req.body.arrived !== false;
    const appt = await ClinicAppointment.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinic._id },
      { arrived, ...(arrived ? { arrivedAt: new Date() } : {}) },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Dashboard Stats ───────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const clinicId = req.clinic._id;
    const totalAppts = await ClinicAppointment.countDocuments({ clinicId });
    const pendingAppts = await ClinicAppointment.countDocuments({ clinicId, status: 'pending' });
    const todayAppts = await ClinicAppointment.countDocuments({
      clinicId, date: new Date().toISOString().split('T')[0]
    });
    const recentAppts = await ClinicAppointment.find({ clinicId }).sort({ createdAt: -1 }).limit(5);
    const settings = await ClinicSettings.findOne({ clinicId }, 'services');
    res.json({
      success: true,
      stats: { totalAppts, pendingAppts, todayAppts, servicesCount: settings?.services?.length || 0 },
      recentAppts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Image Upload ──────────────────────────────────────────
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع صورة' });
    res.json({ success: true, url: req.file.path, publicId: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Domain ──────────────────────────────────────────────
const { addDomainToTunnel, removeDomainFromTunnel } = require('../utils/tunnelManager');
const { PLATFORM_HOST, normalizeDomain, isValidDomain, isReservedDomain, diagnoseDomain, requiredRecords } = require('../utils/domain');

const domainPayload = (clinic) => ({
  domain: clinic.domain || '',
  domainConnected: clinic.domainConnected || false,
  domainLive: clinic.domainLive || false,
  domainCheckedAt: clinic.domainCheckedAt || null,
  domainHelpRequested: clinic.domainHelpRequested || false,
  platformDomain: PLATFORM_HOST,
  records: requiredRecords(),
  slug: clinic.slug,
});

exports.getDomainSettings = async (req, res) => {
  try {
    res.json({ success: true, ...domainPayload(req.clinic) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shared by the doctor's wizard and the admin panel.
exports.assignDomain = async (clinic, rawDomain) => {
  const cleaned = normalizeDomain(rawDomain);
  if (!cleaned) {
    if (clinic.domain) removeDomainFromTunnel(clinic.domain);
    clinic.set({ domain: '', domainConnected: false, domainLive: false });
    await clinic.save({ validateBeforeSave: false });
    return { clinic };
  }
  if (!isValidDomain(cleaned)) return { error: 'صيغة الدومين غير صحيحة — مثال صحيح: dr-ahmed.com' };
  if (isReservedDomain(cleaned)) return { error: 'لا يمكن استخدام هذا الدومين' };
  const existing = await Clinic.findOne({ domain: cleaned, _id: { $ne: clinic._id } });
  if (existing) return { error: 'هذا الدومين مستخدم من عيادة أخرى' };
  if (clinic.domain && clinic.domain !== cleaned) removeDomainFromTunnel(clinic.domain);
  clinic.set({ domain: cleaned, domainConnected: false, domainLive: false, domainCheckedAt: null });
  await clinic.save({ validateBeforeSave: false });
  addDomainToTunnel(cleaned);
  return { clinic };
};

exports.runDomainCheck = async (clinic) => {
  const report = await diagnoseDomain(clinic.domain, clinic.slug);
  clinic.set({ domainConnected: report.connected, domainLive: report.live, domainCheckedAt: report.checkedAt });
  await clinic.save({ validateBeforeSave: false });
  return report;
};

exports.saveDomain = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinic._id);
    const { error } = await exports.assignDomain(clinic, req.body.domain);
    if (error) return res.status(400).json({ success: false, message: error });
    res.json({ success: true, ...domainPayload(clinic) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyDomain = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinic._id);
    if (!clinic.domain) return res.status(400).json({ success: false, message: 'لم يتم حفظ الدومين بعد' });
    const report = await exports.runDomainCheck(clinic);
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Doctor asks Prootech to do the linking for them (gives us registrar access via WhatsApp).
exports.requestDomainHelp = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinic._id);
    clinic.set({
      domainHelpRequested: true,
      domainNotes: [clinic.domainNotes, `طلب مساعدة ربط (${new Date().toLocaleDateString('en-GB')}): ${req.body.note || ''}`].filter(Boolean).join('\n'),
    });
    await clinic.save({ validateBeforeSave: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Public: get clinic by custom domain ─────────────────
exports.getClinicByDomain = async (req, res) => {
  try {
    const domain = normalizeDomain(req.query.domain);
    if (!domain) return res.status(400).json({ success: false });
    const clinic = await Clinic.findOne({ domain, status: 'active' });
    if (!clinic) return res.status(404).json({ success: false, message: 'الدومين غير مرتبط بأي عيادة' });
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id }).select('logo clinicNameAr').lean();
    res.json({ success: true, slug: clinic.slug, clinicName: clinic.clinicName, logo: settings?.logo || clinic.logo || '' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

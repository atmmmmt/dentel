const Clinic = require('../models/Clinic');
const ClinicSettings = require('../models/ClinicSettings');
const ClinicAppointment = require('../models/ClinicAppointment');

const getClinic = async (slug) => {
  const clinic = await Clinic.findOne({ slug, status: 'active' });
  if (!clinic) throw { status: 404, message: 'العيادة غير موجودة' };
  return clinic;
};

exports.getClinicPublic = async (req, res) => {
  try {
    const clinic = await getClinic(req.params.slug);
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });
    res.json({
      success: true,
      clinic: { doctorName: clinic.doctorName, clinicName: clinic.clinicName, slug: clinic.slug, package: clinic.package },
      settings,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getClinicServices = async (req, res) => {
  try {
    const clinic = await getClinic(req.params.slug);
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });
    const services = (settings?.services || []).filter(s => s.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
    res.json({ success: true, services });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getClinicGallery = async (req, res) => {
  try {
    const clinic = await getClinic(req.params.slug);
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });
    let gallery = (settings?.gallery || []).filter(g => g.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
    if (req.query.featured) gallery = gallery.slice(0, 6);
    res.json({ success: true, cases: gallery });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getClinicFAQ = async (req, res) => {
  try {
    const clinic = await getClinic(req.params.slug);
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });
    const faqItems = (settings?.faqItems || []).filter(f => f.isActive !== false);
    res.json({ success: true, faqItems });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// ── Waiting-room display screen data ───────────────────────────────
// عام (بدون تسجيل دخول) — تفتحه شاشة غرفة الانتظار وتُحدّثه دورياً
exports.getWaitingScreen = async (req, res) => {
  try {
    const clinic = await getClinic(req.params.slug);
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });
    const ws = settings?.waitingScreen || {};

    const today = new Date().toISOString().split('T')[0];
    const appts = await ClinicAppointment.find({
      clinicId: clinic._id,
      date: today,
      status: { $in: ['pending', 'confirmed'] },
    }).sort({ time: 1 }).lean();

    const maskName = (name) => {
      if (!name) return '';
      if (!ws.maskNames) return name;
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      return parts[0] + ' ' + parts.slice(1).map(p => p[0] + '.').join(' ');
    };

    // "دورك الآن" = آخر موعد تمّت مناداته
    const called = appts.filter(a => a.calledAt).sort((x, y) => new Date(y.calledAt) - new Date(x.calledAt));
    const nowServing = called[0] || null;

    // الطابور = المواعيد اللي لسا ما انتهت، بترتيب الوقت
    const queue = appts.map((a, i) => ({
      _id: a._id,
      order: i + 1,
      name: maskName(a.patientName),
      time: a.time,
      service: a.service || '',
      arrived: !!a.arrived,
      isServing: nowServing && String(a._id) === String(nowServing._id),
    }));

    res.json({
      success: true,
      clinic: {
        doctorName: clinic.doctorName,
        clinicName: settings?.clinicNameAr || clinic.clinicName,
        logo: settings?.logo || clinic.logo || '',
        phone: settings?.phone || clinic.phone || '',
        whatsapp: settings?.whatsapp || '',
        address: settings?.address || '',
        primaryColor: settings?.primaryColor || '#2D6BEB',
        accentColor: settings?.accentColor || '#1A3A7C',
      },
      workingHours: settings?.workingHours || [],
      waitingScreen: {
        enabled:        ws.enabled !== false,
        welcomeMessage: ws.welcomeMessage || 'أهلاً وسهلاً بكم في عيادتنا',
        showQueue:      ws.showQueue !== false,
        showVideos:     ws.showVideos !== false,
        showOffers:     ws.showOffers !== false,
        showInfo:       ws.showInfo !== false,
        callSound:      ws.callSound !== false,
        videos: (ws.videos || []).filter(v => v.url),
        offers: (ws.offers || []).filter(o => o.active !== false && o.text),
      },
      nowServing: nowServing ? {
        _id: nowServing._id,
        name: maskName(nowServing.patientName),
        service: nowServing.service || '',
        calledAt: nowServing.calledAt,
      } : null,
      queue,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getClinicAvailability = async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    const clinic = await getClinic(req.params.slug);
    const settings = await ClinicSettings.findOne({ clinicId: clinic._id });

    if (!date) return res.json({ success: true, slots: [] });

    const d = new Date(date);
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayEn = days[d.getDay()];
    const wh = (settings?.workingHours || []).find(h => h.dayEn === dayEn);

    if (!wh || !wh.isOpen) return res.json({ success: true, slots: [] });

    // Generate slots every 30 minutes between open/close
    const slots = [];
    const [openH, openM] = wh.openTime.split(':').map(Number);
    const [closeH, closeM] = wh.closeTime.split(':').map(Number);
    let cur = openH * 60 + openM;
    const end = closeH * 60 + closeM;
    while (cur + 30 <= end) {
      const h = String(Math.floor(cur / 60)).padStart(2, '0');
      const m = String(cur % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
      cur += 30;
    }

    // Remove booked slots
    const booked = await ClinicAppointment.find({
      clinicId: clinic._id, date, status: { $nin: ['cancelled'] },
    }).select('time');
    const bookedTimes = new Set(booked.map(a => a.time));
    const available = slots.filter(s => !bookedTimes.has(s));

    res.json({ success: true, slots: available });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const clinic = await getClinic(req.params.slug);
    const appt = await ClinicAppointment.create({ ...req.body, clinicId: clinic._id, source: 'website' });
    res.status(201).json({ success: true, appointment: appt, message: 'تم إرسال طلب الحجز بنجاح' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

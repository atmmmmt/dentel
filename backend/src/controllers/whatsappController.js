const Clinic = require('../models/Clinic');
const axios = require('axios');

// Build axios instance for a clinic's WA server
const waClient = (clinic) => {
  const base = clinic.waApiUrl || process.env.WA_SERVER_URL || '';
  const key  = clinic.waApiKey  || process.env.WA_SERVER_KEY  || '';
  return axios.create({
    baseURL: base,
    headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
    timeout: 10000,
  });
};

// ── Get QR code for clinic's WhatsApp session ────────────────────────────
exports.getQR = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinic._id);
    if (!clinic.waSessionId) return res.status(400).json({ success: false, message: 'لم يتم تعيين Session ID بعد' });

    const client = waClient(clinic);
    const response = await client.get(`/api/${clinic.waSessionId}/auth/qr`);

    res.json({ success: true, qr: response.data });
  } catch (err) {
    res.status(502).json({ success: false, message: 'تعذر الاتصال بسيرفر واتساب: ' + err.message });
  }
};

// ── Get connection status ─────────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinic._id);
    if (!clinic.waSessionId) return res.json({ success: true, connected: false, status: 'no_session' });

    const client = waClient(clinic);
    const response = await client.get(`/api/${clinic.waSessionId}/status`);

    const connected = response.data?.status === 'WORKING' || response.data?.connected === true;
    if (connected && !clinic.waConnected) {
      clinic.waConnected = true;
      clinic.waConnectedAt = new Date();
      await clinic.save({ validateBeforeSave: false });
    }

    res.json({ success: true, connected, raw: response.data });
  } catch (err) {
    res.json({ success: true, connected: false, status: 'offline', message: err.message });
  }
};

// ── Send test message ─────────────────────────────────────────────────────
exports.sendTest = async (req, res) => {
  try {
    const { phone } = req.body;
    const clinic = await Clinic.findById(req.clinic._id);
    if (!clinic.waSessionId) return res.status(400).json({ success: false, message: 'لا يوجد session' });

    const client = waClient(clinic);
    await client.post('/api/sendText', {
      session: clinic.waSessionId,
      to: `${phone.replace(/\D/g, '')}@c.us`,
      text: `مرحباً من ${clinic.clinicName} 👋\nهذه رسالة تجريبية للتأكد من ربط واتساب بنجاح.`,
    });

    res.json({ success: true, message: 'تم إرسال الرسالة التجريبية' });
  } catch (err) {
    res.status(502).json({ success: false, message: 'فشل الإرسال: ' + err.message });
  }
};

// ── Update WA settings (phone only from clinic side) ─────────────────────
exports.updateWaPhone = async (req, res) => {
  try {
    const { waPhone } = req.body;
    await Clinic.findByIdAndUpdate(req.clinic._id, { waPhone });
    res.json({ success: true, message: 'تم حفظ الرقم' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get WA info for clinic dashboard ─────────────────────────────────────
exports.getWaInfo = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinic._id);
    res.json({
      success: true,
      waConnected: clinic.waConnected,
      waPhone: clinic.waPhone,
      waConnectedAt: clinic.waConnectedAt,
      hasSession: !!clinic.waSessionId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Send appointment reminder (clinic dashboard) ──────────────────────────
exports.sendReminder = async (req, res) => {
  try {
    const { patientPhone, patientName, date, time, service } = req.body;
    const clinic = await Clinic.findById(req.clinic._id);
    if (!clinic.waSessionId || !clinic.waConnected) {
      return res.status(400).json({ success: false, message: 'واتساب غير مربوط' });
    }

    const client = waClient(clinic);
    const msg = `مرحباً ${patientName} 👋\nتذكير بموعدك في ${clinic.clinicName}\n📅 ${date} — 🕐 ${time}${service ? `\n🦷 ${service}` : ''}\n\nفي حال الرغبة بتغيير الموعد، تواصل معنا.`;

    await client.post('/api/sendText', {
      session: clinic.waSessionId,
      to: `${patientPhone.replace(/\D/g, '')}@c.us`,
      text: msg,
    });

    res.json({ success: true, message: 'تم إرسال التذكير' });
  } catch (err) {
    res.status(502).json({ success: false, message: 'فشل الإرسال: ' + err.message });
  }
};

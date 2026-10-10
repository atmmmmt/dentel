const axios = require('axios');
const ProductSettings = require('../models/ProductSettings');

const { BASE: WA_BASE, toE164 } = require('../services/platformWhatsApp');
const WA_KEY  = process.env.WA_OTP_KEY || '';

const waHeaders = { 'x-api-key': WA_KEY, 'Content-Type': 'application/json' };

// ── Extract QR from any field the API returns ───────────────────────
function extractQr(data) {
  return data.qrDataUrl || data.qr || data.qrCode || data.qr_code || data.qr_image || '';
}

function extractStatus(data) {
  const s = data.status || '';
  const isReady = s === 'ready' || data.isConnected === true || data.connected === true;
  const hasQr   = s === 'qr_ready' || s === 'qr' || !!extractQr(data);
  if (isReady) return 'ready';
  if (hasQr)   return 'qr';
  return 'disconnected';
}

// ── Start session & get QR ──────────────────────────────────────────
exports.startSession = async (req, res) => {
  try {
    const r = await axios.post(`${WA_BASE}/whatsapp/session/start`, {}, { headers: waHeaders, timeout: 15000 });
    const data = r.data;
    const qr     = extractQr(data);
    const status = extractStatus(data);

    await ProductSettings.findOneAndUpdate(
      { singleton: 'main' },
      { waStatus: status, waConnected: false, waQr: qr },
      { upsert: true }
    );

    res.json({ success: true, qr, status });

    // If no QR yet, fetch status in background and update DB
    if (!qr) {
      axios.get(`${WA_BASE}/whatsapp/session/status`, { headers: waHeaders, timeout: 20000 })
        .then(async r2 => {
          const qr2 = extractQr(r2.data);
          const st2 = extractStatus(r2.data);
          if (qr2) {
            await ProductSettings.findOneAndUpdate(
              { singleton: 'main' },
              { waStatus: st2, waQr: qr2 },
              { upsert: true }
            ).catch(() => {});
          }
        }).catch(() => {});
    }
  } catch (err) {
    console.error('[WA start]', err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
};

// ── Check session status — returns DB instantly, polls API in background ──
exports.getStatus = async (req, res) => {
  // 1. Return cached DB value immediately (fast response)
  const cached = await ProductSettings.findOne({ singleton: 'main' }).catch(() => null);
  res.json({
    success:     true,
    status:      cached?.waStatus     || 'disconnected',
    qr:          cached?.waQr         || '',
    phone:       cached?.waPhone      || '',
    waConnected: cached?.waConnected  || false,
  });

  // 2. Update DB from external API in background (non-blocking)
  axios.get(`${WA_BASE}/whatsapp/session/status`, { headers: waHeaders, timeout: 20000 })
    .then(async r => {
      const data    = r.data;
      const qr      = extractQr(data);
      const status  = extractStatus(data);
      const phone   = data.phoneNumber || data.phone || '';
      const isReady = status === 'ready';

      await ProductSettings.findOneAndUpdate(
        { singleton: 'main' },
        {
          waStatus:    status,
          waConnected: isReady,
          waQr:        isReady ? '' : (qr || cached?.waQr || ''),
          ...(phone ? { waPhone: phone } : {}),
        },
        { upsert: true }
      ).catch(() => {});
    })
    .catch(err => console.error('[WA status bg]', err.message));
};

// ── Disconnect session ──────────────────────────────────────────────
exports.disconnect = async (req, res) => {
  try {
    await axios.post(`${WA_BASE}/whatsapp/session/disconnect`, {}, { headers: waHeaders, timeout: 10000 });

    await ProductSettings.findOneAndUpdate(
      { singleton: 'main' },
      { waStatus: 'disconnected', waConnected: false, waQr: '', waPhone: '' },
      { upsert: true }
    );

    res.json({ success: true, message: 'تم فصل الجلسة' });
  } catch (err) {
    console.error('[WA disconnect]', err.response?.data || err.message);
    // Even if API fails, reset locally
    await ProductSettings.findOneAndUpdate(
      { singleton: 'main' },
      { waStatus: 'disconnected', waConnected: false, waQr: '', waPhone: '' },
      { upsert: true }
    ).catch(() => {});
    res.json({ success: true, message: 'تم إعادة تعيين الجلسة' });
  }
};

// ── Send test message ───────────────────────────────────────────────
exports.sendTest = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });

    const r = await axios.post(`${WA_BASE}/whatsapp/send`, {
      phoneNumber: toE164(phoneNumber),
      message: '✅ اختبار ناجح من منصة Prootech!\n\nالواتساب متصل وجاهز للإرسال 🎉',
    }, { headers: waHeaders, timeout: 15000 });

    res.json({ success: true, message: 'تم الإرسال بنجاح', raw: r.data });
  } catch (err) {
    console.error('[WA test]', err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
};

// ── Get saved WA info from DB ───────────────────────────────────────
exports.getWaInfo = async (req, res) => {
  try {
    const s = await ProductSettings.findOne({ singleton: 'main' });
    res.json({
      success: true,
      waPhone:     s?.waPhone || '',
      waConnected: s?.waConnected || false,
      waStatus:    s?.waStatus || 'disconnected',
      waQr:        s?.waQr || '',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

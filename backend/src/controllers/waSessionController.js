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
  const s = String(data.status || '').toLowerCase();
  // after the scan WhatsApp needs a few seconds to pair — keep the page waiting, don't drop to 'disconnected'
  if (['authenticated', 'connecting', 'pairing', 'syncing', 'opening', 'loading'].includes(s)) return 'connecting';
  if (['auth_failure', 'logged_out', 'logout', 'failed'].includes(s)) return 'failed';
  const isReady = s === 'ready' || data.isConnected === true || data.connected === true;
  const hasQr   = s === 'qr_ready' || s === 'qr' || !!extractQr(data);
  if (isReady) return 'ready';
  if (hasQr)   return 'qr';
  return 'disconnected';
}

// Live session snapshot from VAYRO (the QR rotates every ~20–60 s, so never serve a stale copy).
async function liveSnapshot() {
  const r = await axios.get(`${WA_BASE}/whatsapp/session/status`, { headers: waHeaders, timeout: 15000 });
  const data = r.data;
  const status = extractStatus(data);
  return { status, qr: status === 'ready' ? '' : extractQr(data), phone: data.phoneNumber || data.phone || '', raw: data };
}

function saveSnapshot(snap) {
  return ProductSettings.findOneAndUpdate(
    { singleton: 'main' },
    { waStatus: snap.status, waConnected: snap.status === 'ready', waQr: snap.qr, ...(snap.phone ? { waPhone: snap.phone } : {}) },
    { upsert: true }
  ).catch(() => {});
}

// ── Start session & get QR ──────────────────────────────────────────
exports.startSession = async (req, res) => {
  try {
    // A session that is already waiting for a scan (or connected) must NOT be restarted —
    // restarting invalidates the QR the user is scanning.
    let snap = await liveSnapshot().catch(() => null);
    // A previous link that was logged out leaves stale credentials on the server — WhatsApp rejects
    // every new scan until they are cleared. Reset first, then ask for a fresh QR.
    const stale = snap && (snap.status === 'failed' || snap.raw?.lastDisconnectReason === 'LOGOUT') && snap.status !== 'ready' && snap.status !== 'qr';
    if (stale || req.body?.reset) {
      await axios.post(`${WA_BASE}/whatsapp/session/disconnect`, {}, { headers: waHeaders, timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));
      snap = null;
    }
    if (!snap || snap.status === 'disconnected' || snap.status === 'failed') {
      await axios.post(`${WA_BASE}/whatsapp/session/start`, {}, { headers: waHeaders, timeout: 20000 });
      for (let i = 0; i < 6; i++) {               // wait up to ~9 s for the first QR
        snap = await liveSnapshot().catch(() => null);
        if (snap && (snap.qr || snap.status === 'ready')) break;
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    if (!snap) return res.status(502).json({ success: false, message: 'تعذّر الوصول إلى خادم الواتساب' });
    saveSnapshot(snap);
    res.json({ success: true, status: snap.status, qr: snap.qr, phone: snap.phone });
  } catch (err) {
    console.error('[WA start]', err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
};

// ── Check session status (live) ─────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const snap = await liveSnapshot();
    saveSnapshot(snap);
    res.json({ success: true, status: snap.status, qr: snap.qr, phone: snap.phone, waConnected: snap.status === 'ready' });
  } catch (err) {
    const cached = await ProductSettings.findOne({ singleton: 'main' }).catch(() => null);
    res.json({ success: true, stale: true, status: cached?.waStatus || 'disconnected', qr: '', phone: cached?.waPhone || '', waConnected: !!cached?.waConnected });
  }
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

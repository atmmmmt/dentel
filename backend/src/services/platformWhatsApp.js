/**
 * Prootech's own WhatsApp number (VAYRO API) — used for messages from the platform to doctors:
 * welcome kit, renewal reminders, suspension notices and admin tests.
 * Docs: https://api.vayro-wa.com/docs — auth header `x-api-key`.
 */
const axios = require('axios');

const BASE = (process.env.WA_PLATFORM_API || 'https://api.vayro-wa.com/v1').replace(/\/$/, '');
const KEY = process.env.WA_OTP_KEY || '';

const headers = () => ({ 'x-api-key': KEY, 'Content-Type': 'application/json' });

// "0964 770-123 4567" → "+9647701234567"
const toE164 = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^00/, '');
  return digits ? `+${digits}` : '';
};

const configured = () => !!KEY;

const startSession = () => axios.post(`${BASE}/whatsapp/session/start`, {}, { headers: headers(), timeout: 20000 }).then(r => r.data);
const sessionStatus = () => axios.get(`${BASE}/whatsapp/session/status`, { headers: headers(), timeout: 20000 }).then(r => r.data);
const disconnectSession = () => axios.post(`${BASE}/whatsapp/session/disconnect`, {}, { headers: headers(), timeout: 15000 }).then(r => r.data);

/** Sends a text message. Returns true on success, false otherwise (never throws). */
async function sendPlatformMessage(phone, message) {
  const phoneNumber = toE164(phone);
  if (!configured() || !phoneNumber || !message) return false;
  try {
    await axios.post(`${BASE}/whatsapp/send`, { phoneNumber, message }, { headers: headers(), timeout: 20000 });
    return true;
  } catch (err) {
    console.error('[platform WhatsApp]', err.response?.data?.message || err.message);
    return false;
  }
}

module.exports = { BASE, toE164, configured, startSession, sessionStatus, disconnectSession, sendPlatformMessage };

const axios = require('axios');
const { BASE, toE164 } = require('./platformWhatsApp');

// Auto-reply to new leads from the platform number (VAYRO). The .env key wins; a key saved in the admin
// settings is used only when no server key is set in .env.
async function sendWhatsApp(phone, message, apiKey) {
  const key = process.env.WA_OTP_KEY || apiKey;
  if (!key) throw new Error('WhatsApp API Key غير مضبوط');
  const res = await axios.post(`${BASE}/whatsapp/send`, { phoneNumber: toE164(phone), message }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    timeout: 15000,
  });
  return res.data;
}

function buildThankYouMessage(template, name) {
  return template.replace(/{name}/g, name || 'دكتور');
}

module.exports = { sendWhatsApp, buildThankYouMessage };

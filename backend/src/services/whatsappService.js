const axios = require('axios');

const BASE = 'https://api.prootech-cloud.com/v1';

async function sendWhatsApp(phone, message, apiKey) {
  if (!apiKey) throw new Error('WhatsApp API Key غير مضبوط');
  let normalized = String(phone).replace(/\s/g, '');
  if (!normalized.startsWith('+')) normalized = '+' + normalized;

  const res = await axios.post(`${BASE}/whatsapp/send`, { phoneNumber: normalized, message }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    timeout: 15000,
  });
  return res.data;
}

function buildThankYouMessage(template, name) {
  return template.replace(/{name}/g, name || 'دكتور');
}

module.exports = { sendWhatsApp, buildThankYouMessage };

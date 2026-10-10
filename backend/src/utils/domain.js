const dns = require('dns').promises;
const axios = require('axios');

// The host every clinic domain points to. Overridable per deployment.
const PLATFORM_HOST = (process.env.PLATFORM_HOST || 'dash-dintist.euphoria-motiva.com').toLowerCase();
// Optional static IPs for registrars that only accept A records on the apex (comma separated).
const PLATFORM_IPS = (process.env.PLATFORM_IPS || '').split(',').map(s => s.trim()).filter(Boolean);

// "https://WWW.Dr-Ahmed.com/about" → "dr-ahmed.com"
function normalizeDomain(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .replace(/^www\./, '');
}

function isValidDomain(domain) {
  return /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain);
}

// Reserved hostnames that must never be claimed by a clinic.
function isReservedDomain(domain) {
  return domain === PLATFORM_HOST || domain.endsWith(`.${PLATFORM_HOST}`) || ['localhost', 'prootech-cloud.com', 'euphoria-motiva.com'].includes(domain);
}

const PROVIDERS = [
  { id: 'cloudflare', name: 'Cloudflare', match: /cloudflare/, panel: 'https://dash.cloudflare.com' },
  { id: 'godaddy', name: 'GoDaddy', match: /domaincontrol|godaddy/, panel: 'https://dcc.godaddy.com/control/portfolio' },
  { id: 'namecheap', name: 'Namecheap', match: /registrar-servers|namecheap/, panel: 'https://ap.www.namecheap.com/domains/list' },
  { id: 'hostinger', name: 'Hostinger', match: /hostinger|dns-parking/, panel: 'https://hpanel.hostinger.com/domains' },
  { id: 'google', name: 'Google / Squarespace', match: /googledomains|squarespace/, panel: 'https://account.squarespace.com/domains' },
];

async function safe(fn) {
  try { return await fn(); } catch { return []; }
}

async function detectProvider(domain) {
  const ns = await safe(() => dns.resolveNs(domain));
  const joined = ns.join(' ').toLowerCase();
  const found = PROVIDERS.find(p => p.match.test(joined));
  return { nameservers: ns, provider: found ? { id: found.id, name: found.name, panel: found.panel } : { id: 'other', name: 'شركة أخرى', panel: '' } };
}

async function platformIps() {
  if (PLATFORM_IPS.length) return PLATFORM_IPS;
  return safe(() => dns.resolve4(PLATFORM_HOST));
}

// Does a hostname route to the platform? Accepts CNAME (direct or flattened) or matching A records.
async function checkHost(host, targetIps) {
  const cname = await safe(() => dns.resolveCname(host));
  const a = await safe(() => dns.resolve4(host));
  const viaCname = cname.some(r => r.toLowerCase().replace(/\.$/, '') === PLATFORM_HOST);
  const viaA = a.length > 0 && targetIps.length > 0 && a.some(ip => targetIps.includes(ip));
  return { host, cname, a, ok: viaCname || viaA, method: viaCname ? 'CNAME' : viaA ? 'A' : null };
}

// Final proof: the domain actually serves this clinic through the platform.
async function checkLive(domain, slug) {
  for (const host of [domain, `www.${domain}`]) {
    for (const proto of ['https', 'http']) {
      try {
        const r = await axios.get(`${proto}://${host}/api/clinic/by-domain`, { params: { domain: host }, timeout: 6000, maxRedirects: 3 });
        if (r.data?.slug === slug) return { ok: true, url: `${proto}://${host}`, ssl: proto === 'https' };
      } catch { /* try next */ }
    }
  }
  return { ok: false };
}

/**
 * Full diagnosis used by both the doctor's domain wizard and the admin panel.
 * connected = the root or www routes to us (DNS) — live = the site is actually reachable.
 */
async function diagnoseDomain(domain, slug) {
  const ips = await platformIps();
  const [root, www, providerInfo] = await Promise.all([
    checkHost(domain, ips),
    checkHost(`www.${domain}`, ips),
    detectProvider(domain),
  ]);
  const registered = providerInfo.nameservers.length > 0 || root.a.length > 0 || root.cname.length > 0;
  // Proxied DNS (e.g. Cloudflare orange cloud) hides the CNAME, so the live HTTP probe is the real proof.
  const live = registered ? await checkLive(domain, slug) : { ok: false };
  const connected = root.ok || www.ok || live.ok;

  let hint = '';
  if (!registered) hint = 'الدومين غير مفعّل أو غير مسجل بعد — تأكد من شرائه وتفعيله لدى الشركة.';
  else if (!connected) hint = 'لم نجد السجلات بعد. إذا أضفتها للتو انتظر 5–30 دقيقة ثم أعد الفحص.';
  else if (live.ok && !root.ok && !www.ok) hint = '';
  else if (!root.ok) hint = 'www مربوط ✓ — يُفضّل أيضاً تحويل الدومين الأساسي (@) إلى www حتى يعمل الرابطان.';
  else if (!live.ok) hint = 'السجلات صحيحة ✓ — جاري تفعيل شهادة الأمان (SSL)، عادةً خلال دقائق.';

  return {
    domain,
    platformHost: PLATFORM_HOST,
    platformIps: PLATFORM_IPS,
    registered,
    connected,
    live: live.ok,
    liveUrl: live.url || null,
    ssl: !!live.ssl,
    root, www,
    ...providerInfo,
    hint,
    checkedAt: new Date(),
  };
}

// The exact records a doctor (or we) must add — single source of truth for all UIs.
function requiredRecords() {
  const records = [
    { type: 'CNAME', host: 'www', value: PLATFORM_HOST, required: true, note: 'الرابط الأساسي للموقع' },
  ];
  if (PLATFORM_IPS.length) {
    PLATFORM_IPS.forEach(ip => records.push({ type: 'A', host: '@', value: ip, required: true, note: 'الدومين بدون www' }));
  } else {
    records.push({ type: 'CNAME', host: '@', value: PLATFORM_HOST, required: false, note: 'إن لم تسمح الشركة بـ CNAME على @ استخدم "Forwarding / تحويل" إلى www' });
  }
  return records;
}

module.exports = { PLATFORM_HOST, normalizeDomain, isValidDomain, isReservedDomain, diagnoseDomain, requiredRecords };

const fs = require('fs');
const { execSync } = require('child_process');

const CONFIG_PATH = '/home/abdalqader/.cloudflared/config.yml';
const PLATFORM_PORT = 5100;
const CATCH_ALL = '  - service: http_status:404';

function readConfig() {
  return fs.readFileSync(CONFIG_PATH, 'utf8');
}

function writeConfig(content) {
  fs.writeFileSync(CONFIG_PATH, content, 'utf8');
}

const TUNNEL_ID = '4b96e1f2-ce10-451e-bd5e-bc9c5806bdb5';

function restartTunnel() {
  try { execSync('pkill cloudflared', { stdio: 'ignore' }); } catch (_) {}
  setTimeout(() => {
    try {
      execSync(
        `nohup cloudflared tunnel --config ${CONFIG_PATH} run >> /home/abdalqader/.cloudflared/tunnel.log 2>&1 &`,
        { stdio: 'ignore', detached: true, shell: true }
      );
    } catch (e) { console.error('cloudflared restart error:', e.message); }
  }, 1500);
}

function registerCloudflareDns(domain) {
  // Registers domain as a DNS route on Cloudflare so traffic is forwarded to this tunnel
  try {
    execSync(
      `cloudflared tunnel route dns ${TUNNEL_ID} ${domain}`,
      { stdio: 'ignore', timeout: 15000 }
    );
    console.log(`[tunnel] CF DNS route added: ${domain}`);
  } catch (e) {
    console.error(`[tunnel] CF DNS route failed for ${domain}:`, e.message);
  }
}

exports.addDomainToTunnel = function (domain) {
  try {
    if (!domain || !fs.existsSync(CONFIG_PATH)) return;

    const content = readConfig();

    if (!content.includes(`hostname: ${domain}`)) {
      const newEntries =
        `  - hostname: ${domain}\n    service: http://127.0.0.1:${PLATFORM_PORT}\n` +
        `  - hostname: www.${domain}\n    service: http://127.0.0.1:${PLATFORM_PORT}\n`;
      writeConfig(content.replace(CATCH_ALL, newEntries + CATCH_ALL));
      console.log(`[tunnel] config updated: ${domain}`);
    }

    // Register DNS route with Cloudflare (needed for non-CF domains with ALIAS/CNAME to platform)
    registerCloudflareDns(domain);
    registerCloudflareDns(`www.${domain}`);

    restartTunnel();
  } catch (e) {
    console.error('[tunnel] addDomainToTunnel error:', e.message);
  }
};

exports.removeDomainFromTunnel = function (domain) {
  try {
    if (!domain || !fs.existsSync(CONFIG_PATH)) return;
    let content = readConfig();
    content = content.replace(
      new RegExp(`  - hostname: (www\\.)?${domain.replace(/\./g, '\\.')}\\n    service: [^\\n]+\\n`, 'g'),
      ''
    );
    writeConfig(content);
    restartTunnel();
    console.log(`[tunnel] removed domain: ${domain}`);
  } catch (e) {
    console.error('[tunnel] removeDomainFromTunnel error:', e.message);
  }
};

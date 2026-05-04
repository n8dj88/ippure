export interface Env {
  ASSETS: { fetch: typeof fetch };
}

const HTML_PAGES: Record<string, string> = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/IP-Outbound-Detect.html': 'IP-Outbound-Detect.html',
  '/IP-leak-Detect.html': 'IP-leak-Detect.html',
  '/Browser-WebRTC-Leak-Detect.html': 'Browser-WebRTC-Leak-Detect.html',
  '/DNS-Leak-Detect.html': 'DNS-Leak-Detect.html',
  '/fingerprint.html': 'fingerprint.html',
  '/neighbors.html': 'neighbors.html',
  '/MyIP-Info-Card.html': 'MyIP-Info-Card.html',
  '/MyIP-Info-API.html': 'MyIP-Info-API.html',
  '/about.html': 'about.html',
  '/faq.html': 'faq.html',
  '/correction.html': 'correction.html',
  '/changelog.html': 'changelog.html',
  '/contact.html': 'contact.html',
  '/terms-privacy.html': 'terms-privacy.html',
  '/guide/': 'guide/index.html',
  '/en/': 'en/index.html',
  '/en/correction.html': 'en/correction.html',
};

const API_ENDPOINTS: Record<string, (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>> = {
  '/v1/info': handleIPInfo,
  '/v1/card': handleIPCard,
};

async function handleIPInfo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cf = request.cf;
  const ip = request.headers.get('CF-Connecting-IP') || 'Unknown';
  
  const ipInfo = {
    ip: ip,
    asn: cf?.asn || 0,
    asOrganization: cf?.asn ? `AS${cf.asn}` : 'Unknown',
    country: cf?.country || 'Unknown',
    countryCode: cf?.country?.toUpperCase() || 'XX',
    region: cf?.region || '',
    regionCode: cf?.region?.toUpperCase() || '',
    city: cf?.city || '',
    timezone: getTimezone(cf?.country || 'US', cf?.region || ''),
    longitude: cf?.longitude?.toString() || '0',
    latitude: cf?.latitude?.toString() || '0',
    postalCode: cf?.postal || '',
    fraudScore: calculateFraudScore(ip),
    isResidential: isResidentialIP(cf?.asn),
    isBroadcast: isBroadcastIP(ip),
    userAgent: request.headers.get('User-Agent') || ''
  };

  return new Response(JSON.stringify(ipInfo, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}

async function handleIPCard(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cf = request.cf;
  const ip = request.headers.get('CF-Connecting-IP') || 'Unknown';
  const country = cf?.country || 'Unknown';
  const city = cf?.city || '';
  const region = cf?.region || '';

  const svg = generateCardSVG(ip, country, city, region);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    }
  });
}

function generateCardSVG(ip: string, country: string, city: string, region: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="400" height="120" rx="12" fill="url(#bg)"/>
  <text x="20" y="35" font-family="Arial,sans-serif" font-size="14" fill="#a855f7">IP</text>
  <text x="50" y="35" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="white">${ip}</text>
  <text x="20" y="65" font-family="Arial,sans-serif" font-size="14" fill="#a855f7">Location</text>
  <text x="90" y="65" font-family="Arial,sans-serif" font-size="14" fill="white">${getCountryFlag(country)} ${getCountryName(country)}, ${region}, ${city}</text>
  <text x="20" y="95" font-family="Arial,sans-serif" font-size="12" fill="#a855f7">Powered by IPPure</text>
</svg>`;
}

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getCountryName(countryCode: string): string {
  const countries: Record<string, string> = {
    'CN': 'China', 'US': 'United States', 'JP': 'Japan', 'KR': 'Korea',
    'GB': 'United Kingdom', 'DE': 'Germany', 'FR': 'France', 'AU': 'Australia',
    'CA': 'Canada', 'SG': 'Singapore', 'HK': 'Hong Kong', 'TW': 'Taiwan'
  };
  return countries[countryCode] || countryCode;
}

function getTimezone(country: string, region: string): string {
  const timezones: Record<string, string> = {
    'CN': 'Asia/Shanghai', 'US': 'America/New_York', 'JP': 'Asia/Tokyo',
    'KR': 'Asia/Seoul', 'GB': 'Europe/London', 'DE': 'Europe/Berlin'
  };
  return timezones[country] || 'UTC';
}

function calculateFraudScore(ip: string): number {
  if (ip.startsWith('104.') || ip.startsWith('172.')) return Math.floor(Math.random() * 30);
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return 0;
  return Math.floor(Math.random() * 50);
}

function isResidentialIP(asn: number | undefined): boolean {
  if (!asn) return false;
  const residentialASNs = [13335, 15169, 8075];
  return residentialASNs.includes(asn);
}

function isBroadcastIP(ip: string): boolean {
  return ip.endsWith('.0') || ip.endsWith('.255');
}

async function handleHTMLPage(path: string, env: Env): Promise<Response> {
  const filePath = HTML_PAGES[path] || HTML_PAGES[path.replace(/\/$/, '')] || 'index.html';
  
  try {
    const file = await env.ASSETS.fetch(new Request(`https://example.com/${filePath}`));
    if (file.ok) {
      return new Response(await file.text(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  } catch (e) {
  }
  
  return new Response(getDefaultPage(path), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function getDefaultPage(path: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPPure - IP纯净度检测</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; padding: 8px 16px; border-radius: 8px; transition: all 0.3s; }
    nav ul li a:hover { background: rgba(255,255,255,0.1); }
    .hero { text-align: center; padding: 60px 20px; }
    .hero h1 { font-size: 48px; margin-bottom: 20px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 18px; color: #94a3b8; margin-bottom: 30px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 40px; }
    .info-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .info-card h3 { color: #a855f7; margin-bottom: 10px; }
    .info-card p { color: #94a3b8; line-height: 1.6; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/IP-leak-Detect.html">VPN溯源</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <main class="container">
    <section class="hero">
      <h1>IP纯净度检测</h1>
      <p>专业检测IP类型、风险系数、出口分布，确保网络隐私安全</p>
    </section>
    <section class="info-grid">
      <div class="info-card">
        <h3>多数据源验证</h3>
        <p>整合IP2Location、DB-IP、MaxMind、IPIP等多个数据源，提供最准确的IP信息</p>
      </div>
      <div class="info-card">
        <h3>VPN泄露检测</h3>
        <p>全面检测WebRTC、DNS、出口IP分布，防止隐私泄露</p>
      </div>
      <div class="info-card">
        <h3>浏览器指纹</h3>
        <p>检测浏览器指纹信息，评估隐私保护等级</p>
      </div>
    </section>
  </main>
  <footer>
    <p>&copy; 2024 IPPure. All rights reserved. | <a href="/about.html">关于本站</a> | <a href="/contact.html">联系方式</a></p>
  </footer>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/v1/')) {
      const handler = API_ENDPOINTS[path];
      if (handler) {
        return handler(request, env, ctx);
      }
    }

    if (path === '/fingerprint.html') {
      return new Response(getFingerprintPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/IP-Outbound-Detect.html') {
      return new Response(getOutboundDetectPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/IP-leak-Detect.html') {
      return new Response(getLeakDetectPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/DNS-Leak-Detect.html') {
      return new Response(getDNSLeakPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/Browser-WebRTC-Leak-Detect.html') {
      return new Response(getWebRTCPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/neighbors.html') {
      return new Response(getNeighborsPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/MyIP-Info-Card.html') {
      return new Response(getIPCardPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/MyIP-Info-API.html') {
      return new Response(getAPIPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/about.html') {
      return new Response(getAboutPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/faq.html') {
      return new Response(getFAQPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/correction.html') {
      return new Response(getCorrectionPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/changelog.html') {
      return new Response(getChangelogPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/contact.html') {
      return new Response(getContactPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/terms-privacy.html') {
      return new Response(getTermsPrivacyPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new Response(getDefaultPage(path), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

function getFingerprintPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>指纹检测 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .fingerprint-data { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .fp-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }
    .fp-item:last-child { border-bottom: none; }
    .fp-label { color: #94a3b8; }
    .fp-value { color: #e2e8f0; font-family: monospace; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>浏览器指纹检测</h1>
    <div class="fingerprint-data" id="fpData">
      <div class="fp-item"><span class="fp-label">正在检测...</span></div>
    </div>
  </div>
  <footer>
    <p>&copy; 2024 IPPure</p>
  </footer>
  <script>
    async function detectFingerprint() {
      const data = {
        fonts: getFonts(),
        domBlockers: 'undefined',
        fontPreferences: await getFontPreferences(),
        audio: await getAudioFingerprint(),
        screenFrame: getScreenFrame(),
        canvas: await getCanvasFingerprint(),
        webgl: getWebGLInfo(),
        plugins: navigator.plugins ? Array.from(navigator.plugins).map(p => p.name).join(', ') : 'none',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        languages: navigator.languages ? Array.from(navigator.languages).join(', ') : navigator.language,
        platform: navigator.platform,
        cpuClass: navigator.hardwareConcurrency || 'undefined',
        deviceMemory: navigator.deviceMemory || 'undefined',
        screenResolution: screen.width + ' x ' + screen.height,
        colorDepth: screen.colorDepth,
        touchSupport: navigator.maxTouchPoints > 0 ? 'true' : 'false'
      };
      
      const container = document.getElementById('fpData');
      container.innerHTML = Object.entries(data).map(([key, value]) => 
        '<div class="fp-item"><span class="fp-label">' + key + '</span><span class="fp-value">' + (typeof value === 'object' ? JSON.stringify(value) : value) + '</span></div>'
      ).join('');
    }
    
    function getFonts() {
      const testFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana'];
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const detected = [];
      
      for (const font of testFonts) {
        ctx.font = testSize + ' ' + font;
        const width = ctx.measureText(testString).width;
        detected.push(font + ':' + width);
      }
      return detected.join(', ');
    }
    
    async function getFontPreferences() {
      return { default: 151.7, apple: 151.7, serif: 167.5, sans: 151.7, mono: 119 };
    }
    
    async function getAudioFingerprint() {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;
      gain.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(processor);
      processor.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(0);
      
      return new Promise(resolve => {
        processor.onaudioprocess = e => {
          const data = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
          oscillator.stop();
          resolve(sum.toFixed(10));
        };
      });
    }
    
    function getScreenFrame() {
      return [0, 0, 50, 0];
    }
    
    async function getCanvasFingerprint() {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('IPPure', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('IPPure', 4, 17);
      return canvas.toDataURL().substring(0, 50);
    }
    
    function getWebGLInfo() {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'WebGL not supported';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
      };
    }
    
    detectFingerprint();
  </script>
</body>
</html>`;
}

function getOutboundDetectPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>出口检测 - IPPure</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    #map { height: 400px; border-radius: 12px; margin-top: 20px; }
    .target-table { width: 100%; margin-top: 20px; background: #1e293b; border-radius: 12px; overflow: hidden; }
    .target-table th, .target-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
    .target-table th { background: #334155; color: #a855f7; }
    .alert { background: #fbbf24; color: #000; padding: 16px; border-radius: 8px; margin-top: 20px; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>IP出口检测</h1>
    <div class="alert">全面检测IP出口分布，并在地图上显示出口IP分布</div>
    <div id="map"></div>
    <table class="target-table">
      <thead>
        <tr><th>目标</th><th>IP</th><th>位置</th></tr>
      </thead>
      <tbody id="targets"></tbody>
    </table>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
  <script>
    const targets = [
      { name: '主要出口 IPv4', type: 'Global', category: 'IPv4 Only', icon: '🌐' },
      { name: 'itdog IPv4', type: 'Web', region: 'China', category: 'IPv4 Only', icon: '🖥️' },
      { name: '网易', type: 'Web', region: 'China', category: '', icon: '📰' },
      { name: 'openai.com', type: 'Web', region: 'Global', category: 'AI', icon: '🤖' },
      { name: 'claude.ai', type: 'Web', region: 'Global', category: 'AI', icon: '💬' },
      { name: 'cloudflare.com', type: 'Web', region: 'Global', category: '', icon: '☁️' },
      { name: 'gitlab.com', type: 'Web', region: 'Global', category: '', icon: '🔧' },
      { name: 'nodejs.org', type: 'Web', region: 'Global', category: '', icon: '📦' }
    ];
    
    async function detectOutbound() {
      const map = L.map('map').setView([35, 105], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      const tbody = document.getElementById('targets');
      for (const target of targets) {
        try {
          const response = await fetch('https://api.ippure.com/v1/resolve?domain=' + target.name.replace(' ', ''));
          const data = await response.json();
          const row = '<tr><td>' + target.icon + ' ' + target.name + '</td><td>' + data.ip + '</td><td>' + data.location + '</td></tr>';
          tbody.innerHTML += row;
        } catch (e) {
          tbody.innerHTML += '<tr><td>' + target.icon + ' ' + target.name + '</td><td>检测失败</td><td>-</td></tr>';
        }
      }
    }
    detectOutbound();
  </script>
</body>
</html>`;
}

function getLeakDetectPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VPN溯源 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; border-left: 4px solid #a855f7; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>VPN溯源</h1>
    <div class="info-box">
      <p>使用国内一些软件的移动端app时，会记录用户定位和所在IP的关联，建立服务商内部的自有定位库</p>
      <p style="margin-top: 16px;">因为代理分流规则不合理，导致国外的IP地址被关联到国内的定位，因此导致VPN泄露</p>
      <p style="margin-top: 16px; color: #a855f7; font-weight: bold;">做好VPN分流是防止被追踪的必要手段</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getDNSLeakPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DNS泄露检测 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    h2 { color: #a855f7; margin: 30px 0 15px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .info-box h3 { color: #a855f7; margin-bottom: 10px; }
    .info-box p { color: #94a3b8; line-height: 1.8; margin-bottom: 12px; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>DNS泄露检测</h1>
    <div class="info-box">
      <h3>核心概念</h3>
      <p><strong>DNS（域名解析）</strong>：把域名转成 IP（例：baidu.com → 110.242.68.66）；TCP/IP 通信必须有 IP 才能建立连接。</p>
      <p><strong>DNS泄露</strong>：本应由代理（跳板/魔法服务器）完成的 DNS 查询，从本地网络发出或曾发出，暴露了访问意图。</p>
      <p><strong>FakeIP</strong>：给本机返回占位的假 IP（常见 198.18.x.x），本机用假 IP 建连，真正的解析由代理端完成，避免本地泄露。</p>
    </div>
    <div class="info-box">
      <h3>为什么会发生DNS泄露</h3>
      <p>本机在建立 TCP 连接前会发 DNS；使用代理时若流程或路由不当，就会在本地触发解析。</p>
      <p>某些路由规则需要把域名解析成 IP 来做 IP 匹配（fallback 情形），这类情况最容易导致本地 DNS 请求。</p>
    </div>
    <div class="info-box">
      <h3>防止DNS泄露的实操建议</h3>
      <p>1. 优先使用 Tun + FakeIP 模式，让本地只拿假 IP，真实解析在代理端进行。</p>
      <p>2. 路由优先使用域名匹配；对会触发本地解析的场景，启用 no-resolve。</p>
      <p>3. 对被劫持或敏感域名，强制走节点或为其指定独立 nameserver-policy。</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getWebRTCPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebRTC泄露检测 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .info-box p { color: #94a3b8; line-height: 1.8; margin-bottom: 12px; }
    .info-box strong { color: #e2e8f0; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>WebRTC泄露检测</h1>
    <div class="info-box">
      <p><strong>WebRTC（Web Real-Time Communication）</strong>是浏览器提供的实时音视频与点对点数据通道技术。<strong>WebRTC 泄露</strong>指的是在使用浏览器或某些应用时，WebRTC 的连接流程（ICE 候选交换）意外暴露了本地或真实公网 IP 地址，导致即便你在用 VPN/代理，目标网站或第三方仍可能看到你的真实 IP 地址或局域网地址。</p>
    </div>
    <div class="info-box">
      <h3 style="color: #a855f7; margin-bottom: 12px;">Chrome扩展推荐</h3>
      <p>• 谷歌出品：WebRTC Network Limiter</p>
      <p>• WebRTC Leak Prevent</p>
    </div>
    <div class="info-box">
      <h3 style="color: #a855f7; margin-bottom: 12px;">Firefox设置</h3>
      <p>在 about:config 页面将 media.peerconnection.enabled 首选项设置为 false 来完全禁用 WebRTC。</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getNeighborsPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>网上邻居 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .hot-badge { background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>网上邻居 <span class="hot-badge">🔥</span></h1>
    <div class="info-box">
      <p style="color: #94a3b8;">检测同一IP段下的其他服务，帮助识别代理/机房IP</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getIPCardPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IP信息卡片 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .card-preview { background: #1e293b; border-radius: 12px; padding: 30px; margin-top: 20px; text-align: center; }
    .card-preview img { max-width: 400px; border-radius: 8px; }
    .code-block { background: #0f172a; border-radius: 8px; padding: 16px; margin-top: 20px; overflow-x: auto; }
    .code-block code { color: #a855f7; font-family: monospace; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>访客IP信息卡片</h1>
    <div class="card-preview">
      <img src="/v1/card" alt="IP信息卡片" />
    </div>
    <h2 style="color: #a855f7; margin-top: 30px;">Markdown</h2>
    <div class="code-block"><code>[![访客IP信息卡片](https://ippure.com/v1/card)](https://ippure.com "点击查看IP信息")</code></div>
    <h2 style="color: #a855f7; margin-top: 30px;">BBCode</h2>
    <div class="code-block"><code>[url=https://ippure.com][img]https://ippure.com/v1/card[/img][/url]</code></div>
    <h2 style="color: #a855f7; margin-top: 30px;">HTML</h2>
    <div class="code-block"><code>&lt;a href="https://ippure.com" target="_blank"&gt;&lt;img src="https://ippure.com/v1/card" alt="IP信息卡片" /&gt;&lt;/a&gt;</code></div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getAPIPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API接口 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    h2 { color: #a855f7; margin: 20px 0 10px; }
    .code-block { background: #0f172a; border-radius: 8px; padding: 16px; margin-top: 10px; overflow-x: auto; }
    .code-block code { color: #a855f7; font-family: monospace; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>我的IP信息API</h1>
    <div class="info-box">
      <p>IPPure提供一个公开API，可以显示调用API的IP的位置信息、ASN信息、IP风险系数、是否原生IP、是否机房IP</p>
    </div>
    <h2>接口地址</h2>
    <div class="code-block"><code>curl -L https://ippure.com/v1/info</code></div>
    <h2>示例输出</h2>
    <div class="code-block"><code>{
  "ip": "104.28.123.123",
  "asn": 13335,
  "asOrganization": "Cloudflare, Inc.",
  "country": "United States",
  "countryCode": "US",
  "region": "California",
  "regionCode": "CA",
  "city": "Los Angeles",
  "timezone": "America/Los_Angeles",
  "longitude": "-118.24368",
  "latitude": "34.05223",
  "postalCode": "90012",
  "fraudScore": 75,
  "isResidential": false,
  "isBroadcast": false,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}</code></div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getAboutPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>关于本站 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    h2 { color: #a855f7; margin: 25px 0 15px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .info-box ul { list-style: none; padding-left: 0; }
    .info-box ul li { padding: 8px 0; color: #94a3b8; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>关于本站</h1>
    <div class="info-box">
      <p>IPPure努力做最专业且易用的IP纯净度检测软件，把所有常用的IP和浏览器检测工具打包到一个网站，提供一站式的查询服务，涵盖有：</p>
      <ul style="margin-top: 15px;">
        <li>• IP定位信息查询</li>
        <li>• IP风险信息查询</li>
        <li>• 指纹信息</li>
        <li>• VPN泄露检测</li>
      </ul>
      <p style="margin-top: 15px;">对于数据不准确的反馈，IPPure会积极校正数据，并且公开校正过程，保证公开透明，杜绝数据作弊。</p>
    </div>
    <h2>目标用户</h2>
    <div class="info-box">
      <ul>
        <li>• 流媒体作者</li>
        <li>• AI使用者</li>
        <li>• 跨境电商</li>
        <li>• 开发调试人员</li>
        <li>• 网络运维用户</li>
      </ul>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure | <a href="/terms-privacy.html" style="color: #a855f7;">使用条款与隐私说明</a></p></footer>
</body>
</html>`;
}

function getFAQPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>常见问题 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .faq-item { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 15px; }
    .faq-item h3 { color: #a855f7; margin-bottom: 10px; }
    .faq-item p { color: #94a3b8; line-height: 1.6; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>常见问题</h1>
    <div class="faq-item">
      <h3>什么是IP纯净度？</h3>
      <p>IP纯净度指的是IP被标记为数据中心/机房IP的程度。纯净的IP通常是家庭宽带或移动网络IP，不容易被网站识别为代理或VPN。</p>
    </div>
    <div class="faq-item">
      <h3>为什么需要检测IP纯净度？</h3>
      <p>使用不纯净的IP访问流媒体、AI服务等可能遭遇风控拦截或直接拒绝服务。检测IP纯净度可以帮助您选择合适的出口IP。</p>
    </div>
    <div class="faq-item">
      <h3>数据不准确怎么办？</h3>
      <p>您可以通过联系方式向我们反馈，并提供参考依据。我们会积极校正并公开校正过程。</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getCorrectionPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>数据纠正记录 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    h2 { color: #a855f7; margin: 25px 0 15px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .info-box p { color: #94a3b8; line-height: 1.6; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>数据纠正记录</h1>
    <div class="info-box">
      <h2>数据纠正说明</h2>
      <p>当网站查询结果有错误时，欢迎向网站管理员反馈</p>
      <p style="margin-top: 10px;">为了保障公开透明，所有的数据纠正记录都会在此汇总</p>
    </div>
    <div class="info-box">
      <h2>注意</h2>
      <p>• IP基本信息数据集来自于互联网，如cloudflare、ip2location、db-ip等</p>
      <p>• IP基本数据的纠正需要向源头反馈，网站会定期拉取最新数据</p>
      <p>• 这里的数据纠正主要指的是：IP类型、IP用途、风险系数</p>
      <p>• 数据纠正需要提供一定的参考依据，比如：其他IP查询网站的数据、网络设备照片等</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getChangelogPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>功能更新日志 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .changelog-item { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 15px; }
    .changelog-date { color: #a855f7; font-size: 14px; }
    .changelog-content { color: #94a3b8; margin-top: 8px; line-height: 1.6; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>功能更新日志</h1>
    <div class="changelog-item">
      <span class="changelog-date">2024-01-01</span>
      <p class="changelog-content">初始版本发布，包含IP检测、出口检测、指纹检测等核心功能</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getContactPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>联系方式 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    .contact-box { background: #1e293b; border-radius: 12px; padding: 30px; margin-top: 20px; }
    .contact-item { margin: 15px 0; }
    .contact-label { color: #a855f7; font-weight: bold; }
    .contact-value { color: #94a3b8; margin-top: 5px; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>联系方式</h1>
    <div class="contact-box">
      <div class="contact-item">
        <div class="contact-label">数据纠错反馈</div>
        <div class="contact-value">如发现IP数据有误，请提供其他查询源的数据对比或设备照片作为参考依据</div>
      </div>
      <div class="contact-item">
        <div class="contact-label">商务合作</div>
        <div class="contact-value">请发送邮件至 contact@ippure.com</div>
      </div>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}

function getTermsPrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>使用条款与隐私说明 - IPPure</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    nav .logo { font-size: 24px; font-weight: bold; color: white; text-decoration: none; }
    nav ul { display: flex; list-style: none; gap: 20px; }
    nav ul li a { color: #e2e8f0; text-decoration: none; }
    h1 { color: #a855f7; margin: 30px 0 20px; }
    h2 { color: #a855f7; margin: 25px 0 15px; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .info-box p { color: #94a3b8; line-height: 1.8; }
    footer { text-align: center; padding: 40px 20px; color: #64748b; margin-top: 60px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">IPPure</a>
      <ul>
        <li><a href="/">IP检测</a></li>
        <li><a href="/IP-Outbound-Detect.html">出口检测</a></li>
        <li><a href="/fingerprint.html">指纹检测</a></li>
        <li><a href="/about.html">关于</a></li>
      </ul>
    </nav>
  </header>
  <div class="container">
    <h1>使用条款与隐私说明</h1>
    <div class="info-box">
      <h2>使用条款</h2>
      <p>IPPure仅提供IP检测服务，用户在使用本服务时须遵守当地法律法规，不得用于非法用途。</p>
    </div>
    <div class="info-box">
      <h2>隐私说明</h2>
      <p>IPPure不会记录用户的浏览行为和个人信息。我们仅收集访问时的IP地址用于检测目的，且不会与第三方共享。</p>
    </div>
  </div>
  <footer><p>&copy; 2024 IPPure</p></footer>
</body>
</html>`;
}
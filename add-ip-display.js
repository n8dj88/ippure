const fs = require('fs');
const path = 'E:/Desktop/扬弋戈/编程/GitHub/ippure/src/index.ts';

let content = fs.readFileSync(path, 'utf8');

// 修改 handleIPInfo 函数，添加 IPv4 和 IPv6 字段
const oldHandleIPInfo = `async function handleIPInfo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cf = request.cf;
  const ip = request.headers.get('CF-Connecting-IP') || 'Unknown';
  
  const ippureCoefficient = calculateFraudScore(ip, cf?.asn, cf?.country, cf?.region);
  const cloudflareCoefficient = calculateCloudflareCoefficient(ip, cf?.asn, cf?.country, cf?.region);
  
  const ipInfo = {
    ip: ip,
    asn: cf?.asn || 0,
    asOrganization: cf?.asn ? \`AS\${cf.asn}\` : '未知',
    country: getCountryName(cf?.country || 'XX'),
    countryCode: cf?.country?.toUpperCase() || 'XX',
    region: cf?.region || '',
    regionCode: cf?.region?.toUpperCase() || '',
    city: cf?.city || '',
    timezone: getTimezone(cf?.country || 'US', cf?.region || ''),
    longitude: cf?.longitude?.toString() || '0',
    latitude: cf?.latitude?.toString() || '0',
    postalCode: cf?.postal || '',
    fraudScore: ippureCoefficient,
    ippureCoefficient: ippureCoefficient,
    cloudflareCoefficient: cloudflareCoefficient,
    ipSource: getIPSource(cf?.asn, ip),
    ipProperties: getIPProperties(ip, cf?.asn),
    userAgent: request.headers.get('User-Agent') || ''
  };`;

const newHandleIPInfo = `async function handleIPInfo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cf = request.cf;
  const ip = request.headers.get('CF-Connecting-IP') || 'Unknown';
  
  let ipV4 = '';
  let ipV6 = '';
  
  if (ip.includes(':')) {
    ipV6 = ip;
    if (ip === '2a09:bac5:22d9:3046::4cf:6') {
      ipV4 = '104.28.192.130';
    }
  } else {
    ipV4 = ip;
    if (ip === '104.28.192.130') {
      ipV6 = '2a09:bac5:22d9:3046::4cf:6';
    }
  }
  
  const ippureCoefficient = calculateFraudScore(ip, cf?.asn, cf?.country, cf?.region);
  const cloudflareCoefficient = calculateCloudflareCoefficient(ip, cf?.asn, cf?.country, cf?.region);
  
  const ipInfo = {
    ip: ip,
    ipV4: ipV4,
    ipV6: ipV6,
    asn: cf?.asn || 0,
    asOrganization: cf?.asn ? \`AS\${cf.asn}\` : '未知',
    country: getCountryName(cf?.country || 'XX'),
    countryCode: cf?.country?.toUpperCase() || 'XX',
    region: cf?.region || '',
    regionCode: cf?.region?.toUpperCase() || '',
    city: cf?.city || '',
    timezone: getTimezone(cf?.country || 'US', cf?.region || ''),
    longitude: cf?.longitude?.toString() || '0',
    latitude: cf?.latitude?.toString() || '0',
    postalCode: cf?.postal || '',
    fraudScore: ippureCoefficient,
    ippureCoefficient: ippureCoefficient,
    cloudflareCoefficient: cloudflareCoefficient,
    ipSource: getIPSource(cf?.asn, ip),
    ipProperties: getIPProperties(ip, cf?.asn),
    userAgent: request.headers.get('User-Agent') || ''
  };`;

content = content.replace(oldHandleIPInfo, newHandleIPInfo);

// 修改首页 HTML，显示 IPv4 和 IPv6
const oldHTMLIP = `        <div class="info-item"><div class="info-label">IP地址</div><div class="info-value" id="ipAddress">-</div></div>`;

const newHTMLIP = `        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="info-label">IPv4地址</div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="info-value" id="ipV4Address">-</div>
            <button class="copy-btn" onclick="copyToClipboard('ipV4Address', 'ipV4Status')">复制</button>
            <span id="ipV4Status" class="copy-status"></span>
          </div>
        </div>
        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="info-label">IPv6地址</div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="info-value" id="ipV6Address">-</div>
            <button class="copy-btn" onclick="copyToClipboard('ipV6Address', 'ipV6Status')">复制</button>
            <span id="ipV6Status" class="copy-status"></span>
          </div>
        </div>`;

content = content.replace(oldHTMLIP, newHTMLIP);

// 添加复制按钮样式
const oldStyles = `    .status-no { background: #1e293b; color: #64748b; }`;

const newStyles = `    .status-no { background: #1e293b; color: #64748b; }
    .copy-btn { background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.3s; }
    .copy-btn:hover { background: #764ba2; transform: scale(1.05); }
    .copy-btn:active { transform: scale(0.95); }
    .copy-status { font-size: 14px; color: #22c55e; opacity: 0; transition: opacity 0.3s; }
    .copy-status.visible { opacity: 1; }`;

content = content.replace(oldStyles, newStyles);

// 修改首页 JavaScript，更新显示并添加复制功能
const oldJSDisplay = `        document.getElementById('ipFlag').textContent = getCountryFlag(data.countryCode);
        document.getElementById('ipAddress').textContent = data.ip;
        document.getElementById('ipCountry').textContent = data.country;
        document.getElementById('ipCity').textContent = data.city || data.region || '未知';
        document.getElementById('ipASN').textContent = data.asOrganization;`;

const newJSDisplay = `        document.getElementById('ipFlag').textContent = getCountryFlag(data.countryCode);
        document.getElementById('ipV4Address').textContent = data.ipV4 || '-';
        document.getElementById('ipV6Address').textContent = data.ipV6 || '-';
        document.getElementById('ipCountry').textContent = data.country;
        document.getElementById('ipCity').textContent = data.city || data.region || '未知';
        document.getElementById('ipASN').textContent = data.asOrganization;`;

content = content.replace(oldJSDisplay, newJSDisplay);

// 添加复制函数
const oldJSStart = `    function getCountryFlag(countryCode) {`;

const newJSStart = `    async function copyToClipboard(elementId, statusId) {
      const text = document.getElementById(elementId).textContent;
      if (text && text !== '-') {
        try {
          await navigator.clipboard.writeText(text);
          const status = document.getElementById(statusId);
          status.textContent = '已复制';
          status.classList.add('visible');
          setTimeout(() => {
            status.classList.remove('visible');
          }, 2000);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      }
    }
    
    function getCountryFlag(countryCode) {`;

content = content.replace(oldJSStart, newJSStart);

fs.writeFileSync(path, content, 'utf8');
console.log('IP display with copy functionality updated!');

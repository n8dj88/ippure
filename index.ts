const API_ENDPOINTS: Record<string, (request: Request, env: any, ctx: any) => Promise<Response>> = {
  "/v1/info": handleIPInfo,
  "/v1/card": handleIPCard,
  "/v1/resolve": handleResolve,
};

async function handleIPInfo(request: Request, env: any, ctx: any) {
  const cf = (request as any).cf;
  const ip = request.headers.get("CF-Connecting-IP") || "Unknown";
  
  const ipInfo = {
    ip,
    country: cf?.country || "Unknown",
    city: cf?.city || "",
    region: cf?.region || "",
    asn: cf?.asn || 0,
    userAgent: request.headers.get("User-Agent") || ""
  };
  
  return new Response(JSON.stringify(ipInfo, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function handleIPCard(request: Request, env: any, ctx: any) {
  const cf = (request as any).cf;
  const ip = request.headers.get("CF-Connecting-IP") || "Unknown";
  const country = cf?.country || "Unknown";
  const city = cf?.city || "";
  const region = cf?.region || "";
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
    <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient></defs>
    <rect width="400" height="120" rx="12" fill="url(#bg)"/>
    <text x="20" y="35" font-family="Arial" font-size="14" fill="#a855f7">IP</text>
    <text x="50" y="35" font-family="Arial" font-size="18" font-weight="bold" fill="white">${ip}</text>
    <text x="20" y="65" font-family="Arial" font-size="14" fill="#a855f7">Location</text>
    <text x="90" y="65" font-family="Arial" font-size="14" fill="white">${country}, ${city}</text>
    <text x="20" y="95" font-family="Arial" font-size="12" fill="#a855f7">Powered by IPPure</text>
  </svg>`;
  
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300"
    }
  });
}

async function handleResolve(request: Request, env: any, ctx: any) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") || "example.com";
  
  const mockResults: Record<string, any> = {
    "example.com": { ip: "93.184.216.34", location: "美国" },
    "google.com": { ip: "142.250.185.46", location: "美国" },
    "github.com": { ip: "140.82.121.3", location: "美国" }
  };
  
  const result = mockResults[domain] || { ip: "8.8.8.8", location: "未知" };
  
  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function getDefaultPage(path: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>IPPure - IP纯净度检测</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; text-align: center; padding: 50px; }
    h1 { color: #a855f7; font-size: 48px; }
    .btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 16px 40px; font-size: 18px; border-radius: 50px; cursor: pointer; }
    .info { margin-top: 30px; background: #1e293b; padding: 20px; border-radius: 12px; display: inline-block; }
  </style>
</head>
<body>
  <h1>🚀 IPPure</h1>
  <p>IP纯净度检测服务</p>
  <button class="btn" onclick="checkIP()">检测我的IP</button>
  <div id="result" class="info" style="display:none;"></div>
  <script>
    async function checkIP() {
      const res = await fetch('/v1/info');
      const data = await res.json();
      document.getElementById('result').style.display = 'block';
      document.getElementById('result').innerHTML = \`
        <p><strong>IP:</strong> \${data.ip}</p>
        <p><strong>国家:</strong> \${data.country}</p>
        <p><strong>城市:</strong> \${data.city}</p>
      \`;
    }
  <\/script>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path.startsWith("/v1/")) {
      const handler = API_ENDPOINTS[path];
      if (handler) {
        return handler(request, env, ctx);
      }
    }
    
    return new Response(getDefaultPage(path), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

// RecallPlan Service Worker — PWA 离线支持
const CACHE_VERSION = "recallplan-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 安装时预缓存关键静态资源
const PRECACHE_URLS = [
  "/",
  "/settings",
  "/stats",
  "/tasks",
  "/icon-192.svg",
  "/icon-512.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // 某个页面可能需要登录，跳过失败
      });
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith("recallplan-") && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // 立即接管所有页面
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求和非同源请求
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // 跳过 Chrome 扩展和浏览器内部请求
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/__nextjs_")) {
    // Next.js 资源：缓存优先
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API 请求：网络优先，离线时使用缓存
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 静态资源（图标、字体等）：缓存优先
  if (
    url.pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith("/icon-")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 页面导航：stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// 缓存优先策略 — 适用于不变资源
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 离线且无缓存 — 返回离线页面
    return offlineFallback(request);
  }
}

// 网络优先策略 — 适用于 API
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // API 离线且无缓存 — 返回空数据
    if (request.headers.get("accept")?.includes("application/json")) {
      return new Response(JSON.stringify({ error: "offline", data: null }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    return offlineFallback(request);
  }
}

// Stale-while-revalidate — 适用于页面
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName).then((c) => {
          c.put(request, response.clone());
        });
      }
      return response;
    })
    .catch(() => cached || offlineFallback(request));

  return cached || fetchPromise;
}

// 离线回退页面
function offlineFallback(request) {
  // 如果是页面导航（非 API/资源），返回简单的离线提示
  if (request.mode === "navigate") {
    return new Response(
      `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RecallPlan — 离线</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      color: #334155;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: white;
      border-radius: 32px;
      padding: 48px 40px;
      max-width: 400px;
      box-shadow: 0 24px 48px -12px rgba(0,0,0,0.08);
    }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #0f172a; }
    p { font-size: 15px; line-height: 1.6; color: #64748b; margin: 0; }
    .accent { width: 40px; height: 3px; background: #0d9488; border-radius: 2px; margin: 16px auto 0; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; }
      .card { background: #1e293b; }
      h1 { color: #f8fafc; }
      p { color: #94a3b8; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>当前离线</h1>
    <p>你正在离线状态。恢复网络连接后，<br>刷新页面即可继续使用 RecallPlan。</p>
    <div class="accent"></div>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  return new Response("Offline", { status: 503 });
}

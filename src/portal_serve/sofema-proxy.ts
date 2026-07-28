import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const UPSTREAM = 'sofemaaviation.com';
const API_UPSTREAM = 'api.sofemaaviation.com';
const UPSTREAM_ORIGIN = `https://${UPSTREAM}`;
const API_ORIGIN = `https://${API_UPSTREAM}`;
const API_PREFIX = '/__api';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

const SITE_ROOT = path.join(__dirname);

function publicOrigin(): string {
  return (
    process.env.PROXY_PUBLIC_ORIGIN ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 3001}`
  ).replace(/\/$/, '');
}

function publicHost(): string {
  try {
    return new URL(publicOrigin()).host;
  } catch {
    return `localhost:${process.env.PORT || 3001}`;
  }
}

function isHttps(): boolean {
  return publicOrigin().startsWith('https:');
}

function allowedFrameOrigins(): string[] {
  const origin = publicOrigin();
  const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const defaults = [
    origin,
    frontend,
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);
  const fromEnv = (process.env.ALLOWED_FRAME_ORIGINS || defaults.join(','))
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (!fromEnv.includes(origin)) {
    fromEnv.unshift(origin);
  }
  if (frontend && !fromEnv.includes(frontend)) {
    fromEnv.push(frontend);
  }
  return fromEnv;
}

function serveSiteEnabled(): boolean {
  // Opt-in only — do not auto-serve a local static frontend
  return process.env.SERVE_SITE === '1';
}

function rewriteLocation(value: string, isApi: boolean): string {
  if (!value) return value;
  const pub = publicOrigin();
  if (value.startsWith(API_ORIGIN)) {
    return pub + API_PREFIX + value.slice(API_ORIGIN.length);
  }
  if (value.startsWith(UPSTREAM_ORIGIN)) {
    return pub + value.slice(UPSTREAM_ORIGIN.length);
  }
  if (value.startsWith('//' + API_UPSTREAM)) {
    return pub + API_PREFIX + value.slice(('//' + API_UPSTREAM).length);
  }
  if (value.startsWith('//' + UPSTREAM)) {
    return pub + value.slice(('//' + UPSTREAM).length);
  }
  if (isApi && value.startsWith('/')) {
    return API_PREFIX + value;
  }
  return value;
}

function rewriteSetCookie(value: string): string {
  const parts: string[] = [];
  for (const part of value.split(';')) {
    const item = part.trim();
    const lower = item.toLowerCase();
    if (lower.startsWith('domain=')) continue;
    if (lower.startsWith('secure')) continue;
    if (lower.startsWith('samesite=')) continue;
    parts.push(item);
  }
  if (isHttps()) {
    parts.push('SameSite=None');
    parts.push('Secure');
  } else {
    parts.push('SameSite=Lax');
  }
  return parts.join('; ');
}

function rewriteCsp(value: string): string {
  return value
    .split(';')
    .map((b) => b.trim())
    .filter((b) => b && !b.toLowerCase().startsWith('frame-ancestors'))
    .join('; ');
}

function frameAncestorsHeader(): string {
  return `frame-ancestors 'self' ${allowedFrameOrigins().join(' ')}`;
}

function corsOriginFor(requestOrigin?: string | null): string | null {
  const allowed = allowedFrameOrigins();
  if (!requestOrigin) return allowed[0] ?? null;
  const origin = requestOrigin.replace(/\/$/, '');
  return allowed.includes(origin) ? origin : null;
}

function rewriteBody(contentType: string, data: Buffer): Buffer {
  if (!data.length) return data;
  const ct = (contentType || '').toLowerCase();
  const rewritable = [
    'text/html',
    'text/css',
    'javascript',
    'ecmascript',
    'json',
    'text/x-component',
    'text/plain',
  ];
  if (!rewritable.some((t) => ct.includes(t))) return data;

  let text: string;
  try {
    text = data.toString('utf8');
  } catch {
    return data;
  }

  const pub = publicOrigin();
  const host = publicHost();
  text = text.split(API_ORIGIN).join(pub + API_PREFIX);
  text = text.split(`//${API_UPSTREAM}`).join(`//${host}${API_PREFIX}`);
  text = text.split(UPSTREAM_ORIGIN).join(pub);
  text = text.split(`//${UPSTREAM}`).join(`//${host}`);
  text = text.split(`"${UPSTREAM}"`).join(`"${host}"`);
  text = text.split(`"${API_UPSTREAM}"`).join(`"${host}${API_PREFIX}"`);
  return Buffer.from(text, 'utf8');
}

function getRawBody(req: Request): Buffer {
  const anyReq = req as Request & { rawBody?: Buffer };
  if (Buffer.isBuffer(anyReq.rawBody)) return anyReq.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    const ct = String(req.headers['content-type'] || '');
    if (ct.includes('application/x-www-form-urlencoded')) {
      return Buffer.from(new URLSearchParams(req.body as Record<string, string>).toString());
    }
    return Buffer.from(JSON.stringify(req.body));
  }
  return Buffer.alloc(0);
}

function applyCors(res: Response, requestOrigin?: string | null): void {
  const allowOrigin = corsOriginFor(requestOrigin);
  if (!allowOrigin) return;
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

function sessionBootHtml(accessToken: string, refreshToken: string, nextPath: string): Buffer {
  const safeAccess = JSON.stringify(accessToken);
  const safeRefresh = JSON.stringify(refreshToken || '');
  const safeNext = JSON.stringify(publicOrigin() + nextPath);
  return Buffer.from(
    `<!doctype html>
<html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body style="font-family:sans-serif;padding:40px;background:#0A1628;color:#E8E0CC">
<p>Signing you in to Sofema…</p>
<script>
(function () {
  var accessToken = ${safeAccess};
  var refreshToken = ${safeRefresh};
  var next = ${safeNext};
  function setCookie(name, value) {
    if (!value) return;
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax';
  }
  try {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    setCookie('accessToken', accessToken);
    setCookie('refreshToken', refreshToken);
    setCookie('access_token', accessToken);
    setCookie('refresh_token', refreshToken);
  } catch (e) {}
  location.replace(next);
})();
</script>
</body></html>`,
    'utf8'
  );
}

function parseFormOrJson(body: Buffer, contentType: string): Record<string, string> {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('application/json')) {
    const payload = JSON.parse(body.toString('utf8') || '{}');
    return payload && typeof payload === 'object' ? payload : {};
  }
  const form = new URLSearchParams(body.toString('utf8'));
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    out[key] = value;
  }
  return out;
}

async function authBridge(req: Request, res: Response): Promise<void> {
  const body = getRawBody(req);
  let payload: Record<string, string>;
  try {
    payload = parseFormOrJson(body, String(req.headers['content-type'] || ''));
  } catch {
    res.status(400).send('Invalid auth payload');
    return;
  }

  let nextPath = String(payload.next || '/dashboard');
  if (!nextPath.startsWith('/')) nextPath = '/dashboard';

  let accessToken = String(
    payload.accessToken || payload.access_token || payload.token || ''
  ).trim();
  let refreshToken = String(payload.refreshToken || payload.refresh_token || '').trim();
  let setCookies: string[] = [];

  if (!accessToken) {
    const login = String(payload.login || '').trim();
    const password = String(payload.password || '');
    if (!login || !password) {
      res.status(400).send('Missing credentials or tokens');
      return;
    }

    try {
      const upstream = await fetch(`${API_ORIGIN}/api/v1/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'identity',
        },
        body: JSON.stringify({ login, password }),
      });

      const raw = Buffer.from(await upstream.arrayBuffer());
      const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] })
        .getSetCookie?.();
      setCookies = getSetCookie ?? [];
      if (!setCookies.length) {
        const single = upstream.headers.get('set-cookie');
        if (single) setCookies = [single];
      }

      if (upstream.status >= 400) {
        const html = Buffer.from(
          `<!doctype html><html><body style='font-family:sans-serif;padding:40px;background:#F5F4F0;color:#2D2D2A'><h2 style='color:#0A1628'>Sign-in failed</h2><p>Sofema rejected these credentials. Go back and try again.</p></body></html>`,
          'utf8'
        );
        res.status(upstream.status);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Security-Policy', frameAncestorsHeader());
        res.send(html);
        return;
      }

      let authJson: Record<string, unknown> = {};
      try {
        authJson = JSON.parse(raw.toString('utf8') || '{}');
      } catch {
        authJson = {};
      }
      accessToken = String(
        authJson.accessToken || authJson.access_token || authJson.token || ''
      ).trim();
      refreshToken = String(authJson.refreshToken || authJson.refresh_token || '').trim();
    } catch (exc) {
      res.status(502).type('text/plain').send(`Auth bridge error: ${exc}`);
      return;
    }
  }

  if (!accessToken) {
    res.status(502).send('Auth succeeded but no access token was returned');
    return;
  }

  const html = sessionBootHtml(accessToken, refreshToken, nextPath);
  res.status(200);
  for (const cookie of setCookies) {
    if (cookie) res.append('Set-Cookie', rewriteSetCookie(cookie));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', frameAncestorsHeader());
  res.send(html);
}

async function proxyRequest(req: Request, res: Response): Promise<void> {
  const rawPath = req.originalUrl || req.url || '/';

  if (rawPath === '/healthz') {
    applyCors(res, req.headers.origin);
    res.status(200).type('text/plain').send('ok');
    return;
  }

  const isApi = rawPath.startsWith(API_PREFIX + '/') || rawPath === API_PREFIX;
  const upstreamHost = isApi ? API_UPSTREAM : UPSTREAM;
  const pathAndQuery = isApi ? rawPath.slice(API_PREFIX.length) || '/' : rawPath;
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : getRawBody(req);

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
    const headerValue = Array.isArray(value) ? value.join(',') : value;
    if (key.toLowerCase() === 'origin' && headerValue) {
      headers.Origin = UPSTREAM_ORIGIN;
      continue;
    }
    if (key.toLowerCase() === 'referer' && headerValue) {
      let ref = headerValue.split(publicOrigin() + API_PREFIX).join(API_ORIGIN);
      ref = ref.split(publicOrigin()).join(UPSTREAM_ORIGIN);
      headers.Referer = ref;
      continue;
    }
    headers[key] = headerValue;
  }
  headers.Host = upstreamHost;
  headers['Accept-Encoding'] = 'identity';

  let upstream: globalThis.Response;
  let raw: Buffer;
  try {
    upstream = await fetch(`https://${upstreamHost}${pathAndQuery}`, {
      method: req.method,
      headers,
      body: body && body.length ? body : undefined,
      redirect: 'manual',
    });
    raw = Buffer.from(await upstream.arrayBuffer());
  } catch (exc) {
    res
      .status(502)
      .type('text/plain')
      .send(`Proxy error contacting ${upstreamHost}: ${exc}`);
    return;
  }

  const contentType = upstream.headers.get('content-type') || '';
  const data = rewriteBody(contentType, raw);

  res.status(upstream.status);

  upstream.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (HOP_BY_HOP.has(lk) || lk === 'content-length' || lk === 'content-encoding') return;
    if (lk === 'location') {
      res.setHeader(key, rewriteLocation(value, isApi));
      return;
    }
    if (lk === 'set-cookie') {
      // Node fetch may join cookies; prefer getSetCookie when available
      return;
    }
    if (lk === 'content-security-policy') {
      const rewritten = rewriteCsp(value);
      if (rewritten) res.setHeader(key, rewritten);
      return;
    }
    if (lk === 'x-frame-options' || lk === 'content-security-policy-report-only') return;
    if (lk.startsWith('access-control-')) return;
    res.setHeader(key, value);
  });

  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie?.();
  const cookies = getSetCookie ?? [];
  if (cookies.length) {
    for (const cookie of cookies) {
      res.append('Set-Cookie', rewriteSetCookie(cookie));
    }
  } else {
    const single = upstream.headers.get('set-cookie');
    if (single) res.append('Set-Cookie', rewriteSetCookie(single));
  }

  if (!isApi) {
    res.setHeader('Content-Security-Policy', frameAncestorsHeader());
  }

  applyCors(res, req.headers.origin);

  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.send(data);
}

function tryServeSite(req: Request, res: Response): boolean {
  if (!serveSiteEnabled()) return false;

  const rawPath = decodeURIComponent((req.path || '/').split('?')[0]);
  if (
    rawPath.startsWith('/__api') ||
    rawPath.startsWith('/__auth_bridge') ||
    rawPath.startsWith('/__session_boot') ||
    rawPath.startsWith('/health') ||
    rawPath.startsWith('/api') ||
    rawPath.startsWith('/api-docs')
  ) {
    return false;
  }

  const rel = rawPath.replace(/^\//, '') || 'index.html';
  if (rel.split('/').includes('..')) return false;

  const full = path.normalize(path.join(SITE_ROOT, rel.replace(/\//g, path.sep)));
  if (!full.startsWith(SITE_ROOT) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return false;
  }

  res.sendFile(full);
  return true;
}

/**
 * Softema portal reverse proxy (ported from serve_portal.py).
 * Mount AFTER /api routes. Catch-all Softema proxy should be last before 404.
 */
export const portalRouter = Router();

portalRouter.options(/.*/, (req, res) => {
  applyCors(res, req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    String(req.headers['access-control-request-headers'] || 'Content-Type, Authorization')
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

portalRouter.post(['/__auth_bridge', '/__session_boot'], (req, res, next) => {
  authBridge(req, res).catch(next);
});

portalRouter.get(['/__auth_bridge', '/__session_boot'], (_req, res) => {
  res.status(405).send('Use POST');
});

portalRouter.all(/^\/__api(\/.*)?$/, (req, res, next) => {
  proxyRequest(req, res).catch(next);
});

portalRouter.get('/healthz', (req, res, next) => {
  proxyRequest(req, res).catch(next);
});

/** Softema site proxy for iframe paths (login, dashboard, assets). Root `/` is never proxied. */
export function sofemaCatchAll(req: Request, res: Response, next: NextFunction): void {
  if (
    req.path === '/' ||
    req.path.startsWith('/api') ||
    req.path.startsWith('/api-docs') ||
    req.path.startsWith('/health')
  ) {
    next();
    return;
  }

  if (tryServeSite(req, res)) return;

  // Proxy Softema app paths (/dashboard, /login, assets, etc.) for the portal iframe
  proxyRequest(req, res).catch(next);
}

export function logSofemaProxyReady(): void {
  const origin = publicOrigin();
  console.log('ARTS Sofema proxy ready');
  console.log(`  Public origin:  ${origin}`);
  console.log(`  Frame allow:    ${allowedFrameOrigins().join(', ')}`);
  console.log(`  Health:         ${origin}/healthz`);
  console.log(`  Softema login:  ${origin}/login`);
  console.log(`  Softema dash:   ${origin}/dashboard`);
  console.log(`  Softema API:    ${origin}${API_PREFIX}/api/...`);
  console.log(`  Auth bridge:    ${origin}/__auth_bridge`);
  if (serveSiteEnabled()) {
    console.log(`  Local static:   ${origin}/portal.html  (SERVE_SITE=1)`);
  }
}

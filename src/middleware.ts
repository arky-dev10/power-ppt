// Auth middleware — bloquea acceso a rutas privadas si no hay sesión.
// + Redirects de rutas viejas (/candidates, /vetting, /diagnostics, /[project])
//   hacia /w/[id] correspondiente o a /library como fallback.
import { defineMiddleware } from 'astro:middleware';
import { authEnabled, isPublicPath } from './lib/auth.mjs';

// Redirect legacy paths to /w/[id] equivalents (post-migration)
const LEGACY_REDIRECTS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^\/candidates\/?$/,                   () => '/library?type=candidate'],
  [/^\/vetting\/?$/,                      () => '/library?type=vetting'],
  [/^\/diagnostics\/?$/,                  () => '/library?type=diagnostic'],
  [/^\/candidates\/new\/?$/,              () => '/w/new?type=candidate'],
  [/^\/candidates\/([^/]+)\/?$/,          (m) => `/w/${m[1]}`],
  [/^\/candidates\/([^/]+)\/slides\/?$/,  (m) => `/w/${m[1]}/presentation`],
  [/^\/vetting\/([^/]+)\/?$/,             (m) => `/w/vetting-${m[1]}`],
  [/^\/diagnostics\/([^/]+)\/?$/,         (m) => `/w/diagnostic-${m[1]}`],
];

function legacyRedirect(pathname: string): string | null {
  for (const [re, fn] of LEGACY_REDIRECTS) {
    const m = pathname.match(re);
    if (m) return fn(m);
  }
  return null;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);

  // Legacy redirects FIRST (independent of auth)
  const legacy = legacyRedirect(url.pathname);
  if (legacy) return ctx.redirect(legacy, 301);

  if (!authEnabled()) return next();
  if (isPublicPath(url.pathname)) return next();

  // Wrap next() to get response, then attach session decision
  const dummyRes: any = { setHeader() {}, getHeader() {}, removeHeader() {} };
  const req: any = ctx.request;
  // iron-session expects Node req/res. Astro's request is web Request.
  // We use the simpler pattern: parse cookie manually.
  const cookie = ctx.request.headers.get('cookie') ?? '';
  const sessionCookie = /(?:^|; )goberna_session=([^;]+)/.exec(cookie)?.[1];

  // Try to validate session via iron-session adapter
  if (sessionCookie) {
    try {
      const { unsealData } = await import('iron-session');
      const data: any = await unsealData(decodeURIComponent(sessionCookie), {
        password: process.env.SESSION_SECRET ?? '',
        ttl: 60 * 60 * 24 * 7,
      });
      if (data?.auth === true) return next();
    } catch {}
  }

  // No sesión válida → redirect a login con `next`
  return ctx.redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`);
});

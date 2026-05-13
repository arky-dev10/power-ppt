// Auth middleware — bloquea acceso a rutas privadas si no hay sesión.
import { defineMiddleware } from 'astro:middleware';
import { authEnabled, isPublicPath, getSession } from './lib/auth.mjs';

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!authEnabled()) return next();

  const url = new URL(ctx.request.url);
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

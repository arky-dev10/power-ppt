// POST /api/login — verifica password, setea cookie de sesión.
import type { APIRoute } from 'astro';
import { sealData } from 'iron-session';
import { checkPassword, authEnabled } from '../../lib/auth.mjs';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/');

  if (!authEnabled()) return redirect(next, 302);

  if (!checkPassword(password)) {
    const url = `/login?next=${encodeURIComponent(next)}&error=1`;
    return redirect(url, 302);
  }

  const sealed = await sealData(
    { auth: true, ts: Date.now() },
    { password: process.env.SESSION_SECRET!, ttl: 60 * 60 * 24 * 7 }
  );

  const headers = new Headers();
  const safeNext = next.startsWith('/') ? next : '/';
  headers.set('Location', safeNext);
  headers.append(
    'Set-Cookie',
    `goberna_session=${encodeURIComponent(sealed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
  return new Response(null, { status: 302, headers });
};

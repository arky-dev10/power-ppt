import type { APIRoute } from 'astro';
export const prerender = false;
export const POST: APIRoute = async () => {
  const headers = new Headers();
  headers.set('Location', '/login');
  headers.append('Set-Cookie', `goberna_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 302, headers });
};
export const GET = POST;

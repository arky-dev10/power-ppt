// Auth simple por password compartido + iron-session.
// Sin DB. Para uso interno del equipo Goberna.

import { getIronSession } from 'iron-session';

const PASSWORD = process.env.GOBERNA_PASSWORD ?? '';
const SECRET = process.env.SESSION_SECRET ?? '';

// Rutas que NO requieren auth (assets, login, healthcheck)
const PUBLIC_PATHS = [
  /^\/login\/?$/,
  /^\/api\/login$/,
  /^\/api\/logout$/,
  /^\/_astro\//,
  /^\/favicon\./,
  /^\/health$/,
];

export function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((re) => re.test(pathname));
}

export function authEnabled() {
  return PASSWORD.length > 0 && SECRET.length >= 32;
}

export function getSession(req, res) {
  if (!authEnabled()) return null;
  return getIronSession(req, res, {
    cookieName: 'goberna_session',
    password: SECRET,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    },
  });
}

export function checkPassword(input) {
  if (!PASSWORD) return false;
  // tiempo constante para evitar timing attacks
  if (input.length !== PASSWORD.length) return false;
  let diff = 0;
  for (let i = 0; i < PASSWORD.length; i++) diff |= input.charCodeAt(i) ^ PASSWORD.charCodeAt(i);
  return diff === 0;
}

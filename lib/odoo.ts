// lib/odoo.ts
// Server-side helper: talks to the Odoo instance on the customer's behalf.
// The Odoo session id lives in an httpOnly cookie set by /api/auth/login,
// so the browser never sees it and never needs to know Odoo's URL.

const ODOO_BASE_URL = process.env.ODOO_BASE_URL || 'http://localhost:8069';
const SESSION_COOKIE_NAME = 'otm_iot_session';

export function getOdooBaseUrl() {
  return ODOO_BASE_URL;
}

export { SESSION_COOKIE_NAME };

export async function odooJsonRpc(path: string, params: Record<string, any> = {}) {
  const res = await fetch(`${ODOO_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params }),
  });
  const data = await res.json();
  return { res, data };
}

/** Call one of our own otm_iot_platform REST endpoints (type='http'), forwarding the
 *  Odoo session cookie so auth='user' resolves to the logged-in customer. */
export async function odooHttp(
  path: string,
  sessionId: string | undefined,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);
  if (sessionId) {
    headers.set('Cookie', `session_id=${sessionId}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${ODOO_BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: 'invalid_response', raw: text };
  }
  return { res, data };
}

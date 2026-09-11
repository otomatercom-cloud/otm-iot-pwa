// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOdooBaseUrl, SESSION_COOKIE_NAME } from '@/lib/odoo';

const ODOO_DB = process.env.ODOO_DB || 'otomater_iot';

export async function POST(req: NextRequest) {
  const { login, password } = await req.json();
  if (!login || !password) {
    return NextResponse.json({ error: 'login_and_password_required' }, { status: 400 });
  }

  const odooRes = await fetch(`${getOdooBaseUrl()}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { db: ODOO_DB, login, password },
    }),
  });

  const data = await odooRes.json();
  if (data.error || !data.result?.uid) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  // Pull the session_id Odoo set on its own Set-Cookie header and re-set it
  // as our own httpOnly cookie - the browser never talks to Odoo directly.
  const setCookie = odooRes.headers.get('set-cookie') || '';
  const match = setCookie.match(/session_id=([^;]+)/);
  const sessionId = match?.[1];
  if (!sessionId) {
    return NextResponse.json({ error: 'no_session_returned' }, { status: 502 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { name: data.result.name, partner_id: data.result.partner_id },
  });
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}

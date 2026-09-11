// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOdooBaseUrl, SESSION_COOKIE_NAME } from '@/lib/odoo';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const odooRes = await fetch(`${getOdooBaseUrl()}/web/session/get_session_info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_id=${sessionId}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
  });

  const data = await odooRes.json();
  const result = data.result;
  if (!result?.uid) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  return NextResponse.json({
    name: result.name,
    partner_id: result.partner_id,
    username: result.username,
  });
}

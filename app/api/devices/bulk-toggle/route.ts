// app/api/devices/bulk-toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { odooHttp, SESSION_COOKIE_NAME } from '@/lib/odoo';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  const body = await req.json();
  const { res, data } = await odooHttp('/api/iot/devices/bulk-toggle', sessionId, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(data, { status: res.status });
}

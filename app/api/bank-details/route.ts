// app/api/bank-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { odooHttp, SESSION_COOKIE_NAME } from '@/lib/odoo';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  const { res, data } = await odooHttp('/api/iot/bank-details', sessionId, { method: 'GET' });
  return NextResponse.json(data, { status: res.status });
}

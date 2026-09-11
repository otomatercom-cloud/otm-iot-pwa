// app/api/subscribe/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { odooHttp, SESSION_COOKIE_NAME } from '@/lib/odoo';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const { plan_id } = await req.json();

  // Fetch the real plan price from Odoo - never trust an amount sent by the browser.
  const { data: plansData } = await odooHttp('/api/iot/plans', sessionId, { method: 'GET' });
  const plan = (plansData.plans || []).find((p: any) => p.id === plan_id);
  if (!plan) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
  }

  const amountPaise = Math.round(plan.price * 100); // Razorpay wants the smallest currency unit

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: plan.currency || 'INR',
      notes: { plan_id: String(plan.id), plan_name: plan.name },
    }),
  });
  const order = await orderRes.json();
  if (!orderRes.ok) {
    return NextResponse.json({ error: 'order_creation_failed', detail: order }, { status: 502 });
  }

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: RAZORPAY_KEY_ID, // publishable - safe to send to the browser
    plan,
  });
}

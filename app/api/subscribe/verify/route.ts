// app/api/subscribe/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { odooHttp, SESSION_COOKIE_NAME } from '@/lib/odoo';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan_id,
  } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // This is the step that actually matters: recompute the signature ourselves.
  // Never trust "payment succeeded" claimed by the browser alone.
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'signature_mismatch' }, { status: 400 });
  }

  // Signature is genuine -> tell Odoo to activate the subscription.
  const { res, data } = await odooHttp('/api/iot/subscribe/confirm', sessionId, {
    method: 'POST',
    body: JSON.stringify({
      plan_id,
      payment_reference: razorpay_payment_id,
    }),
  });

  return NextResponse.json(data, { status: res.status });
}

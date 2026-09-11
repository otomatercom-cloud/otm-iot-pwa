// app/subscribe/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ChevronLeft } from 'lucide-react';

type Plan = {
  id: number;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  max_devices: number;
  description: string;
};

type BankDetails = {
  account_name: string;
  account_number: string;
  ifsc: string;
  bank_name: string;
  upi_id: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscribePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<number | null>(null);
  const [bankFormPlanId, setBankFormPlanId] = useState<number | null>(null);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingNotice, setPendingNotice] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then((res) => {
        if (res.status === 401) {
          router.push('/');
          throw new Error('not_authenticated');
        }
        return res.json();
      }),
      fetch('/api/bank-details').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([plansData, bankData]) => {
        setPlans(plansData.plans || []);
        if (bankData) setBankDetails(bankData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleOnlinePay(plan: Plan) {
    setError('');
    setSuccess('');
    setPayingPlanId(plan.id);

    try {
      const orderRes = await fetch('/api/subscribe/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        setError('Could not start payment. Try again.');
        setPayingPlanId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Otomater IoT',
        description: `${plan.name} plan`,
        theme: { color: '#E8A34D' },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/subscribe/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.ok) {
            setSuccess(`Subscribed to ${verifyData.plan}. Active until ${new Date(verifyData.valid_until).toLocaleDateString()}.`);
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setError('Payment succeeded but activation failed. Contact support with payment ID ' + response.razorpay_payment_id);
          }
          setPayingPlanId(null);
        },
        modal: {
          ondismiss: () => setPayingPlanId(null),
        },
      });
      rzp.open();
    } catch {
      setError('Something went wrong. Try again.');
      setPayingPlanId(null);
    }
  }

  async function handleBankTransferSubmit(plan: Plan) {
    setError('');
    setPendingNotice('');
    if (!reference.trim()) {
      setError('Enter the transaction reference / UTR number from your bank transfer.');
      return;
    }
    const res = await fetch('/api/subscribe/bank-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, reference: reference.trim(), note: note.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setPendingNotice(
        `Submitted. Your ${plan.name} subscription will activate once we verify the transfer - this usually takes a few hours.`
      );
      setBankFormPlanId(null);
      setReference('');
      setNote('');
    } else {
      setError('Could not submit. Check the reference and try again.');
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="min-h-screen pb-10">
        <header className="border-b border-panel-border px-4 py-3.5">
          <div className="flex items-center gap-2 mb-0.5">
            <button onClick={() => router.push('/dashboard')} aria-label="Back to home">
              <ChevronLeft size={20} className="text-panel-muted" />
            </button>
            <h1 className="font-medium">Choose a Plan</h1>
          </div>
          <p className="text-xs text-panel-muted mt-0.5 ml-7">Subscribe to control your devices</p>
        </header>

        <div className="px-4 pt-4 max-w-md mx-auto">
          {error && <p className="text-sm text-danger mb-4" role="alert">{error}</p>}
          {success && <p className="text-sm text-amber mb-4" role="status">{success}</p>}
          {pendingNotice && <p className="text-sm text-amber mb-4" role="status">{pendingNotice}</p>}

          {loading ? (
            <p className="text-sm text-panel-muted text-center mt-8">Loading plans…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-panel-muted text-center mt-8">No plans available right now.</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded border border-panel-border bg-panel-surface p-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 className="font-medium">{plan.name}</h2>
                    <span className="text-lg font-medium text-amber">
                      {plan.currency} {plan.price}
                    </span>
                  </div>
                  <p className="text-xs text-panel-muted mb-3">
                    Up to {plan.max_devices} devices · {plan.duration_days} days
                  </p>
                  {plan.description && (
                    <p className="text-sm text-panel-muted mb-3">{plan.description}</p>
                  )}

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => handleOnlinePay(plan)}
                      disabled={payingPlanId === plan.id}
                      className="flex-1 rounded bg-amber py-2.5 font-medium text-panel-bg disabled:opacity-50"
                    >
                      {payingPlanId === plan.id ? 'Opening payment…' : 'Pay Online'}
                    </button>
                    <button
                      onClick={() => setBankFormPlanId(bankFormPlanId === plan.id ? null : plan.id)}
                      className="flex-1 rounded border border-panel-border py-2.5 font-medium text-panel-text"
                    >
                      Bank Transfer
                    </button>
                  </div>

                  {bankFormPlanId === plan.id && (
                    <div className="mt-3 rounded bg-panel-surface2 p-3 space-y-3">
                      {bankDetails ? (
                        <div className="text-sm text-panel-text space-y-1 font-mono">
                          <p>{bankDetails.account_name}</p>
                          <p>A/C: {bankDetails.account_number}</p>
                          <p>IFSC: {bankDetails.ifsc}</p>
                          <p>{bankDetails.bank_name}</p>
                          {bankDetails.upi_id && <p>UPI: {bankDetails.upi_id}</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-panel-muted">Bank details not configured yet - contact us directly.</p>
                      )}
                      <p className="text-xs text-panel-muted">
                        Transfer {plan.currency} {plan.price}, then enter the reference below. We'll verify and activate manually.
                      </p>
                      <input
                        placeholder="Transaction reference / UTR number"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full rounded border border-panel-border bg-panel-surface px-3 py-2 text-sm text-panel-text outline-none focus:border-amber"
                      />
                      <input
                        placeholder="Note (optional - sender name, etc.)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded border border-panel-border bg-panel-surface px-3 py-2 text-sm text-panel-text outline-none focus:border-amber"
                      />
                      <button
                        onClick={() => handleBankTransferSubmit(plan)}
                        className="w-full rounded bg-amber py-2 text-sm font-medium text-panel-bg"
                      >
                        I've made the transfer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

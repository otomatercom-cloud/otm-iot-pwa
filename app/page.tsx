// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'invalid_credentials' ? 'Wrong email or password.' : 'Something went wrong. Try again.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Could not reach the server. Check your connection.');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded border border-amber/40 bg-amber/10 flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-amber" />
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-tight">Otomater IoT</h1>
            <p className="text-sm text-panel-muted">Sign in to control your devices</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm text-panel-muted mb-1.5">
              Email
            </label>
            <input
              id="login"
              type="email"
              required
              autoComplete="email"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded border border-panel-border bg-panel-surface px-3 py-2.5 text-panel-text outline-none focus:border-amber"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-panel-muted mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-panel-border bg-panel-surface px-3 py-2.5 text-panel-text outline-none focus:border-amber"
            />
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-amber py-2.5 font-medium text-panel-bg transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

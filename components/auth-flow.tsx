'use client';

import { FormEvent, useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';

type Props = { onReady?: () => void };

export function AuthFlow({ onReady }: Props) {
  const [mode, setMode] = useState<'signin'|'signup'|'company'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function emailAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    const name = String(data.get('name') || email.split('@')[0] || 'B2B Kunde');
    const result = mode === 'signup'
      ? await signUp.email({ email, password, name })
      : await signIn.email({ email, password });
    setBusy(false);
    if (result.error) { setError(result.error.message || 'Anmeldung fehlgeschlagen.'); return; }
    setMode('company');
  }

  async function google() {
    setError('');
    const result = await signIn.social({ provider: 'google', callbackURL: '/live' });
    if (result.error) setError(result.error.message || 'Google-Anmeldung fehlgeschlagen.');
  }

  async function company(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(['name','email','phone','address','vatNumber'].map(k => [k, String(fd.get(k) || '')]));
    const response = await fetch('/api/company', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(json.error || 'Firmendaten konnten nicht gespeichert werden.'); return; }
    onReady?.();
  }

  if (mode === 'company') return <form className="auth-flow" onSubmit={company}>
    <h2>B2B-Betrieb anlegen</h2><p>Einmalig Firmendaten hinterlegen. Preise und Bestellungen werden nach Prüfung freigeschaltet.</p>
    <input name="name" required placeholder="Firmenname / Restaurant" />
    <input name="email" required type="email" placeholder="Geschäftliche E-Mail" />
    <input name="phone" placeholder="Telefon" />
    <input name="address" required placeholder="Lieferadresse" />
    <input name="vatNumber" required placeholder="USt-IdNr. / VAT number" />
    {error && <p className="auth-error">{error}</p>}
    <button disabled={busy} type="submit">{busy ? 'Speichern …' : 'B2B-Antrag senden'}</button>
  </form>;

  return <div className="auth-flow">
    <h2>{mode === 'signin' ? 'Anmelden' : 'B2B-Konto erstellen'}</h2>
    <button type="button" className="google-auth" onClick={google}>Mit Google fortfahren</button>
    <div className="auth-divider"><span>oder</span></div>
    <form onSubmit={emailAuth}>
      {mode === 'signup' && <input name="name" required placeholder="Name" />}
      <input name="email" required type="email" autoComplete="email" placeholder="E-Mail" />
      <input name="password" required type="password" minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Passwort" />
      {error && <p className="auth-error">{error}</p>}
      <button disabled={busy} type="submit">{busy ? 'Bitte warten …' : mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}</button>
    </form>
    <button className="auth-switch" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
      {mode === 'signin' ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
    </button>
  </div>;
}

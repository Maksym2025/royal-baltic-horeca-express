"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { signIn, signOut } from "@/lib/auth-client";

export function AdminLogin({ notice }: { notice?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(result.error.message || "Sign-in failed. Check your email and password.");
        return;
      }
      // A full navigation clears client session/router state before the server role check.
      window.location.replace("/admin");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="rb-adminlogin">
      <section className="rb-adminlogin-brand" aria-hidden="true">
        <div className="rb-adminlogin-logo">
          <Image src="/images/royal-baltic-mark.png" alt="" width={56} height={32} />
          <span>
            ROYAL BALTIC<small>HORECA EXPRESS</small>
          </span>
        </div>
        <div>
          <span className="rb-eyebrow">ADMINISTRATION</span>
          <p>Orders, catalog and customers in one place.</p>
        </div>
      </section>
      <section className="rb-adminlogin-panel">
        <form onSubmit={submit} className="rb-adminlogin-form" aria-busy={busy}>
          <h1>Administrator sign-in</h1>
          <p className="rb-adminlogin-lead">Use the email your invitation was sent to.</p>
          {(error || notice) && (
            <p className="rb-adminlogin-error" role="alert">
              {error || notice}
            </p>
          )}
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            name="email"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy}
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="admin-password">Password</label>
          <div className="rb-adminlogin-password">
          <input
            id="admin-password"
            type={visible ? "text" : "password"}
            name="password"
            disabled={busy}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="rb-adminlogin-reveal" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} aria-controls="admin-password" onClick={() => setVisible((value) => !value)}>
            {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
          </div>
          <button type="submit" disabled={busy || !email || !password}>
            {busy ? "Signing in…" : "Sign in to admin"}
          </button>
          {notice && (
            <button type="button" className="rb-adminlogin-switch" disabled={busy} onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const result = await signOut();
                if (result.error) {
                  setError("Unable to sign out. Please try again.");
                  return;
                }
                window.location.replace("/admin/login");
              } catch {
                setError("Unable to connect. Please try again.");
              } finally { setBusy(false); }
            }}>Sign out of the current account</button>
          )}
          <p className="rb-adminlogin-hint">
            Access is by invitation only. Did the link expire? Ask the owner to send a new one.
          </p>
          <Link href="/" className="rb-adminlogin-back">
            <ArrowLeft size={16} aria-hidden="true" /> Back to the customer site
          </Link>
        </form>
      </section>
    </main>
  );
}

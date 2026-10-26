"use client";
import { useEffect, useState, type FormEvent } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useI18n } from "./i18n-provider";
import { designCopy } from "./design-copy";
import { ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
export function AuthFlow({
  onReady,
  companyMode = false,
  initialSignup = false,
}: {
  onReady?: () => void;
  companyMode?: boolean;
  initialSignup?: boolean;
}) {
  const { t, locale } = useI18n();
  const c = designCopy[locale];
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/auth-capabilities", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { google: false }))
      .then((data) => {
        if (active) setGoogleEnabled(data.google === true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const [visible, setVisible] = useState(false);
  const [signup, setSignup] = useState(initialSignup);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      if (companyMode) {
        const response = await fetch("/api/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(data)),
        });
        if (!response.ok) throw new Error();
      } else {
        const credentials = {
          email: String(data.get("email")),
          password: String(data.get("password")),
        };
        const result = signup
          ? await signUp.email({
              ...credentials,
              name: String(data.get("name")),
            })
          : await signIn.email(credentials);
        if (result.error) throw new Error();
      }
      // Membership is resolved by /api/company after authentication, including existing customers.
      onReady?.();
    } catch {
      setError(t(companyMode ? "error" : "authError"));
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      const r = await signIn.social({
        provider: "google",
        callbackURL: "/live",
      });
      if (r.error) throw new Error();
    } catch {
      setError(t("authError"));
      setBusy(false);
    }
  }
  return (
    <main className="rb-auth">
      <section className="rb-auth-story">
        <span className="rb-eyebrow">ROYAL BALTIC · HORECA</span>
        <h1>{t("welcome")}</h1>
        <p>{t("catalogIntro")}</p>
        <div>
          <ShieldCheck size={24} />
          <p>{t("companyIntro")}</p>
        </div>
      </section>
      <section className="rb-auth-form">
        <h2>
          {t(companyMode ? "registerCompany" : signup ? "signUp" : "signIn")}
        </h2>
        {!companyMode && googleEnabled && (
          <>
            <button
              className="rb-google"
              type="button"
              disabled={busy}
              onClick={() => void google()}
            >
              <span aria-hidden="true">G</span>
              {t("google")}
            </button>
            <p className="rb-divider">{t("or")}</p>
          </>
        )}
        <form onSubmit={submit}>
          {companyMode ? (
            <>
              {(
                ["name", "email", "phone", "address", "vatNumber"] as const
              ).map((key) => (
                <label key={key}>
                  {t(key === "name" ? "companyName" : key)}
                  <input
                    name={key}
                    type={
                      key === "email"
                        ? "email"
                        : key === "phone"
                          ? "tel"
                          : "text"
                    }
                    required={key !== "phone"}
                    maxLength={key === "address" ? 300 : 160}
                  />
                </label>
              ))}
            </>
          ) : (
            <>
              {signup && (
                <label>
                  {t("name")}
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={160}
                  />
                </label>
              )}
              <label>
                {t("email")}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <div className="rb-password-group">
                <label htmlFor="customer-password">{t("password")}</label>
                <span className="rb-password-field">
                  <input
                    id="customer-password"
                    name="password"
                    aria-describedby="customer-password-hint"
                    type={visible ? "text" : "password"}
                    autoComplete={signup ? "new-password" : "current-password"}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    aria-label={visible ? c.hide : c.show}
                    aria-pressed={visible}
                    aria-controls="customer-password"
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
                <small id="customer-password-hint">{t("passwordHint")}</small>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="rb-error">
              {error}
            </p>
          )}
          <button className="rb-primary" disabled={busy}>
            {t(
              busy
                ? "sending"
                : companyMode
                  ? "submitCompany"
                  : signup
                    ? "signUp"
                    : "signIn",
            )}
            <ArrowRight size={18} />
          </button>
        </form>
        {!companyMode && (
          <button
            className="rb-text-button"
            disabled={busy}
            onClick={() => {
              setSignup(!signup);
              setError("");
            }}
          >
            {t(signup ? "haveAccount" : "newAccount")}
          </button>
        )}
      </section>
    </main>
  );
}

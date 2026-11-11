"use client";
import Link from "next/link";
import {useI18n} from "./i18n-provider";
import {designCopy} from "./design-copy";
export function MarketFooter(){const {t,locale}=useI18n();const c=designCopy[locale];return (      <footer className="market-footer">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 85C240 0 400 0 720 65S1200 135 1440 45V120H0Z" fill="currentColor"/></svg>
        <div><h2>ROYAL BALTIC<small>HORECA EXPRESS</small></h2><p>{c.intro}</p><nav><Link href="/live">{t("catalog")}</Link><Link href="/account">{t("account")}</Link><Link href="/admin/login">Administration</Link><a href="mailto:sale@royal-baltic.com">sale@royal-baltic.com</a></nav><p>Royal Baltic &amp;Co OÜ · 09:00–18:00</p></div>
      </footer>);}

"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CatalogButton } from "./landing-hero";
import { Globe, UserRound, Fish, Package } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { isLocale, languageNames, locales } from "@/lib/i18n/dictionaries";
export function AppHeader() {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  const landing = pathname === "/";
  // The administration area has its own chrome: never show the customer header there.
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return null;
  return (
    <header className="rb-header">
      <Link href="/" className="rb-brand">
        <Image src="/images/royal-baltic-mark.png" alt="" width={56} height={40} />
        <span>
          ROYAL BALTIC<small>HORECA EXPRESS</small>
        </span>
      </Link>
      {landing && <CatalogButton compact />}
      <nav aria-label="Royal Baltic">
        <Link href="/live">
          <Fish size={18} />
          <span>{t("catalog")}</span>
        </Link>
        <Link href="/account?view=orders">
          <Package size={18} />
          <span>{t("orders")}</span>
        </Link>
        <Link href="/account">
          <UserRound size={18} />
          <span>{t("account")}</span>
        </Link>
      </nav>
      <label className="rb-language">
        <Globe size={17} />
        <span className="sr-only">{t("language")}</span>
        <select
          value={locale}
          onChange={(e) => {
            if (isLocale(e.target.value)) setLocale(e.target.value);
          }}
        >
          {locales.map((l) => (
            <option value={l} key={l}>
              {languageNames[l]}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

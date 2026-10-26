"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Globe,
  UserRound,
  Fish,
  Package,
  Home,
  ShoppingBag,
} from "lucide-react";
import { useI18n } from "./i18n-provider";
import { isLocale, locales } from "@/lib/i18n/dictionaries";
import { designCopy } from "./design-copy";
export function AppHeader() {
  const { locale, setLocale, t } = useI18n();
  const path = usePathname();
  if (path === "/admin" || path.startsWith("/admin/")) return null;
  const links = [
    ["/", designCopy[locale].home, Home],
    ["/live", t("catalog"), Fish],
    ["/account?view=orders", t("orders"), Package],
    ["/live#cart", t("cart"), ShoppingBag],
    ["/account", t("account"), UserRound],
  ] as const;
  return (
    <>
      <header className="rb-header">
        <Link href="/" className="rb-brand">
          <Image src="/design/mark.png" alt="" width={54} height={32} />
          <span>
            ROYAL BALTIC<small>HORECA EXPRESS</small>
          </span>
        </Link>
        <nav aria-label="Royal Baltic">
          {links
            .filter(([href]) => href !== "/live#cart")
            .map(([href, label, Icon]) => (
              <Link
                href={href}
                key={href}
                aria-current={
                  path === href.split("?")[0] && !href.includes("?")
                    ? "page"
                    : undefined
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
        </nav>
        <label className="rb-language">
          <Globe size={18} aria-hidden="true" />
          <span className="sr-only">{t("language")}</span>
          <select
            aria-label={t("language")}
            value={locale}
            onChange={(e) => {
              if (isLocale(e.target.value)) setLocale(e.target.value);
            }}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </header>
    </>
  );
}

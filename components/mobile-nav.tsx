"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Fish, Package, ShoppingBag, UserRound } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { designCopy } from "./design-copy";
export function MobileNav() {
  const path = usePathname();
  const params = useSearchParams();
  const { t, locale } = useI18n();
  if (path === "/admin" || path.startsWith("/admin/")) return null;
  const active =
    path === "/account" && params.get("view") === "orders"
      ? "orders"
      : path === "/account"
        ? "account"
        : path === "/live"
          ? "catalog"
          : path === "/checkout" || path === "/cart"
            ? "cart"
            : path === "/"
              ? "home"
              : "";
  const links = [
    ["/", designCopy[locale].home, Home, "home"],
    ["/live", t("catalog"), Fish, "catalog"],
    ["/account?view=orders", t("orders"), Package, "orders"],
    ["/cart", t("cart"), ShoppingBag, "cart"],
    ["/account", t("account"), UserRound, "account"],
  ] as const;
  return (
    <nav className="rb-bottom-nav" aria-label="HoReCa Express">
      {links.map(([href, label, Icon, id]) => (
        <Link
          key={id}
          href={href}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

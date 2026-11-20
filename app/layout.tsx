import { cookies } from "next/headers";
import { I18nProvider } from "@/components/i18n-provider";
import { MarketFooter } from "@/components/market-footer";
import { AppHeader } from "@/components/app-header";
import { isLocale } from "@/lib/i18n/dictionaries";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./procurement.css";
import "./design-fonts.css";
import "./market.css";
import "./buyer.css";
import "./product-intent.css";
import "./catalog-facets.css";
import { ProductIntentProvider } from "@/components/product-intent-provider";
export const metadata: Metadata = {
  title: "Royal Baltic · HoReCa Express",
  description:
    "Poissons et fruits de mer pour les professionnels. Catalogue et prix ouverts, commande par carton.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Royal Baltic",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12394a",
  viewportFit: "cover",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = (await cookies()).get("rb_locale")?.value;
  const locale = isLocale(value) ? value : "fr";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <I18nProvider initialLocale={locale}>
          <ProductIntentProvider>
          <AppHeader />
          {children}
          <MarketFooter />
          </ProductIntentProvider>
        </I18nProvider>
      </body>
    </html>
  );
}


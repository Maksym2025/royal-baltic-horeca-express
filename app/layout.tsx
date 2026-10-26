import { MobileViewport } from "@/components/mobile-viewport";
import { cookies } from "next/headers";
import { I18nProvider } from "@/components/i18n-provider";
import { AppHeader } from "@/components/app-header";
import { isLocale } from "@/lib/i18n/dictionaries";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./procurement.css";
export const metadata: Metadata = {
  title: "Royal Baltic · HoReCa Express",
  description:
    "Fisch und Meeresfrüchte für Ihre Küche. Der mobile B2B-Bestellkatalog von Royal Baltic.",
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
  themeColor: "#0a1728",
  viewportFit: "cover",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = (await cookies()).get("rb_locale")?.value;
  const locale = isLocale(value) ? value : "en";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <I18nProvider initialLocale={locale}>
          <MobileViewport />
          <AppHeader />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

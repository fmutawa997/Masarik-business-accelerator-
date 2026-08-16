import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans, Amiri } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { SettingsProvider } from "@/lib/SettingsProvider";
import { getSiteSettings } from "@/lib/settings.server";
import { resolveTheme } from "@/lib/theme";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
});
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const brand = s.brand_name || "Masarik";
  return {
    title: s.tagline ? `${brand} — ${s.tagline}` : `${brand} — Where capital meets conviction`,
    description:
      "Kuwait business incubator: office space across three towers, mentorship, services, events, member offers and funding.",
    icons: s.icon_url ? { icon: s.icon_url, apple: s.icon_url } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#541724",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load the super admin's appearance choices and apply them site-wide (no flash).
  const settings = await getSiteSettings();
  const theme = resolveTheme(settings);

  return (
    <html lang="en" dir="ltr">
      <head>
        {theme.fontsHref && <link rel="stylesheet" href={theme.fontsHref} />}
        <style dangerouslySetInnerHTML={{ __html: theme.css }} />
      </head>
      <body
        className={`${cormorant.variable} ${instrument.variable} ${amiri.variable}`}
      >
        <SettingsProvider settings={settings}>
          <LangProvider>{children}</LangProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

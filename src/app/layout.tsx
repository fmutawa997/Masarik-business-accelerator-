import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans, Amiri } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { SettingsProvider } from "@/lib/SettingsProvider";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme, DEFAULT_SETTINGS, type SiteSettings } from "@/lib/theme";

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

export const metadata: Metadata = {
  title: "Masarik Incubators — Where capital meets conviction",
  description:
    "Kuwait business incubator: office space across three towers, mentorship, services, events, member offers and funding.",
};

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
  let settings: SiteSettings = DEFAULT_SETTINGS;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("*").eq("id", "default").single();
    if (data) settings = { ...DEFAULT_SETTINGS, ...data };
  } catch {
    /* fall back to defaults */
  }
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

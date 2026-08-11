import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans, Amiri } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangProvider";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${cormorant.variable} ${instrument.variable} ${amiri.variable}`}
      >
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}

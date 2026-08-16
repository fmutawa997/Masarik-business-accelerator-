import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/settings.server";

// Dynamic PWA manifest — name + icon come from the super admin's settings,
// so "Add to Home Screen" uses the brand's own name and app icon.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSiteSettings();
  const name = s.brand_name || "Masarik";
  const icon = s.icon_url;
  return {
    name,
    short_name: name,
    description: s.tagline || "Where capital meets conviction",
    start_url: "/",
    display: "standalone",
    background_color: s.page_bg || "#EFEAE5",
    theme_color: s.accent_dark || "#541724",
    icons: icon
      ? [
          { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
        ]
      : [],
  };
}

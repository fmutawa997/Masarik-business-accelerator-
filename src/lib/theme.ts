// Appearance customization: curated fonts + "feel" presets the super admin can pick.
// Applied globally by the root layout as CSS-variable overrides.

export type SiteSettings = {
  accent: string;
  accent_dark: string;
  page_bg: string;
  font_display: string;
  font_body: string;
  ambiance: "warm" | "cool" | "noir";
  density: "compact" | "default" | "comfortable";
  brand_name: string;
  tagline: string;
  logo_url: string | null;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  accent: "#6A1F2D",
  accent_dark: "#541724",
  page_bg: "#EFEAE5",
  font_display: "Cormorant Garamond",
  font_body: "Instrument Sans",
  ambiance: "warm",
  density: "default",
  brand_name: "MASARIK",
  tagline: "",
  logo_url: null,
};

// name → Google Fonts css2 family param. "Cormorant Garamond" / "Instrument Sans"
// are the built-in (next/font) defaults and don't need a Google <link>.
export const DISPLAY_FONTS: { name: string; param: string | null }[] = [
  { name: "Cormorant Garamond", param: null },
  { name: "Playfair Display", param: "Playfair+Display:wght@400;500;600;700" },
  { name: "Fraunces", param: "Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600" },
  { name: "DM Serif Display", param: "DM+Serif+Display:wght@400" },
  { name: "Marcellus", param: "Marcellus" },
  { name: "Libre Baskerville", param: "Libre+Baskerville:wght@400;700" },
];

export const BODY_FONTS: { name: string; param: string | null }[] = [
  { name: "Instrument Sans", param: null },
  { name: "Inter", param: "Inter:wght@400;500;600;700" },
  { name: "DM Sans", param: "DM+Sans:wght@400;500;600;700" },
  { name: "Work Sans", param: "Work+Sans:wght@400;500;600;700" },
  { name: "Manrope", param: "Manrope:wght@400;500;600;700" },
];

export const AMBIANCE: Record<SiteSettings["ambiance"], string> = {
  warm: "none",
  cool: "saturate(.85) hue-rotate(-8deg) brightness(1.02)",
  noir: "saturate(.35) contrast(1.05) brightness(.96)",
};

export const DENSITY: Record<SiteSettings["density"], string> = {
  compact: "0.94",
  default: "1",
  comfortable: "1.06",
};

function paramFor(list: { name: string; param: string | null }[], name: string) {
  return list.find((f) => f.name === name)?.param ?? null;
}

// Everything the layout needs to apply a settings object.
export function resolveTheme(s: SiteSettings) {
  const dParam = paramFor(DISPLAY_FONTS, s.font_display);
  const bParam = paramFor(BODY_FONTS, s.font_body);
  const families = [dParam, bParam].filter(Boolean) as string[];
  const fontsHref = families.length
    ? `https://fonts.googleapis.com/css2?${families.map((f) => "family=" + f).join("&")}&display=swap`
    : null;

  const displayStack =
    s.font_display === "Cormorant Garamond"
      ? "var(--font-cormorant), 'Amiri', serif"
      : `'${s.font_display}', 'Amiri', serif`;
  const bodyStack =
    s.font_body === "Instrument Sans"
      ? "var(--font-instrument), 'Amiri', sans-serif"
      : `'${s.font_body}', 'Amiri', sans-serif`;

  return {
    fontsHref,
    css: `:root{
      --accent:${s.accent};
      --accent-dark:${s.accent_dark};
      --page:${s.page_bg};
      --font-display:${displayStack};
      --font-body:${bodyStack};
      --app-filter:${AMBIANCE[s.ambiance] ?? "none"};
      --app-zoom:${DENSITY[s.density] ?? "1"};
    }`,
  };
}

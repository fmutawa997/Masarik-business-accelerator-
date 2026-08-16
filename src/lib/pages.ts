// Editable page content types (shared by the page renderers and the admin editor).
export type Bilingual = { en: string; ar: string };

export type PageButton = {
  label: Bilingual;
  href: string;
  variant: "primary" | "outline" | "ghost" | "dark";
};

export type LandingContent = {
  headline?: Bilingual;
  subtitle?: Bilingual;
  heroImage?: string;
  showDemo?: boolean;
  buttons?: PageButton[];
};

export const LANDING_DEFAULT: LandingContent = {
  headline: { en: "Where capital meets conviction.", ar: "حيث يلتقي رأس المال بالقناعة." },
  subtitle: {
    en: "Capital, workspace, mentorship, licensing and market access — several paths, one house, built by operators who run real businesses in Kuwait.",
    ar: "رأس مال، مساحات عمل، إرشاد، تراخيص ووصول للسوق — عدة مسارات في بيت واحد، بناه مشغّلون يديرون أعمالًا حقيقية في الكويت.",
  },
  heroImage: "/assets/lounge.png",
  showDemo: true,
  buttons: [
    { label: { en: "Create account", ar: "إنشاء حساب" }, href: "/signup", variant: "primary" },
    { label: { en: "I already have an account", ar: "لديّ حساب بالفعل" }, href: "/login", variant: "ghost" },
  ],
};

// Link options offered in the button editor (plus a free-text custom URL).
export const LINK_OPTIONS = [
  "/signup", "/login", "/home", "/spaces", "/services", "/services/packages",
  "/experts", "/events", "/offers", "/tenant", "/fundme", "/ai", "/call",
];

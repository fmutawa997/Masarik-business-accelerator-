"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { useProfile } from "@/lib/ProfileProvider";
import { useSettings } from "@/lib/SettingsProvider";
import { SectionTitle, Diamond, LangToggle } from "@/components/ui";
import type { Tower, EventRow } from "@/lib/types";

export default function HomeScreen({
  towers,
  featured,
}: {
  towers: Tower[];
  featured: EventRow | null;
}) {
  const { t, lang } = useLang();
  const profile = useProfile();
  const settings = useSettings();
  const firstName =
    (profile.display_name || profile.full_name || "").trim().split(/\s+/)[0] ||
    (lang === "ar" ? "صديقنا" : "there");

  const alhamrah = towers.find((x) => x.id === "alhamrah");
  const khaleejia = towers.find((x) => x.id === "khaleejia");
  const salmiya = towers.find((x) => x.id === "salmiya");
  const nm = (tw?: Tower) => (!tw ? "" : lang === "ar" ? tw.name_ar : tw.name_en);
  const pl = (tw?: Tower) => (!tw ? "" : lang === "ar" ? tw.price_label_ar : tw.price_label_en);

  const quick = [
    { title: t.bookOffice, sub: t.bookOfficeSub, href: "/spaces" },
    { title: t.servicesQ, sub: t.servicesQSub, href: "/services" },
  ];

  return (
    <div className="flex flex-col">
      {/* Burgundy header */}
      <div className="flex flex-col gap-3 bg-accent-dark px-5 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={settings.brand_name || t.brand} className="h-6 w-auto object-contain" />
            ) : (
              <span className="text-[13px] font-semibold tracking-[0.26em] text-screen">
                {settings.brand_name || t.brand}
              </span>
            )}
            <span className="text-[9.5px] font-medium tracking-[0.1em] text-screen/60">
              {settings.tagline || t.tagline}
            </span>
          </div>
          <LangToggle dark />
        </div>
        <div className="font-display text-[24px] leading-tight text-screen">
          {t.greetName}, {firstName}.
          <br />
          <span className="text-[16px] text-screen/65">{t.begin}</span>
        </div>
        <Link
          href="/ai"
          className="flex items-center gap-2.5 rounded-xl border border-screen/25 bg-screen/10 px-3.5 py-3"
        >
          <Diamond className="bg-screen" size={8} />
          <span className="text-[12.5px] text-screen/80">{t.askAi}</span>
        </Link>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-5 py-4">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2.5">
          {quick.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-hair bg-surface p-3.5 transition-colors hover:border-accent"
            >
              <Diamond />
              <div>
                <div className="font-display text-[15.5px] font-semibold">{q.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-muted">{q.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        <SectionTitle action={t.viewAll} href="/spaces">
          {t.ourSpaces}
        </SectionTitle>

        {/* AlHamrah big card */}
        {alhamrah && (
          <Link href="/spaces/alhamrah" className="relative block h-[122px] overflow-hidden rounded-2xl">
            <Image src={alhamrah.image || "/assets/office-luxury.png"} alt={nm(alhamrah)} fill className="object-cover" />
            <div className="scrim pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-3.5 bottom-3 flex items-end justify-between">
              <div>
                <div className="font-display text-[16px] font-semibold text-screen">{nm(alhamrah)}</div>
                <div className="text-[10.5px] text-screen/80">
                  {lang === "ar" ? alhamrah.sub_ar : alhamrah.sub_en}
                </div>
              </div>
              <div className="rounded-full border border-screen/35 bg-screen/15 px-2.5 py-1.5 text-[10px] font-semibold text-screen">
                {alhamrah.units_available > 0
                  ? `${alhamrah.units_available} ${t.available}`
                  : t.waitlistBadge}
              </div>
            </div>
          </Link>
        )}

        {/* Khaleejia + Salmiya */}
        <div className="flex gap-2.5">
          <SmallSpace tower={khaleejia} label={nm(khaleejia)} sub={`${pl(khaleejia)}`} href="/spaces/khaleejia" />
          <SmallSpace tower={salmiya} label={nm(salmiya)} sub={`${pl(salmiya)}`} href="/spaces/salmiya" />
        </div>

        {/* Featured event */}
        {featured && (
          <div className="flex items-center gap-3 border-t border-hair pt-3">
            <div className="flex h-[46px] w-[42px] flex-none flex-col items-center justify-center rounded-[10px] border border-accent">
              <span className="font-display text-[15px] font-semibold text-accent">{featured.day}</span>
              <span className="text-[8px] font-semibold tracking-widest text-accent">
                {lang === "ar" ? featured.month_ar : featured.month_en}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-display text-[13.5px] font-semibold">
                {lang === "ar" ? featured.title_ar : featured.title_en}
              </div>
              <div className="text-[10.5px] text-muted">
                {lang === "ar" ? featured.sub_ar : featured.sub_en}
              </div>
            </div>
            <Link href="/events" className="text-[11px] font-semibold text-accent">
              {t.rsvp}
            </Link>
          </div>
        )}

        {/* Offers banner */}
        <Link href="/offers" className="flex items-center gap-3 rounded-2xl bg-accent-dark px-4 py-3.5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-screen/15">
            <Diamond className="bg-screen" size={10} />
          </span>
          <div className="flex-1">
            <div className="font-display text-[14px] font-semibold text-screen">{t.offHomeTitle}</div>
            <div className="text-[10.5px] text-screen/75">{t.offHomeSub}</div>
          </div>
          <span className="flip-rtl text-screen/80">›</span>
        </Link>
      </div>
    </div>
  );
}

function SmallSpace({
  tower,
  label,
  sub,
  href,
}: {
  tower?: Tower;
  label: string;
  sub: string;
  href: string;
}) {
  if (!tower) return <div className="flex-1" />;
  return (
    <Link href={href} className="relative block h-[90px] flex-1 overflow-hidden rounded-2xl">
      <Image src={tower.image || "/assets/office-economic.png"} alt={label} fill className="object-cover" />
      <div className="scrim pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-2.5 bottom-2">
        <div className="font-display text-[13px] font-semibold text-screen">{label}</div>
        <div className="text-[10px] text-screen/80">{sub}</div>
      </div>
    </Link>
  );
}

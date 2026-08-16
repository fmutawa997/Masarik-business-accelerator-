"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LangProvider";
import { BackHeader, Diamond } from "@/components/ui";
import type { Offer } from "@/lib/types";

export default function OffersScreen({ offers }: { offers: Offer[] }) {
  const { t, lang } = useLang();
  return (
    <div className="flex flex-col gap-3 px-5 py-4 lg:px-8 lg:py-8">
      <BackHeader title={t.offersTitle} backHref="/home" />
      <p className="text-[12px] leading-relaxed text-muted">{t.offersSub}</p>
      <div className="grid gap-3 lg:grid-cols-3">
      {offers.map((o) => (
        <div key={o.id} className="overflow-hidden rounded-2xl border border-hair bg-surface">
          <div className="relative h-[110px]">
            <Image src={o.image} alt={o.name_en} fill className="object-cover" />
            <div className="scrim pointer-events-none absolute inset-0" />
            <span className="absolute end-2.5 top-2.5 rounded-xl bg-accent px-2.5 py-2 font-display text-[15px] font-bold text-screen">
              {o.discount}{" "}
              <span className="text-[8px] font-semibold tracking-wider">{t.discOff}</span>
            </span>
            <div className="absolute start-3.5 bottom-3">
              <div className="font-display text-[16px] font-semibold text-screen">
                {lang === "ar" ? o.name_ar : o.name_en}
              </div>
              <div className="text-[10px] text-screen/80">{lang === "ar" ? o.cat_ar : o.cat_en}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3.5">
            <Diamond size={8} />
            <span className="flex-1 text-[12.5px] font-medium">
              {lang === "ar" ? o.perk_ar : o.perk_en}
            </span>
          </div>
        </div>
      ))}
      </div>
      <p className="text-center text-[10.5px] text-muted">{t.offMemberNote}</p>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import type { Tower } from "@/lib/types";

export default function SpacesScreen({ towers }: { towers: Tower[] }) {
  const { t, lang } = useLang();
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="font-display text-[25px] font-semibold">{t.ourSpaces}</div>
      {towers.map((tw) => {
        const pct = tw.units_total ? (1 - tw.units_available / tw.units_total) * 100 : 100;
        const availLabel =
          tw.units_available > 0
            ? `${tw.units_available} ${t.available}`
            : `${tw.units_total}/${tw.units_total} ${t.rented}`;
        return (
          <Link
            key={tw.id}
            href={`/spaces/${tw.id}`}
            className="overflow-hidden rounded-2xl border border-hair bg-surface transition-colors hover:border-accent"
          >
            <div className="relative h-[100px]">
              <Image src={tw.image || "/assets/office-luxury.png"} alt={tw.name_en} fill className="object-cover" />
              <span className="absolute start-2.5 top-2.5 rounded-full bg-accent-dark px-2.5 py-1.5 text-[9px] font-semibold tracking-widest text-screen">
                {lang === "ar" ? tw.tier_ar : tw.tier_en}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[16px] font-semibold">
                  {lang === "ar" ? tw.name_ar : tw.name_en}
                </span>
                <span className="text-[11.5px] font-semibold text-accent">
                  {lang === "ar" ? tw.price_label_ar : tw.price_label_en}
                </span>
              </div>
              <div className="text-[11px] leading-snug text-muted">
                {lang === "ar" ? tw.sub_ar : tw.sub_en}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-tint">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-muted">{availLabel}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

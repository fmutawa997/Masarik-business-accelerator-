"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LangProvider";
import { usePay } from "@/lib/pay";
import { kd } from "@/lib/format";
import { BackHeader, Btn } from "@/components/ui";
import type { Expert } from "@/lib/types";

export default function ExpertsScreen({ experts }: { experts: Expert[] }) {
  const { t, lang } = useLang();
  const { start, busy } = usePay();

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <BackHeader title={t.expTitle} backHref="/services" />
      <p className="text-[12px] leading-relaxed text-muted">{t.expSub}</p>

      {experts.map((ex) => {
        const skills = lang === "ar" ? ex.skills_ar : ex.skills_en;
        const consultCode = ex.id === "fa" ? "consult-fa" : "consult-aa";
        return (
          <div key={ex.id} className="flex flex-col gap-3 rounded-2xl border border-hair bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-[46px] w-[46px] flex-none overflow-hidden rounded-full bg-accent-dark">
                <Image src={ex.avatar} alt={ex.name_en} fill className="object-cover" />
              </div>
              <div>
                <div className="font-display text-[16px] font-semibold">
                  {lang === "ar" ? ex.name_ar : ex.name_en}
                </div>
                <div className="text-[10px] font-semibold tracking-wider text-accent">
                  {lang === "ar" ? ex.role_ar : ex.role_en}
                </div>
              </div>
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted">
              {lang === "ar" ? ex.bio_ar : ex.bio_en}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span key={i} className="rounded-full bg-tint px-2.5 py-1.5 text-[10px] font-semibold text-accent">
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-hair pt-3">
              <span className="text-[12px] font-semibold">
                {kd(ex.price_kwd, lang)} · {ex.duration_min} {lang === "ar" ? "دقيقة" : "min"}
              </span>
              <Btn
                onClick={() =>
                  start({ kind: "consult", service_code: consultCode, label: lang === "ar" ? ex.name_ar : ex.name_en })
                }
                disabled={busy}
                className="max-w-[200px]"
              >
                {busy ? t.payProcessing : t.bookConsult}
              </Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

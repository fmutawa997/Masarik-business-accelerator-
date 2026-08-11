"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { usePay } from "@/lib/pay";
import { kd } from "@/lib/format";
import { BackHeader, Btn, Chip, Diamond, cx } from "@/components/ui";
import type { Service } from "@/lib/types";

function Inner({ packages }: { packages: Service[] }) {
  const { t, lang } = useLang();
  const params = useSearchParams();
  const initialCat = params.get("cat") || "mktg";
  const { start, busy } = usePay();

  const [cat, setCat] = useState(initialCat);
  const [open, setOpen] = useState<string | null>(null);

  const cats = [
    { key: "mktg", label: t.catMktg },
    { key: "fin", label: t.catFin },
    { key: "bd", label: t.catBd },
  ];
  const list = packages.filter((p) => p.category === cat);

  return (
    <div className="flex flex-col gap-2.5 px-5 py-4">
      <BackHeader title={t.packages} backHref="/services" />

      <div className="flex gap-1.5">
        {cats.map((c) => (
          <Chip key={c.key} label={c.label} active={cat === c.key} onClick={() => setCat(c.key)} />
        ))}
      </div>

      {list.map((p) => {
        const isOpen = open === p.code;
        const feats = lang === "ar" ? p.features_ar : p.features_en;
        return (
          <div
            key={p.code}
            className={cx(
              "overflow-hidden rounded-2xl border bg-surface",
              isOpen ? "border-accent" : "border-hair",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : p.code)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-start"
            >
              <div className="flex-1 font-display text-[15px] font-semibold">
                {lang === "ar" ? p.name_ar : p.name_en}
              </div>
              <span className="text-[13px] font-bold text-accent">{kd(p.price_kwd, lang)}</span>
              <span className={cx("text-muted transition-transform", isOpen && "rotate-180")}>⌄</span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1.5 px-4 pb-3.5">
                {feats.map((f, i) => (
                  <div key={i} className="flex items-baseline gap-2.5">
                    <Diamond size={6} />
                    <span className="text-[12px] leading-snug">{f}</span>
                  </div>
                ))}
                <Btn
                  onClick={() =>
                    start({
                      kind: "package",
                      service_code: p.code,
                      label: lang === "ar" ? p.name_ar : p.name_en,
                    })
                  }
                  disabled={busy}
                  className="mt-2 w-full"
                >
                  {busy ? t.payProcessing : `${t.payViaKnet} · ${kd(p.price_kwd, lang)}`}
                </Btn>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-center text-[10.5px] leading-relaxed text-muted">{t.pkgPayNote}</p>
    </div>
  );
}

export default function PackagesScreen({ packages }: { packages: Service[] }) {
  return (
    <Suspense fallback={null}>
      <Inner packages={packages} />
    </Suspense>
  );
}

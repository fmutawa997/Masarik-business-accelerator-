"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { kd } from "@/lib/format";
import { BackHeader, Btn, Field, cx } from "@/components/ui";
import type { FundmeApp } from "@/lib/types";

const STAGES = ["submitted", "review", "analysis", "decision"] as const;

export default function FundmeScreen({ apps }: { apps: FundmeApp[] }) {
  const { t, lang } = useLang();
  const supabase = useSupabase();

  const [list, setList] = useState<FundmeApp[]>(apps);
  const [showForm, setShowForm] = useState(apps.length === 0);
  const [business, setBusiness] = useState("");
  const [sector, setSector] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const app = list[0];

  async function submit() {
    if (!business) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("fundme_applications")
      .insert({ business_name: business, sector, amount_kwd: Number(amount) || null })
      .select("*")
      .single();
    setBusy(false);
    if (!error && data) {
      setList([data as FundmeApp, ...list]);
      setShowForm(false);
    }
  }

  const activeIdx = app ? STAGES.indexOf(app.stage) : 0;

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <BackHeader title={t.fmTitle} backHref="/profile" />

      {app && !showForm ? (
        <>
          <div className="rounded-2xl bg-accent-dark p-4">
            <div className="text-[9px] font-semibold tracking-widest text-screen/65">
              FUND ME · #MK-{new Date(app.created_at).getFullYear()}-
              {app.id.slice(0, 4).toUpperCase()}
            </div>
            <div className="mt-1 font-display text-[17px] font-semibold text-screen">
              {app.business_name}
            </div>
            <div className="mt-0.5 text-[11px] text-screen/75">
              {t.fmAmount}: {kd(app.amount_kwd ?? 0, lang)} · {app.sector}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-1">
            {t.fmSteps.map((title, i) => {
              const done = i < activeIdx;
              const now = i === activeIdx;
              return (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={cx(
                      "flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[10px] font-bold text-white",
                      done ? "bg-success" : now ? "bg-accent" : "border border-hair bg-surface text-muted",
                    )}
                  >
                    {done ? "✓" : now ? "●" : ""}
                  </span>
                  <div className="flex-1 pb-3">
                    <div className={cx("text-[13px] font-semibold", now && "text-accent")}>{title}</div>
                    <div className="text-[11px] text-muted">{t.fmStepSubs[i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <Btn onClick={() => setShowForm(true)} variant="outline" className="w-full">
            {t.fmNewCta}
          </Btn>
        </>
      ) : (
        <>
          <Field label={t.fmBusiness} value={business} onChange={setBusiness} placeholder={t.namePh} />
          <Field label={t.fmSector} value={sector} onChange={setSector} placeholder="F&B · Retail · Tech…" />
          <Field label={t.fmAmount} value={amount} onChange={setAmount} placeholder="45000" />
          <Btn onClick={submit} disabled={busy || !business} className="w-full py-4">
            {busy ? t.loading : t.fmSubmit}
          </Btn>
        </>
      )}
    </div>
  );
}

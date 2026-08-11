"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useProfile } from "@/lib/ProfileProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { kd } from "@/lib/format";
import { Btn, Field, Label, Chip, SuccessCard, cx } from "@/components/ui";
import type { Tower, Office } from "@/lib/types";

export default function TowerScreen({ tower, offices }: { tower: Tower; offices: Office[] }) {
  const { t, lang } = useLang();
  const profile = useProfile();
  const supabase = useSupabase();
  const router = useRouter();

  const available = offices.filter((o) => o.status === "available");
  const canBook = available.length > 0;

  // waitlist state
  const [wlName, setWlName] = useState(profile.full_name || "");
  const [wlPhone, setWlPhone] = useState(profile.phone || "");
  const [wlDone, setWlDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // booking state
  const [unit, setUnit] = useState<string | null>(available[0]?.id ?? null);
  const [term, setTerm] = useState(0);
  const [cid, setCid] = useState(false);
  const [bookDone, setBookDone] = useState(false);

  const nm = lang === "ar" ? tower.name_ar : tower.name_en;
  const tier = lang === "ar" ? tower.tier_ar : tower.tier_en;

  const rentedCount = offices.filter((o) => o.status === "rented").length;
  const rent = available.find((o) => o.id === unit)?.monthly_rent
    ? Number(available.find((o) => o.id === unit)!.monthly_rent)
    : Number(offices[0]?.monthly_rent ?? 0);
  const months = term === 0 ? 12 : 24;
  const monthly = term === 1 ? Math.round(rent * 0.9) : rent;
  const deposit = monthly;
  const dueSigning = monthly + deposit;
  const total = monthly * months;

  async function joinWaitlist() {
    if (!wlName || !wlPhone) return;
    setBusy(true);
    const { error } = await supabase.from("waitlist").insert({
      tower_id: tower.id,
      name: wlName,
      phone: wlPhone,
    });
    setBusy(false);
    if (!error) setWlDone(true);
  }

  async function confirmBooking() {
    if (!unit || !cid) return;
    setBusy(true);
    const off = available.find((o) => o.id === unit)!;
    const { error } = await supabase.from("lease_requests").insert({
      office_id: off.id,
      tower_id: tower.id,
      unit_no: off.unit_no,
      term_months: months,
      monthly_rent: monthly,
      deposit,
      total,
      civil_id_attached: cid,
    });
    setBusy(false);
    if (!error) setBookDone(true);
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="relative h-[190px] flex-none">
        <Image src={tower.image || "/assets/office-luxury.png"} alt={nm} fill className="object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,rgba(58,15,24,.45) 0%,rgba(58,15,24,0) 40%,rgba(58,15,24,.85) 100%)",
          }}
        />
        <button
          onClick={() => router.push("/spaces")}
          className="absolute start-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-screen/40 bg-screen/20 text-[15px] text-screen"
        >
          <span className="flip-rtl">‹</span>
        </button>
        <div className="absolute inset-x-5 bottom-3.5">
          <div className="text-[9.5px] font-semibold tracking-[0.16em] text-screen/75">{tier}</div>
          <div className="mt-1 font-display text-[23px] font-semibold text-screen">{nm}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-6 pt-3.5">
        {/* Stat tiles */}
        <div className="flex gap-2">
          <Stat main={`${offices[0]?.size_m2 ?? "—"} m²`} sub={t.suiteSize} />
          <Stat main={kd(rent, lang)} sub={t.perMonth} />
          <Stat
            main={`${rentedCount}/${offices.length}`}
            sub={t.rented}
          />
        </div>

        {bookDone ? (
          <div className="mt-3">
            <SuccessCard title={t.bookedTitle} sub={t.bookedSub} />
            <Btn href="/tenant" variant="outline" className="mt-3 w-full">
              {t.goPortal}
            </Btn>
          </div>
        ) : canBook ? (
          /* ---- Booking flow (available units) ---- */
          <>
            <Label>{t.chooseOffice}</Label>
            <div className="grid grid-cols-4 gap-2">
              {available.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setUnit(o.id)}
                  className={cx(
                    "rounded-xl border-[1.5px] px-1.5 py-2.5 text-center transition-colors",
                    unit === o.id ? "border-accent bg-tint" : "border-hair bg-surface",
                  )}
                >
                  <div className="text-[12px] font-bold text-ink">{o.unit_no}</div>
                  <div className="text-[8.5px] text-muted">{o.size_m2} m²</div>
                </button>
              ))}
            </div>

            <Label>{t.leaseTerm}</Label>
            <div className="flex gap-2">
              {[t.term12, t.term24].map((label, i) => (
                <button
                  key={i}
                  onClick={() => setTerm(i)}
                  className={cx(
                    "flex-1 rounded-xl border-[1.5px] bg-surface px-2 py-2.5 text-center transition-colors",
                    term === i ? "border-accent" : "border-hair",
                  )}
                >
                  <div className="text-[12.5px] font-bold">{label}</div>
                </button>
              ))}
            </div>

            {/* Contract summary */}
            <div className="flex flex-col gap-2 rounded-2xl border border-hair bg-surface p-3.5">
              <Label>{t.contractSummary}</Label>
              <Row label={t.leaseTerm} value={`${months} ${lang === "ar" ? "شهرًا" : "months"}`} />
              <Row label={t.monthlyLbl} value={kd(monthly, lang)} />
              <Row label={t.dueSigning} value={kd(dueSigning, lang)} />
              <div className="flex justify-between border-t border-hair pt-2 text-[13.5px] font-bold">
                <span>{t.totalContract}</span>
                <span className="text-accent">{kd(total, lang)}</span>
              </div>
            </div>

            {/* Civil ID */}
            <button
              onClick={() => setCid((v) => !v)}
              className={cx(
                "flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed px-3.5 py-3 text-start",
                cid ? "border-success bg-[#f4faf5]" : "border-edit bg-[#fbf9f7]",
              )}
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-tint">
                <span className="block h-3.5 w-2.5 rounded-[2px] border-[1.5px] border-accent" />
              </span>
              <div className="flex-1">
                <div className="text-[12.5px] font-semibold">{t.cidTitle}</div>
                <div className={cx("text-[10.5px]", cid ? "text-success" : "text-muted")}>
                  {cid ? t.cidDone : t.cidTap}
                </div>
              </div>
            </button>

            <p className="text-[11px] leading-relaxed text-muted">{t.payNote}</p>

            <Btn onClick={confirmBooking} disabled={!cid || busy} className="w-full py-4">
              {busy ? t.loading : t.confirmBooking}
            </Btn>
          </>
        ) : wlDone ? (
          <div className="mt-1 flex items-center gap-3 rounded-2xl border-[1.5px] border-success bg-surface p-4">
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-success text-[13px] font-bold text-white">
              ✓
            </span>
            <div>
              <div className="text-[14px] font-semibold">{t.wlDoneTitle}</div>
              <div className="text-[11.5px] text-muted">{t.wlDoneSub}</div>
            </div>
          </div>
        ) : (
          /* ---- Waitlist (fully rented) ---- */
          <>
            <div className="rounded-2xl bg-accent-dark px-4 py-3 text-[12.5px] leading-relaxed text-screen">
              {t.fullyRentedMsg}
            </div>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-4">
              <div className="font-display text-[17px] font-semibold">{t.wlTitle}</div>
              <Field label={t.name} value={wlName} onChange={setWlName} placeholder={t.namePh} />
              <Field label={t.phone} value={wlPhone} onChange={setWlPhone} placeholder="+965" />
              <Btn onClick={joinWaitlist} disabled={busy || !wlName || !wlPhone} className="w-full">
                {busy ? t.wlCtaDone : t.wlCta}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ main, sub }: { main: string; sub: string }) {
  return (
    <div className="flex-1 rounded-xl border border-hair bg-surface px-2.5 py-2.5">
      <div className="font-display text-[14px] font-semibold text-accent">{main}</div>
      <div className="text-[9.5px] font-medium text-muted">{sub}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[12px] text-muted">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

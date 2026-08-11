"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { kd } from "@/lib/format";
import { cx } from "@/components/ui";
import { PaymentBadge } from "@/components/PaymentBadge";
import type {
  Tower, Office, Waitlist, LeaseRequest, Booking, FundmeApp, EventRow, Offer, PaymentStatus,
} from "@/lib/types";

type Props = {
  role: "staff" | "super";
  towers: Tower[]; offices: Office[]; waitlist: Waitlist[]; leases: LeaseRequest[];
  bookings: Booking[]; fundme: FundmeApp[]; events: EventRow[]; offers: Offer[];
};

export default function AdminScreen(props: Props) {
  const { t, lang } = useLang();
  const router = useRouter();
  const supabase = useSupabase();
  const isSuper = props.role === "super";

  const allTabs = ["overview", "offices", "waitlist", "fundme", "events", "offers"];
  const tabs = isSuper ? allTabs : ["offices", "waitlist"];
  const [tab, setTab] = useState(tabs[0]);
  const [edit, setEdit] = useState(false);

  // Live waitlist (cross-persona loop): new member signups appear here instantly.
  const [waitlist, setWaitlist] = useState<Waitlist[]>(props.waitlist);
  useEffect(() => {
    const channel = supabase
      .channel("admin-waitlist")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "waitlist" },
        (payload) => setWaitlist((w) => [payload.new as Waitlist, ...w]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="flex h-full flex-col">
      {/* Dark header */}
      <div className="flex flex-col gap-3 bg-ink px-5 pb-3.5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.22em] text-screen/55">
              MASARIK · {isSuper ? t.roleSuper : t.roleStaff}
            </div>
            <div className="mt-1 font-display text-[21px] font-semibold text-screen">{t.admTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            {isSuper && (
              <button
                onClick={() => setEdit((v) => !v)}
                className={cx(
                  "rounded-full border border-screen/35 px-3 py-2 text-[10.5px] font-semibold",
                  edit ? "bg-screen text-ink" : "text-screen",
                )}
              >
                {edit ? t.editDone : t.edit}
              </button>
            )}
            <button
              onClick={() => router.push("/home")}
              className="rounded-full border border-screen/35 px-3 py-2 text-[10.5px] font-semibold text-screen"
            >
              {t.exit}
            </button>
          </div>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {tabs.map((tb, i) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={cx(
                "flex-none rounded-full border border-screen/30 px-3 py-2 text-[11px] font-semibold",
                tab === tb ? "bg-screen text-ink" : "text-screen",
              )}
            >
              {t.admTabs[allTabs.indexOf(tb)]}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "overview" && (
          <Overview {...props} waitlistCount={waitlist.length} lang={lang} t={t} />
        )}
        {tab === "offices" && (
          <Offices towers={props.towers} offices={props.offices} edit={edit && isSuper} t={t} lang={lang} />
        )}
        {tab === "waitlist" && (
          <WaitlistTab waitlist={waitlist} leases={props.leases} bookings={props.bookings} t={t} />
        )}
        {tab === "fundme" && <Fundme apps={props.fundme} t={t} lang={lang} />}
        {tab === "events" && (
          <EventsAdmin events={props.events} edit={edit && isSuper} t={t} lang={lang} />
        )}
        {tab === "offers" && (
          <OffersAdmin offers={props.offers} edit={edit && isSuper} t={t} lang={lang} />
        )}
      </div>
    </div>
  );
}

/* ---------- Overview ---------- */
function Overview({
  towers, offices, fundme, bookings, waitlistCount, lang, t,
}: Props & { waitlistCount: number; lang: string; t: ReturnType<typeof useLang>["t"] }) {
  const revenue = offices.filter((o) => o.status === "rented").reduce((s, o) => s + Number(o.monthly_rent || 0), 0);
  const occupied = offices.filter((o) => o.status === "rented").length;
  const paidBookings = bookings.filter((b) => b.payment_status === "paid");
  const kpis = [
    { v: kd(revenue, lang as "en"), l: t.kMrr },
    { v: `${occupied}/${offices.length}`, l: t.kOcc },
    { v: String(waitlistCount), l: t.kWl },
    { v: String(fundme.length), l: t.kFm },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-2xl border border-hair bg-surface p-3.5">
            <div className="text-[20px] font-bold text-accent">{k.v}</div>
            <div className="text-[10px] text-muted">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-3.5">
        <div className="font-display text-[14px] font-semibold">{t.occByTower}</div>
        {towers.map((tw) => {
          const pct = tw.units_total ? (1 - tw.units_available / tw.units_total) * 100 : 0;
          return (
            <div key={tw.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11.5px] font-medium">
                <span>{lang === "ar" ? tw.name_ar : tw.name_en}</span>
                <span className="text-muted">
                  {tw.units_total - tw.units_available}/{tw.units_total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-tint">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-hair bg-surface p-3.5">
        <div className="font-display text-[14px] font-semibold">{t.recentActivity}</div>
        {paidBookings.slice(0, 5).map((b) => (
          <div key={b.id} className="flex items-baseline gap-2.5 text-[11.5px]">
            <span className="mt-1 h-[7px] w-[7px] flex-none rounded-full bg-accent" />
            <span className="flex-1">
              {kd(b.amount_kwd ?? 0, lang as "en")} · {b.label || b.kind}
            </span>
            <span className="text-[10px] text-muted">{new Date(b.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        {paidBookings.length === 0 && <div className="text-[11.5px] text-muted">{t.noRows}</div>}
      </div>
    </div>
  );
}

/* ---------- Offices ---------- */
function Offices({
  towers, offices, edit, t, lang,
}: {
  towers: Tower[]; offices: Office[]; edit: boolean;
  t: ReturnType<typeof useLang>["t"]; lang: string;
}) {
  const supabase = useSupabase();
  const [rows, setRows] = useState<Office[]>(offices);

  async function setRent(id: string, val: string) {
    setRows((r) => r.map((o) => (o.id === id ? { ...o, monthly_rent: val } : o)));
    await supabase.from("offices").update({ monthly_rent: Number(val) || 0 }).eq("id", id);
  }

  return (
    <div className="flex flex-col gap-3">
      {towers.map((tw) => {
        const units = rows.filter((o) => o.tower_id === tw.id);
        const rented = units.filter((o) => o.status === "rented").length;
        return (
          <div key={tw.id} className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-3.5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-[15px] font-semibold">
                {lang === "ar" ? tw.name_ar : tw.name_en}
              </span>
              <span className="text-[10.5px] font-semibold text-accent">
                {rented}/{units.length} {t.rented}
              </span>
            </div>
            {units.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 border-t border-hair pt-2.5">
                <span className="w-9 flex-none text-[11.5px] font-bold">{u.unit_no}</span>
                <span className="flex-1 text-[11px] text-muted">
                  {u.size_m2} m² · {u.tenant_name || "—"}
                </span>
                {edit ? (
                  <input
                    defaultValue={u.monthly_rent ?? ""}
                    onBlur={(e) => setRent(u.id, e.target.value)}
                    className="w-20 rounded-lg border border-hair px-2 py-1.5 text-[11px] font-semibold"
                  />
                ) : (
                  <span className="text-[11px] font-semibold">{kd(u.monthly_rent ?? 0, lang as "en")}</span>
                )}
                <span
                  className={cx(
                    "rounded-full px-2 py-1 text-[9.5px] font-semibold",
                    u.status === "rented" ? "bg-tint text-accent" : "bg-[#eaf3ec] text-success",
                  )}
                >
                  {u.status === "rented" ? t.rented : t.available}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Waitlist ---------- */
function WaitlistTab({
  waitlist, leases, bookings, t,
}: {
  waitlist: Waitlist[]; leases: LeaseRequest[]; bookings: Booking[];
  t: ReturnType<typeof useLang>["t"];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11.5px] leading-relaxed text-muted">{t.wlAdminSub}</p>
      {waitlist.length === 0 && <div className="text-[12px] text-muted">{t.noRows}</div>}
      {waitlist.map((w, i) => (
        <div key={w.id} className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-tint font-display text-[12px] font-semibold text-accent">
            {i + 1}
          </span>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{w.name}</div>
            <div className="text-[11px] text-muted">
              {w.phone} · {w.tower_id} · {new Date(w.created_at).toLocaleDateString()}
            </div>
          </div>
          <span className="rounded-full border border-accent px-3 py-1.5 text-[10.5px] font-semibold text-accent">
            {t.wlCall}
          </span>
        </div>
      ))}

      <div className="mt-2 font-display text-[14px] font-semibold">{t.bookReqTitle}</div>
      <p className="text-[11px] text-muted">{t.bookReqSub}</p>
      {leases.map((l) => (
        <div key={l.id} className="flex flex-col gap-1 rounded-2xl border border-hair bg-surface p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">
              {l.tower_id} · {l.unit_no}
            </span>
            <span className="rounded-full bg-[#eaf3ec] px-2 py-1 text-[9.5px] font-semibold text-success">
              {l.civil_id_attached ? "Civil ID ✓" : "No ID"}
            </span>
          </div>
          <div className="text-[11px] text-muted">
            {l.term_months} mo · {kd(l.monthly_rent ?? 0)}/mo · {new Date(l.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}

      <div className="mt-2 font-display text-[14px] font-semibold">Payments</div>
      {bookings.slice(0, 8).map((b) => (
        <div key={b.id} className="flex items-center gap-2.5 rounded-xl border border-hair bg-surface p-2.5">
          <span className="flex-1 text-[12px]">{b.label || b.kind}</span>
          <span className="text-[11px] font-semibold">{kd(b.amount_kwd ?? 0)}</span>
          <PaymentBadge status={b.payment_status as PaymentStatus} />
        </div>
      ))}
      {bookings.length === 0 && <div className="text-[12px] text-muted">{t.noRows}</div>}
    </div>
  );
}

/* ---------- Fund Me ---------- */
function Fundme({
  apps, t, lang,
}: {
  apps: FundmeApp[]; t: ReturnType<typeof useLang>["t"]; lang: string;
}) {
  const stagePct: Record<string, string> = {
    submitted: "20%", review: "45%", analysis: "70%", decision: "95%",
  };
  return (
    <div className="flex flex-col gap-2.5">
      {apps.length === 0 && <div className="text-[12px] text-muted">{t.noRows}</div>}
      {apps.map((f) => (
        <div key={f.id} className="flex flex-col gap-2 rounded-2xl border border-hair bg-surface p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13.5px] font-semibold">{f.business_name}</span>
            <span className="text-[12px] font-bold text-accent">{kd(f.amount_kwd ?? 0, lang as "en")}</span>
          </div>
          <div className="text-[11px] text-muted">{f.sector}</div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-tint">
              <div className="h-full bg-accent" style={{ width: stagePct[f.stage] }} />
            </div>
            <span className="text-[10px] font-semibold text-accent">{f.stage}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Events admin ---------- */
function EventsAdmin({
  events, edit, t, lang,
}: {
  events: EventRow[]; edit: boolean; t: ReturnType<typeof useLang>["t"]; lang: string;
}) {
  const supabase = useSupabase();
  const [rows, setRows] = useState<EventRow[]>(events);
  const [nt, setNt] = useState("");
  const [ns, setNs] = useState("");

  async function addEvent() {
    if (!nt) return;
    const { data } = await supabase
      .from("events")
      .insert({ day: "01", month_en: "SEP", month_ar: "سبتمبر", title_en: nt, title_ar: nt, sub_en: ns, sub_ar: ns, price_label_en: "FREE", price_label_ar: "مجانًا", image: "/assets/office-team.png", sort: rows.length + 1 })
      .select("*").single();
    if (data) { setRows([...rows, data as EventRow]); setNt(""); setNs(""); }
  }
  async function remove(id: string) {
    await supabase.from("events").delete().eq("id", id);
    setRows((r) => r.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {edit && (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-edit bg-[#fbf7f5] p-3">
          <input value={nt} onChange={(e) => setNt(e.target.value)} placeholder={t.services + " / title"} className="rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
          <input value={ns} onChange={(e) => setNs(e.target.value)} placeholder="Date · venue" className="rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
          <button onClick={addEvent} className="rounded-lg bg-accent py-2.5 text-[12px] font-semibold text-screen">
            + {t.events}
          </button>
        </div>
      )}
      {rows.map((e) => (
        <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3">
          <div className="flex-1">
            <div className="text-[12.5px] font-semibold">{lang === "ar" ? e.title_ar : e.title_en}</div>
            <div className="text-[10.5px] text-muted">{lang === "ar" ? e.sub_ar : e.sub_en}</div>
          </div>
          <span className="text-[12px] font-bold text-accent">
            {lang === "ar" ? e.price_label_ar : e.price_label_en}
          </span>
          {edit && (
            <button onClick={() => remove(e.id)} className="text-[10px] font-semibold text-edit">
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Offers admin ---------- */
function OffersAdmin({
  offers, edit, t, lang,
}: {
  offers: Offer[]; edit: boolean; t: ReturnType<typeof useLang>["t"]; lang: string;
}) {
  const supabase = useSupabase();
  const [rows, setRows] = useState<Offer[]>(offers);
  const [nn, setNn] = useState("");
  const [nd, setNd] = useState("");

  async function addOffer() {
    if (!nn) return;
    const { data } = await supabase
      .from("offers")
      .insert({ name_en: nn, name_ar: nn, cat_en: "Partner · Kuwait", cat_ar: "شريك · الكويت", perk_en: nd + " off", perk_ar: "خصم " + nd, discount: nd, image: "/assets/lounge.png", sort: rows.length + 1 })
      .select("*").single();
    if (data) { setRows([...rows, data as Offer]); setNn(""); setNd(""); }
  }
  async function remove(id: string) {
    await supabase.from("offers").delete().eq("id", id);
    setRows((r) => r.filter((o) => o.id !== id));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {edit && (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-edit bg-[#fbf7f5] p-3">
          <div className="flex gap-2">
            <input value={nn} onChange={(e) => setNn(e.target.value)} placeholder="Partner name" className="flex-1 rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
            <input value={nd} onChange={(e) => setNd(e.target.value)} placeholder="15%" className="w-16 rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
          </div>
          <button onClick={addOffer} className="rounded-lg bg-accent py-2.5 text-[12px] font-semibold text-screen">
            + {t.rowOffers}
          </button>
        </div>
      )}
      {rows.map((o) => (
        <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3">
          <div className="flex-1">
            <div className="text-[12.5px] font-semibold">{lang === "ar" ? o.name_ar : o.name_en}</div>
            <div className="text-[10.5px] text-muted">{lang === "ar" ? o.cat_ar : o.cat_en}</div>
          </div>
          <span className="font-display text-[13px] font-bold text-accent">{o.discount}</span>
          {edit && (
            <button onClick={() => remove(o.id)} className="text-[10px] font-semibold text-edit">
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

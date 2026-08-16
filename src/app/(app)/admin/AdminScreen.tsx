"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { kd } from "@/lib/format";
import { cx, Label, Btn, Diamond } from "@/components/ui";
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

  const allTabs = ["overview", "offices", "waitlist", "fundme", "events", "offers", "payments"];
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
        {tab === "payments" && <PaymentsAdmin lang={lang} />}
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

/* ---------- Offices (full property manager for super admins) ---------- */
const IMG_OPTIONS = [
  "/assets/office-luxury.png",
  "/assets/office-economic.png",
  "/assets/office-glass.png",
  "/assets/office-team.png",
  "/assets/lounge.png",
];

function Offices({
  towers, offices, edit, t, lang,
}: {
  towers: Tower[]; offices: Office[]; edit: boolean;
  t: ReturnType<typeof useLang>["t"]; lang: string;
}) {
  const supabase = useSupabase();
  const ar = lang === "ar";
  const [towerList, setTowerList] = useState<Tower[]>(towers);
  const [officeList, setOfficeList] = useState<Office[]>(offices);

  // Micro-labels for the management controls (staff-facing, kept bilingual-lite).
  const L = ar
    ? { addProp: "+ إضافة عقار", delProp: "حذف العقار", addOff: "+ إضافة مكتب", unit: "رقم", size: "م²", rent: "الإيجار", tenant: "المستأجر", nameEn: "الاسم (EN)", nameAr: "الاسم (AR)", price: "نطاق السعر", img: "الصورة", save: "إضافة", confirmProp: "حذف هذا العقار وكل مكاتبه؟", confirmOff: "حذف هذا المكتب؟", empty: "لا مكاتب بعد", available: t.available, rented: t.rented }
    : { addProp: "+ Add property", delProp: "Delete property", addOff: "+ Add office", unit: "Unit", size: "m²", rent: "Rent", tenant: "Tenant", nameEn: "Name (EN)", nameAr: "Name (AR)", price: "Price range", img: "Photo", save: "Add", confirmProp: "Delete this property and all its offices?", confirmOff: "Delete this office?", empty: "No offices yet", available: t.available, rented: t.rented };

  // ----- tower ops -----
  async function updateTower(id: string, patch: Partial<Tower>) {
    setTowerList((l) => l.map((tw) => (tw.id === id ? { ...tw, ...patch } : tw)));
    await supabase.from("towers").update(patch).eq("id", id);
  }
  async function addTower(draft: Partial<Tower>) {
    const id = crypto.randomUUID();
    const row = {
      id,
      name_en: draft.name_en || "New property",
      name_ar: draft.name_ar || draft.name_en || "عقار جديد",
      tier_en: "NEW", tier_ar: "جديد",
      sub_en: "", sub_ar: "",
      price_label_en: draft.price_label_en || "", price_label_ar: draft.price_label_ar || draft.price_label_en || "",
      image: draft.image || IMG_OPTIONS[0],
      units_total: 0, units_available: 0, sort: (towerList.at(-1)?.sort ?? 0) + 1,
    };
    const { data, error } = await supabase.from("towers").insert(row).select("*").single();
    if (!error && data) setTowerList((l) => [...l, data as Tower]);
  }
  async function deleteTower(id: string) {
    if (!confirm(L.confirmProp)) return;
    const { error } = await supabase.from("towers").delete().eq("id", id);
    if (!error) {
      setTowerList((l) => l.filter((tw) => tw.id !== id));
      setOfficeList((l) => l.filter((o) => o.tower_id !== id));
    }
  }

  // ----- office ops -----
  async function updateOffice(id: string, patch: Record<string, unknown>) {
    setOfficeList((l) => l.map((o) => (o.id === id ? ({ ...o, ...patch } as Office) : o)));
    await supabase.from("offices").update(patch).eq("id", id);
  }
  async function addOffice(towerId: string, draft: { unit_no: string; size_m2: string; monthly_rent: string; status: string }) {
    if (!draft.unit_no) return;
    const row = {
      id: crypto.randomUUID(),
      tower_id: towerId,
      unit_no: draft.unit_no,
      size_m2: Number(draft.size_m2) || null,
      monthly_rent: Number(draft.monthly_rent) || null,
      status: draft.status === "rented" ? "rented" : "available",
      sort: officeList.filter((o) => o.tower_id === towerId).length + 1,
    };
    const { data, error } = await supabase.from("offices").insert(row).select("*").single();
    if (!error && data) setOfficeList((l) => [...l, data as Office]);
  }
  async function deleteOffice(id: string) {
    if (!confirm(L.confirmOff)) return;
    const { error } = await supabase.from("offices").delete().eq("id", id);
    if (!error) setOfficeList((l) => l.filter((o) => o.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {edit && <AddPropertyForm labels={L} onAdd={addTower} />}

      {towerList.map((tw) => {
        const units = officeList.filter((o) => o.tower_id === tw.id);
        const rented = units.filter((o) => o.status === "rented").length;
        return (
          <div key={tw.id} className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-3.5">
            {/* header */}
            <div className="flex items-start justify-between gap-2">
              {edit ? (
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    defaultValue={tw.name_en ?? ""}
                    onBlur={(e) => updateTower(tw.id, { name_en: e.target.value })}
                    className="rounded-lg border border-hair px-2 py-1.5 font-display text-[14px] font-semibold"
                  />
                  <div className="flex gap-1.5">
                    <input
                      defaultValue={tw.name_ar ?? ""}
                      onBlur={(e) => updateTower(tw.id, { name_ar: e.target.value })}
                      className="flex-1 rounded-lg border border-hair px-2 py-1.5 text-[12px]"
                      dir="rtl"
                    />
                    <select
                      defaultValue={tw.image ?? IMG_OPTIONS[0]}
                      onChange={(e) => updateTower(tw.id, { image: e.target.value })}
                      className="w-24 rounded-lg border border-hair px-1 py-1.5 text-[10px]"
                    >
                      {IMG_OPTIONS.map((src) => (
                        <option key={src} value={src}>
                          {src.split("/").pop()?.replace(".png", "")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      defaultValue={tw.price_label_en ?? ""}
                      onBlur={(e) => updateTower(tw.id, { price_label_en: e.target.value })}
                      placeholder={`${L.price} (EN)`}
                      className="flex-1 rounded-lg border border-hair px-2 py-1.5 text-[11px]"
                    />
                    <input
                      defaultValue={tw.price_label_ar ?? ""}
                      onBlur={(e) => updateTower(tw.id, { price_label_ar: e.target.value })}
                      placeholder={`${L.price} (AR)`}
                      className="flex-1 rounded-lg border border-hair px-2 py-1.5 text-[11px]"
                      dir="rtl"
                    />
                  </div>
                </div>
              ) : (
                <span className="font-display text-[15px] font-semibold">{ar ? tw.name_ar : tw.name_en}</span>
              )}
              <div className="flex flex-none flex-col items-end gap-1.5">
                <span className="text-[10.5px] font-semibold text-accent">
                  {rented}/{units.length} {L.rented}
                </span>
                {edit && (
                  <button
                    onClick={() => deleteTower(tw.id)}
                    className="rounded-full border border-edit px-2 py-1 text-[9.5px] font-semibold text-edit"
                  >
                    {L.delProp}
                  </button>
                )}
              </div>
            </div>

            {/* offices */}
            {units.length === 0 && edit && <div className="text-[11px] text-muted">{L.empty}</div>}
            {units.map((u) =>
              edit ? (
                <div key={u.id} className="flex items-center gap-1.5 border-t border-hair pt-2.5">
                  <input
                    defaultValue={u.unit_no}
                    onBlur={(e) => updateOffice(u.id, { unit_no: e.target.value })}
                    className="w-12 rounded-lg border border-hair px-1.5 py-1.5 text-[11px] font-bold"
                  />
                  <input
                    defaultValue={u.size_m2 ?? ""}
                    onBlur={(e) => updateOffice(u.id, { size_m2: Number(e.target.value) || null })}
                    placeholder={L.size}
                    className="w-12 rounded-lg border border-hair px-1.5 py-1.5 text-[11px]"
                  />
                  <input
                    defaultValue={u.monthly_rent ?? ""}
                    onBlur={(e) => updateOffice(u.id, { monthly_rent: Number(e.target.value) || null })}
                    placeholder={L.rent}
                    className="w-16 rounded-lg border border-hair px-1.5 py-1.5 text-[11px] font-semibold"
                  />
                  <input
                    defaultValue={u.tenant_name ?? ""}
                    onBlur={(e) => updateOffice(u.id, { tenant_name: e.target.value || null })}
                    placeholder={L.tenant}
                    className="min-w-0 flex-1 rounded-lg border border-hair px-1.5 py-1.5 text-[11px]"
                  />
                  <button
                    onClick={() =>
                      updateOffice(u.id, { status: u.status === "rented" ? "available" : "rented" })
                    }
                    className={cx(
                      "rounded-full px-2 py-1 text-[9.5px] font-semibold",
                      u.status === "rented" ? "bg-tint text-accent" : "bg-[#eaf3ec] text-success",
                    )}
                  >
                    {u.status === "rented" ? L.rented : L.available}
                  </button>
                  <button onClick={() => deleteOffice(u.id)} className="text-[11px] font-semibold text-edit">
                    ✕
                  </button>
                </div>
              ) : (
                <div key={u.id} className="flex items-center gap-2.5 border-t border-hair pt-2.5">
                  <span className="w-9 flex-none text-[11.5px] font-bold">{u.unit_no}</span>
                  <span className="flex-1 text-[11px] text-muted">
                    {u.size_m2} m² · {u.tenant_name || "—"}
                  </span>
                  <span className="text-[11px] font-semibold">{kd(u.monthly_rent ?? 0, lang as "en")}</span>
                  <span
                    className={cx(
                      "rounded-full px-2 py-1 text-[9.5px] font-semibold",
                      u.status === "rented" ? "bg-tint text-accent" : "bg-[#eaf3ec] text-success",
                    )}
                  >
                    {u.status === "rented" ? L.rented : L.available}
                  </span>
                </div>
              ),
            )}

            {edit && <AddOfficeForm labels={L} onAdd={(d) => addOffice(tw.id, d)} />}
          </div>
        );
      })}
    </div>
  );
}

function AddPropertyForm({
  labels: L,
  onAdd,
}: {
  labels: Record<string, string>;
  onAdd: (draft: Partial<Tower>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [priceEn, setPriceEn] = useState("");
  const [image, setImage] = useState(IMG_OPTIONS[2]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-dashed border-edit bg-[#fbf7f5] py-3 text-[12px] font-semibold text-accent"
      >
        {L.addProp}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-edit bg-[#fbf7f5] p-3">
      <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={L.nameEn} className="rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
      <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={L.nameAr} dir="rtl" className="rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
      <div className="flex gap-2">
        <input value={priceEn} onChange={(e) => setPriceEn(e.target.value)} placeholder={L.price} className="flex-1 rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
        <select value={image} onChange={(e) => setImage(e.target.value)} className="w-28 rounded-lg border border-hair px-1 py-2 text-[11px]">
          {IMG_OPTIONS.map((src) => (
            <option key={src} value={src}>{src.split("/").pop()?.replace(".png", "")}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            onAdd({ name_en: nameEn, name_ar: nameAr, price_label_en: priceEn, price_label_ar: priceEn, image });
            setNameEn(""); setNameAr(""); setPriceEn(""); setOpen(false);
          }}
          className="flex-1 rounded-lg bg-accent py-2.5 text-[12px] font-semibold text-screen"
        >
          {L.save}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-hair px-3 py-2.5 text-[12px] font-semibold text-muted">
          ✕
        </button>
      </div>
    </div>
  );
}

function AddOfficeForm({
  labels: L,
  onAdd,
}: {
  labels: Record<string, string>;
  onAdd: (d: { unit_no: string; size_m2: string; monthly_rent: string; status: string }) => void;
}) {
  const [unit, setUnit] = useState("");
  const [size, setSize] = useState("");
  const [rent, setRent] = useState("");
  return (
    <div className="flex items-center gap-1.5 border-t border-dashed border-edit pt-2.5">
      <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={L.unit} className="w-14 rounded-lg border border-hair px-1.5 py-1.5 text-[11px]" />
      <input value={size} onChange={(e) => setSize(e.target.value)} placeholder={L.size} className="w-12 rounded-lg border border-hair px-1.5 py-1.5 text-[11px]" />
      <input value={rent} onChange={(e) => setRent(e.target.value)} placeholder={L.rent} className="w-16 rounded-lg border border-hair px-1.5 py-1.5 text-[11px]" />
      <button
        onClick={() => { onAdd({ unit_no: unit, size_m2: size, monthly_rent: rent, status: "available" }); setUnit(""); setSize(""); setRent(""); }}
        className="flex-1 rounded-lg bg-accent py-1.5 text-[11px] font-semibold text-screen"
      >
        {L.addOff}
      </button>
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

/* ---------- Payments (super admin: connect the gateway) ---------- */
type PayStatus = {
  connected: boolean;
  mode: string;
  provider: string;
  base_url?: string;
  last4: string | null;
  webhook_secret_set?: boolean;
  updated_at?: string | null;
};

function PaymentsAdmin({ lang }: { lang: string }) {
  const supabase = useSupabase();
  const ar = lang === "ar";
  const L = ar
    ? {
        title: "بوابة الدفع", sub: "اربط حساب ماي فاتورة. المفتاح يُحفظ على الخادم فقط ولا يظهر في المتصفح أبدًا.",
        connected: "متصل", notConnected: "غير متصل — يُستخدم مفتاح الاختبار التجريبي",
        key: "مفتاح API", keyPh: "الصق مفتاح ماي فاتورة", mode: "الوضع",
        sandbox: "اختبار", production: "إنتاج", secret: "سر الويبهوك (اختياري)",
        save: "تحقق واحفظ", saving: "جارٍ التحقق…", saved: "تم الحفظ ✓",
        webhookTitle: "رابط الويبهوك", webhookNote: "سجّل هذا الرابط في لوحة ماي فاتورة (الإشعارات/الويبهوك).",
        note: "المفتاح مخزّن في جدول مقفل لا يقرؤه أي متصفح — فقط دوال الخادم.",
      }
    : {
        title: "Payment gateway", sub: "Connect your MyFatoorah account. The key is stored server‑side only and never shown in the browser.",
        connected: "Connected", notConnected: "Not connected — using the sandbox test key",
        key: "API key", keyPh: "Paste your MyFatoorah key", mode: "Mode",
        sandbox: "Sandbox", production: "Production", secret: "Webhook secret (optional)",
        save: "Test & Save", saving: "Validating…", saved: "Saved ✓",
        webhookTitle: "Webhook URL", webhookNote: "Register this URL in the MyFatoorah dashboard (Notifications / Webhook).",
        note: "The key lives in a locked table no browser can read — only the server functions.",
      };

  const [status, setStatus] = useState<PayStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState<"sandbox" | "production">("sandbox");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("payment-config", { body: { action: "status" } });
      if (data) {
        setStatus(data as PayStatus);
        if (data.mode) setMode(data.mode);
      }
    })();
  }, [supabase]);

  async function save() {
    setBusy(true); setErr(null); setMsg(null);
    const { data, error } = await supabase.functions.invoke("payment-config", {
      body: { action: "save", api_key: apiKey, mode, webhook_secret: secret },
    });
    setBusy(false);
    if (error) {
      let m = error.message;
      try { const j = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.(); if (j?.error) m = j.error; } catch { /* ignore */ }
      setErr(m); return;
    }
    if (data?.error) { setErr(data.error); return; }
    setStatus((s) => ({ ...(s as PayStatus), connected: true, mode: data.mode, last4: data.last4, webhook_secret_set: data.webhook_secret_set }));
    setApiKey(""); setSecret(""); setMsg(L.saved);
  }

  const webhookUrl =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payment-webhook` +
    (status?.webhook_secret_set ? "?secret=<your-secret>" : "");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="font-display text-[18px] font-semibold">{L.title}</div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{L.sub}</p>
      </div>

      {/* status */}
      <div className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3.5">
        <span className={cx("h-2.5 w-2.5 flex-none rounded-full", status?.connected ? "bg-success" : "bg-muted/40")} />
        <div className="flex-1 text-[12.5px]">
          {status?.connected ? (
            <span><b>{L.connected}</b> · MyFatoorah · ····{status.last4} · <span className="uppercase">{status.mode}</span></span>
          ) : (
            <span className="text-muted">{L.notConnected}</span>
          )}
        </div>
      </div>

      {/* form */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-3.5">
        <label className="block">
          <Label>{L.key}</Label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={L.keyPh}
            className="mt-1 w-full rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
        </label>
        <div>
          <Label>{L.mode}</Label>
          <div className="mt-1 flex gap-1.5">
            {(["sandbox", "production"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={cx("rounded-full border px-3 py-1.5 text-[11px] font-semibold",
                  mode === m ? "border-accent bg-accent text-screen" : "border-hair text-muted")}>
                {m === "sandbox" ? L.sandbox : L.production}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <Label>{L.secret}</Label>
          <input value={secret} onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded-lg border border-hair px-2.5 py-2 text-[12px]" />
        </label>
        {err && <div className="text-[11.5px] text-accent">{err}</div>}
        {msg && <div className="text-[11.5px] text-success">{msg}</div>}
        <Btn onClick={save} disabled={busy || !apiKey} className="w-full">
          {busy ? L.saving : L.save}
        </Btn>
      </div>

      {/* webhook */}
      <div className="rounded-2xl border border-hair bg-surface p-3.5">
        <Label>{L.webhookTitle}</Label>
        <div className="mt-1.5 break-all rounded-lg bg-tint px-2.5 py-2 font-mono text-[10.5px] text-accent">{webhookUrl}</div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">{L.webhookNote}</p>
      </div>

      <p className="flex items-center gap-1.5 text-[10.5px] leading-relaxed text-muted"><Diamond size={6} /> {L.note}</p>
    </div>
  );
}

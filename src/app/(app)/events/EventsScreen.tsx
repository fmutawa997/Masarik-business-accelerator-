"use client";

import { useState } from "react";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { usePay } from "@/lib/pay";
import { cx } from "@/components/ui";
import type { EventRow } from "@/lib/types";

type Ev = EventRow & { service_code: string | null };

export default function EventsScreen({
  events,
  rsvpIds,
}: {
  events: Ev[];
  rsvpIds: string[];
  userId: string;
}) {
  const { t, lang } = useLang();
  const supabase = useSupabase();
  const { start, busy } = usePay();
  const [rsvps, setRsvps] = useState<string[]>(rsvpIds);

  const featured = events[events.length - 1] ?? events[0];

  async function toggleRsvp(ev: Ev) {
    if (rsvps.includes(ev.id)) {
      await supabase.from("event_rsvps").delete().eq("event_id", ev.id);
      setRsvps((r) => r.filter((x) => x !== ev.id));
    } else {
      const { error } = await supabase.from("event_rsvps").insert({ event_id: ev.id });
      if (!error) setRsvps((r) => [...r, ev.id]);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="font-display text-[25px] font-semibold">{t.events}</div>

      {/* Featured */}
      {featured && (
        <div className="relative h-[150px] overflow-hidden rounded-2xl">
          <Image src={featured.image} alt={featured.title_en} fill className="object-cover" />
          <div className="scrim pointer-events-none absolute inset-0" />
          <div className="absolute inset-x-3.5 bottom-3 flex items-end justify-between">
            <div>
              <div className="font-display text-[16px] font-semibold text-screen">
                {lang === "ar" ? featured.title_ar : featured.title_en}
              </div>
              <div className="text-[10.5px] text-screen/80">
                {lang === "ar" ? featured.sub_ar : featured.sub_en}
              </div>
            </div>
            <button
              onClick={() => toggleRsvp(featured)}
              className={cx(
                "rounded-full px-3 py-2 text-[10.5px] font-semibold",
                rsvps.includes(featured.id) ? "bg-success text-white" : "bg-screen text-accent",
              )}
            >
              {rsvps.includes(featured.id) ? t.going : t.rsvp}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {events.map((ev) => {
        const paid = ev.price_kwd != null && ev.service_code;
        const isGoing = rsvps.includes(ev.id);
        return (
          <div key={ev.id} className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3">
            <div className="relative h-12 w-12 flex-none overflow-hidden rounded-xl">
              <Image src={ev.image} alt="" fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-accent-dark/80 text-center text-[8px] font-semibold text-screen">
                {ev.day} {lang === "ar" ? ev.month_ar : ev.month_en}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-display text-[13.5px] font-semibold">
                {lang === "ar" ? ev.title_ar : ev.title_en}
              </div>
              <div className="text-[10.5px] text-muted">{lang === "ar" ? ev.sub_ar : ev.sub_en}</div>
            </div>
            {paid ? (
              <button
                onClick={() =>
                  start({ kind: "event", service_code: ev.service_code!, label: ev.title_en })
                }
                disabled={busy}
                className="rounded-full border border-accent px-3 py-2 text-[10.5px] font-semibold text-accent disabled:opacity-50"
              >
                {lang === "ar" ? ev.price_label_ar : ev.price_label_en}
              </button>
            ) : (
              <button
                onClick={() => toggleRsvp(ev)}
                className={cx(
                  "rounded-full border border-accent px-3 py-2 text-[10.5px] font-semibold",
                  isGoing ? "bg-success text-white" : "text-accent",
                )}
              >
                {isGoing ? t.going : t.free}
              </button>
            )}
          </div>
        );
      })}
      <p className="text-center text-[10.5px] text-muted">{t.ticketNote}</p>
    </div>
  );
}

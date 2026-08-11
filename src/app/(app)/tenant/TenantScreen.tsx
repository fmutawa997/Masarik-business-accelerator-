"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { usePay } from "@/lib/pay";
import { kd } from "@/lib/format";
import { Btn, Label } from "@/components/ui";
import { PaymentBadge } from "@/components/PaymentBadge";
import type { Booking, LeaseRequest, PaymentStatus } from "@/lib/types";

const RENT_CODE = "rent-kh1204";
const RENT_AMOUNT = 340;

export default function TenantScreen({
  lease,
  rentBookings,
}: {
  lease: LeaseRequest | null;
  rentBookings: Booking[];
}) {
  const { t, lang } = useLang();
  const supabase = useSupabase();
  const { start, busy } = usePay();

  const paidRent = rentBookings.find((b) => b.payment_status === "paid");
  const [latest, setLatest] = useState<Booking | null>(rentBookings[0] ?? null);

  // Live payment status — the webhook flips the row and this updates with no refresh.
  useEffect(() => {
    const channel = supabase
      .channel("tenant-rent")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          const b = payload.new as Booking;
          if (b?.kind === "rent") setLatest(b);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const rentStatus: PaymentStatus | null =
    paidRent?.payment_status ?? latest?.payment_status ?? null;
  const isPaid = rentStatus === "paid";

  const unit = lease?.unit_no || "1204";
  const rent = lease?.monthly_rent ? Number(lease.monthly_rent) : RENT_AMOUNT;

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-[25px] font-semibold">{t.myOffice}</div>
        <span className="rounded-full bg-accent-dark px-2.5 py-1.5 text-[9px] font-semibold tracking-wider text-screen">
          {t.tenantBadge}
        </span>
      </div>

      {/* Office card */}
      <div className="overflow-hidden rounded-2xl border border-hair bg-surface">
        <div className="relative h-[88px]">
          <Image src="/assets/office-economic.png" alt="office" fill className="object-cover" />
          <div className="scrim pointer-events-none absolute inset-0" />
          <div className="absolute inset-x-3.5 bottom-2 font-display text-[15px] font-semibold text-screen">
            {lang === "ar" ? `مكتب ${unit} · برج الخليجية` : `Office ${unit} · Khaleejia Tower`}
          </div>
        </div>
        <div className="flex gap-2 p-3.5">
          <Cell label={t.size} value={`${lease?.office_id ? 14 : 14} m²`} />
          <Cell label={t.rent} value={kd(rent, lang)} />
          <Cell label={t.leaseEnds} value="28.02.2027" />
        </div>
      </div>

      {!lease && (
        <p className="rounded-2xl border border-dashed border-hair bg-surface px-4 py-3 text-[11.5px] leading-relaxed text-muted">
          {t.noTenancySub}
        </p>
      )}

      {/* Rent due / paid */}
      {isPaid ? (
        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-success bg-surface p-3.5">
          <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-success text-[12px] font-bold text-white">
            ✓
          </span>
          <div className="text-[13px] font-semibold">{t.rentPaidMsg}</div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-accent bg-surface p-3.5">
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{t.rentDue}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
              {kd(RENT_AMOUNT, lang)}
              {rentStatus && <PaymentBadge status={rentStatus} />}
            </div>
          </div>
          <Btn
            onClick={() => start({ kind: "rent", service_code: RENT_CODE, label: "August rent" })}
            disabled={busy}
            className="rounded-full"
          >
            {busy ? t.payProcessing : t.payNow}
          </Btn>
        </div>
      )}

      {/* Invoices */}
      <div className="flex flex-col gap-2">
        <Label>{t.invoices}</Label>
        {["July 2026 rent", "June 2026 rent"].map((title, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-hair bg-surface p-3">
            <div className="flex-1">
              <div className="text-[12.5px] font-semibold">
                {lang === "ar" ? (i === 0 ? "إيجار يوليو 2026" : "إيجار يونيو 2026") : title}
              </div>
              <div className="text-[10.5px] text-muted">
                {lang === "ar" ? "دُفع · كي-نت" : "Paid · KNET"}
              </div>
            </div>
            <span className="text-[10.5px] font-semibold text-success">{t.paid}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1 rounded-2xl border border-hair bg-surface p-3 text-center text-[12px] font-semibold text-accent">
          {t.maintenance}
        </div>
        <div className="flex-1 rounded-2xl border border-hair bg-surface p-3 text-center text-[12px] font-semibold text-accent">
          {t.meetingRoom}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <Label>{label}</Label>
      <div className="mt-0.5 text-[12.5px] font-semibold">{value}</div>
    </div>
  );
}

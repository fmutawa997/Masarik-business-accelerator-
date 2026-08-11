"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { Frame } from "@/components/Frame";
import { Btn } from "@/components/ui";
import { PaymentBadge } from "@/components/PaymentBadge";
import type { PaymentStatus } from "@/lib/types";

function Return() {
  const { t } = useLang();
  const supabase = useSupabase();
  const params = useSearchParams();
  const ref = params.get("ref");

  const [status, setStatus] = useState<PaymentStatus>("awaiting_payment");
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async () => {
    if (!ref) return;
    // IMPORTANT: we send only the booking ref — never a status. The webhook
    // re-queries the gateway (GetPaymentStatus) and is the sole writer of payment_status.
    // Pasting ?status=success into the URL therefore does nothing.
    try {
      await supabase.functions.invoke("payment-webhook", { body: { ref } });
    } catch {
      /* the scheduled webhook may already have handled it */
    }
  }, [ref, supabase]);

  useEffect(() => {
    if (!ref) {
      setChecking(false);
      return;
    }
    let tries = 0;
    let active = true;

    async function poll() {
      const { data } = await supabase
        .from("bookings")
        .select("payment_status")
        .eq("id", ref)
        .single();
      if (!active) return;
      if (data?.payment_status) setStatus(data.payment_status as PaymentStatus);
      const terminal = ["paid", "failed", "expired", "refunded"];
      if (data && terminal.includes(data.payment_status)) {
        setChecking(false);
        return;
      }
      if (++tries < 8) setTimeout(poll, 1500);
      else setChecking(false);
    }

    verify().then(poll);

    // Live update if the webhook flips the row while we're on this page.
    const channel = supabase
      .channel("pay-return-" + ref)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${ref}` },
        (payload) => {
          const s = (payload.new as { payment_status: PaymentStatus }).payment_status;
          setStatus(s);
          if (["paid", "failed", "expired", "refunded"].includes(s)) setChecking(false);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [ref, supabase, verify]);

  const paid = status === "paid";

  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            paid ? "bg-success text-white" : "bg-tint text-accent"
          }`}
        >
          {paid ? "✓" : checking ? "…" : "•"}
        </div>
        <div className="font-display text-[22px] font-semibold">
          {paid ? t.rentPaidMsg.split("—")[0] : checking ? t.payReturnChecking : t.payThanks}
        </div>
        <PaymentBadge status={status} />
        <p className="text-[12px] leading-relaxed text-muted">{t.payReturnNote}</p>
        <div className="mt-2 flex gap-2">
          <Btn href="/tenant" variant="outline">
            {t.rowPortal}
          </Btn>
          <Btn href="/home">{t.backToApp}</Btn>
        </div>
      </div>
    </Frame>
  );
}

export default function PayReturnPage() {
  return (
    <Suspense fallback={null}>
      <Return />
    </Suspense>
  );
}

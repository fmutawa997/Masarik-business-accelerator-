"use client";

import { useState } from "react";
import { useSupabase } from "./supabase/useSupabase";

type PayArgs = {
  kind: "rent" | "package" | "event" | "consult";
  service_code?: string;
  office_id?: string;
  label?: string;
};

// Creates a booking (payment_status defaults to 'pending' — the client can't set it),
// then asks the initiate-payment edge function for a hosted checkout URL and redirects.
// The frontend never sends an amount; the edge function computes it from the DB.
export function usePay() {
  const supabase = useSupabase();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(args: PayArgs) {
    if (busy) return; // double-tap guard #1: ignore re-entry while a charge is in flight
    setBusy(true);
    setError(null);
    try {
      const { data: booking, error: insErr } = await supabase
        .from("bookings")
        .insert({
          kind: args.kind,
          service_code: args.service_code ?? null,
          office_id: args.office_id ?? null,
          label: args.label ?? null,
        })
        .select("id")
        .single();
      if (insErr || !booking) throw new Error(insErr?.message ?? "Could not create booking");

      const { data, error: fnErr } = await supabase.functions.invoke("initiate-payment", {
        body: { booking_id: booking.id, origin: window.location.origin },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (!data?.url) throw new Error(data?.error ?? "No payment URL returned");

      // Redirect the browser to MyFatoorah's hosted page. (Button stays disabled
      // through the navigation — double-tap guard #2.)
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment error");
      setBusy(false);
    }
  }

  return { start, busy, error };
}

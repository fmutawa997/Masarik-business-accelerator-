// expire-bookings — BAD WEATHER: abandoned checkout.
//
// Runs on a schedule (pg_cron / Supabase scheduled function). Finds bookings stuck
// in awaiting_payment for over an hour with no webhook, and closes them out.
// Before expiring, it re-verifies with the gateway so a genuinely-paid booking whose
// webhook was missed gets marked paid instead of wrongly expired.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MF_BASE = Deno.env.get("MYFATOORAH_BASE_URL") ?? "https://apitest.myfatoorah.com";
const MF_KEY = Deno.env.get("MYFATOORAH_API_KEY") ??
  "SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

async function gatewayStatus(invoiceId: string): Promise<string> {
  try {
    const res = await fetch(`${MF_BASE}/v2/GetPaymentStatus`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MF_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
    });
    const data = await res.json();
    const inv = String(data?.Data?.InvoiceStatus ?? "").toLowerCase();
    if (inv === "paid") return "paid";
    if (inv === "failed") return "failed";
    return "pending";
  } catch {
    return "pending";
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (CRON_SECRET && url.searchParams.get("secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "bad secret" }), { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
  const { data: stale } = await admin
    .from("bookings").select("*")
    .eq("payment_status", "awaiting_payment")
    .lt("created_at", cutoff);

  let expired = 0, paid = 0, failed = 0;
  for (const b of stale ?? []) {
    let next = "expired";
    if (b.provider_invoice_id) {
      const s = await gatewayStatus(b.provider_invoice_id);
      if (s === "paid") next = "paid";
      else if (s === "failed") next = "failed";
    }
    const patch: Record<string, unknown> = { payment_status: next };
    if (next === "paid") patch.paid_at = new Date().toISOString();
    await admin.from("bookings").update(patch).eq("id", b.id);
    await admin.from("payment_events").insert({
      booking_id: b.id, old_status: "awaiting_payment", new_status: next, source: "cron",
    });
    if (next === "expired") expired++; else if (next === "paid") paid++; else failed++;
  }

  return new Response(JSON.stringify({ ok: true, scanned: stale?.length ?? 0, expired, paid, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});

// expire-bookings — BAD WEATHER: abandoned checkout.
//
// Scheduled hourly. Closes bookings stuck in awaiting_payment for > 1h, re-verifying
// with the gateway first so a genuinely-paid-but-missed-webhook booking becomes paid.
// Gateway credentials come from the locked payment_config table (env / sandbox fallback).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SANDBOX_KEY = "SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

async function loadCfg(admin: ReturnType<typeof createClient>) {
  const { data } = await admin.from("payment_config").select("api_key,base_url").eq("id", "default").single();
  return {
    key: data?.api_key || Deno.env.get("MYFATOORAH_API_KEY") || SANDBOX_KEY,
    base: data?.base_url || Deno.env.get("MYFATOORAH_BASE_URL") || "https://apitest.myfatoorah.com",
  };
}

async function gatewayStatus(base: string, key: string, invoiceId: string): Promise<string> {
  try {
    const res = await fetch(`${base}/v2/GetPaymentStatus`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
    });
    const data = await res.json();
    const inv = String(data?.Data?.InvoiceStatus ?? "").toLowerCase();
    if (inv === "paid") return "paid";
    if (inv === "failed") return "failed";
    return "pending";
  } catch { return "pending"; }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (CRON_SECRET && url.searchParams.get("secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "bad secret" }), { status: 401 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cfg = await loadCfg(admin);

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: stale } = await admin
    .from("bookings").select("*").eq("payment_status", "awaiting_payment").lt("created_at", cutoff);

  let expired = 0, paid = 0, failed = 0;
  for (const b of stale ?? []) {
    let next = "expired";
    if (b.provider_invoice_id) {
      const s = await gatewayStatus(cfg.base, cfg.key, b.provider_invoice_id);
      if (s === "paid") next = "paid"; else if (s === "failed") next = "failed";
    }
    const patch: Record<string, unknown> = { payment_status: next };
    if (next === "paid") patch.paid_at = new Date().toISOString();
    await admin.from("bookings").update(patch).eq("id", b.id).eq("payment_status", "awaiting_payment");
    await admin.from("payment_events").insert({
      booking_id: b.id, old_status: "awaiting_payment", new_status: next, source: "cron",
    });
    if (next === "expired") expired++; else if (next === "paid") paid++; else failed++;
  }
  return new Response(JSON.stringify({ ok: true, scanned: stale?.length ?? 0, expired, paid, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});

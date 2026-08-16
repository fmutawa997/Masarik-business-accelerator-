// payment-webhook — the SOURCE OF TRUTH.
//
// The ONLY place payment_status flips. Never trusts a status in the URL/body; it
// re-queries MyFatoorah GetPaymentStatus and acts on the gateway's answer. Idempotent.
// Gateway credentials come from the locked payment_config table (env / sandbox fallback).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SANDBOX_KEY = "SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, myfatoorah-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function loadCfg(admin: ReturnType<typeof createClient>) {
  const { data } = await admin.from("payment_config").select("api_key,base_url,webhook_secret").eq("id", "default").single();
  return {
    key: data?.api_key || Deno.env.get("MYFATOORAH_API_KEY") || SANDBOX_KEY,
    base: data?.base_url || Deno.env.get("MYFATOORAH_BASE_URL") || "https://apitest.myfatoorah.com",
    webhookSecret: data?.webhook_secret || Deno.env.get("MYFATOORAH_WEBHOOK_SECRET") || "",
  };
}

async function gatewayStatus(base: string, key: string, invoiceId: string) {
  const res = await fetch(`${base}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
  });
  const data = await res.json();
  const inv = String(data?.Data?.InvoiceStatus ?? "").toLowerCase();
  let status = "pending";
  if (inv === "paid") status = "paid";
  else if (inv === "failed") status = "failed";
  else if (inv === "expired") status = "expired";
  return { status, raw: data?.Data ?? data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cfg = await loadCfg(admin);

  const url = new URL(req.url);
  if (cfg.webhookSecret && url.searchParams.get("secret") !== cfg.webhookSecret) {
    return json({ error: "bad secret" }, 401);
  }

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* may be empty */ }

  const ref = String(body.ref ?? url.searchParams.get("ref") ?? "");
  let invoiceId = String(body?.Data?.InvoiceId ?? body?.InvoiceId ?? body?.invoiceId ?? url.searchParams.get("invoiceId") ?? "");

  let booking;
  if (ref) {
    const { data } = await admin.from("bookings").select("*").eq("id", ref).single();
    booking = data;
    if (booking && !invoiceId) invoiceId = booking.provider_invoice_id ?? "";
  } else if (invoiceId) {
    const { data } = await admin.from("bookings").select("*").eq("provider_invoice_id", invoiceId).single();
    booking = data;
  }
  if (!booking) return json({ error: "booking not found" }, 404);
  if (!invoiceId) return json({ error: "no invoice id" }, 400);

  if (booking.payment_status === "paid" || booking.payment_status === "refunded") {
    return json({ ok: true, duplicate: true, payment_status: booking.payment_status });
  }

  const { status, raw } = await gatewayStatus(cfg.base, cfg.key, invoiceId);
  if (status === "pending") return json({ ok: true, payment_status: booking.payment_status, note: "still pending" });

  const patch: Record<string, unknown> = { payment_status: status };
  if (status === "paid") patch.paid_at = new Date().toISOString();

  // Atomic idempotency: only the first webhook transitions out of awaiting_payment.
  const { data: updated } = await admin
    .from("bookings").update(patch).eq("id", booking.id).eq("payment_status", "awaiting_payment").select("id");
  if (!updated || updated.length === 0) return json({ ok: true, duplicate: true, note: "already processed" });

  await admin.from("payment_events").insert({
    booking_id: booking.id, old_status: "awaiting_payment", new_status: status,
    source: "webhook", detail: { invoiceId, gateway: raw },
  });

  return json({ ok: true, payment_status: status });
});

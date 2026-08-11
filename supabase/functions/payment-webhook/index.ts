// payment-webhook — the SOURCE OF TRUTH.
//
// This is the ONLY place a booking's payment_status flips to paid/failed/expired.
// It never trusts a status carried in a URL or POST body. Instead it re-queries
// MyFatoorah's GetPaymentStatus server-to-server and acts on the gateway's answer.
//
// Triggered by (a) MyFatoorah's server webhook, or (b) the /pay/return page as a
// verify-on-return fallback. Either way it passes only an identifier — never a status.
//
// verify_jwt is DISABLED (gateways don't send a Supabase JWT). It authenticates by
// re-verifying with the gateway; optionally also checks a shared secret / HMAC.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MF_BASE = Deno.env.get("MYFATOORAH_BASE_URL") ?? "https://apitest.myfatoorah.com";
const MF_KEY = Deno.env.get("MYFATOORAH_API_KEY") ??
  "SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx";
const WEBHOOK_SECRET = Deno.env.get("MYFATOORAH_WEBHOOK_SECRET") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, myfatoorah-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Ask the gateway for the real status. Returns 'paid' | 'failed' | 'expired' | 'pending'.
async function gatewayStatus(invoiceId: string): Promise<{ status: string; raw: unknown }> {
  const res = await fetch(`${MF_BASE}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MF_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
  });
  const data = await res.json();
  const inv = String(data?.Data?.InvoiceStatus ?? "").toLowerCase();
  const txns = data?.Data?.InvoiceTransactions ?? [];
  const anyPaid = txns.some((t: { TransactionStatus?: string }) =>
    String(t.TransactionStatus ?? "").toLowerCase() === "succss" ||
    String(t.TransactionStatus ?? "").toLowerCase() === "success");
  let status = "pending";
  if (inv === "paid" || anyPaid) status = "paid";
  else if (inv === "failed") status = "failed";
  else if (inv === "expired") status = "expired";
  return { status, raw: data?.Data ?? data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = new URL(req.url);
  // Optional shared-secret gate (set ?secret= when registering the webhook URL).
  if (WEBHOOK_SECRET && url.searchParams.get("secret") !== WEBHOOK_SECRET) {
    return json({ error: "bad secret" }, 401);
  }

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* may be empty */ }

  // Identifier resolution — accept native MyFatoorah payload, our ref, or an invoiceId.
  const ref = String(body.ref ?? url.searchParams.get("ref") ?? "");
  let invoiceId = String(
    body?.Data?.InvoiceId ?? body?.InvoiceId ?? body?.invoiceId ??
    url.searchParams.get("invoiceId") ?? "",
  );

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Find the booking either by our reference (booking id) or by the gateway invoice id.
  let booking;
  if (ref) {
    const { data } = await admin.from("bookings").select("*").eq("id", ref).single();
    booking = data;
    if (booking && !invoiceId) invoiceId = booking.provider_invoice_id ?? "";
  } else if (invoiceId) {
    const { data } = await admin.from("bookings").select("*")
      .eq("provider_invoice_id", invoiceId).single();
    booking = data;
  }
  if (!booking) return json({ error: "booking not found" }, 404);
  if (!invoiceId) return json({ error: "no invoice id" }, 400);

  // IDEMPOTENCY: if already terminal, do not process again (handles duplicate webhooks).
  if (booking.payment_status === "paid" || booking.payment_status === "refunded") {
    return json({ ok: true, duplicate: true, payment_status: booking.payment_status });
  }

  // Re-verify with the gateway. This is the trust anchor.
  const { status, raw } = await gatewayStatus(invoiceId);
  if (status === "pending") {
    return json({ ok: true, payment_status: booking.payment_status, note: "still pending" });
  }

  const patch: Record<string, unknown> = { payment_status: status };
  if (status === "paid") patch.paid_at = new Date().toISOString();

  // Atomic idempotency: only the FIRST webhook transitions the row out of
  // awaiting_payment. Concurrent duplicates match zero rows and are ignored.
  // This closes the read-then-write race two simultaneous webhooks would hit.
  const { data: updated } = await admin
    .from("bookings")
    .update(patch)
    .eq("id", booking.id)
    .eq("payment_status", "awaiting_payment")
    .select("id");

  if (!updated || updated.length === 0) {
    return json({ ok: true, duplicate: true, note: "already processed" });
  }

  await admin.from("payment_events").insert({
    booking_id: booking.id,
    old_status: "awaiting_payment",
    new_status: status,
    source: "webhook",
    detail: { invoiceId, gateway: raw },
  });

  return json({ ok: true, payment_status: status });
});

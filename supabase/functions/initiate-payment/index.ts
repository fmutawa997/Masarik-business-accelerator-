// initiate-payment — the CHARGE FLOW.
//
// TRUST BOUNDARY: this function accepts ONLY a booking_id from the frontend.
// The amount, currency and reference are all computed SERVER-SIDE from the
// database (services.price_kwd for packages/events/consults, offices.monthly_rent
// for rent). The request body's amount is never read. Tampering in DevTools cannot
// change what the customer pays.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MF_BASE = Deno.env.get("MYFATOORAH_BASE_URL") ?? "https://apitest.myfatoorah.com";
// Prefer a secret; fall back to MyFatoorah's public sandbox test token so the demo runs.
const MF_KEY = Deno.env.get("MYFATOORAH_API_KEY") ??
  "SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Identify the caller from their JWT.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  // 2) Read the booking id ONLY. Ignore anything else in the body.
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const bookingId = String(body.booking_id ?? "");
  const origin = String(body.origin ?? "").replace(/\/$/, "");
  if (!bookingId) return json({ error: "booking_id required" }, 400);

  // 3) Service-role client for privileged reads/writes (bypasses RLS).
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: booking, error: bErr } = await admin
    .from("bookings").select("*").eq("id", bookingId).single();
  if (bErr || !booking) return json({ error: "booking not found" }, 404);

  // Ownership check: a user can only pay for their own booking.
  if (booking.user_id !== user.id) return json({ error: "forbidden" }, 403);

  // Already paid → nothing to do (idempotent).
  if (booking.payment_status === "paid") {
    return json({ error: "already paid", payment_status: "paid" }, 409);
  }

  // Double-tap idempotency: if we already created a MyFatoorah invoice for this
  // booking and it's still awaiting payment, reuse the same payment URL.
  if (booking.payment_status === "awaiting_payment" && booking.payment_url) {
    return json({ url: booking.payment_url, reused: true });
  }

  // 4) Compute the amount SERVER-SIDE. This is the only trusted price source.
  let amount = 0;
  let label = booking.label ?? "";
  if (booking.service_code) {
    const { data: svc } = await admin
      .from("services").select("price_kwd,name_en").eq("code", booking.service_code).single();
    if (!svc) return json({ error: "service not found" }, 404);
    amount = Number(svc.price_kwd);
    label = label || svc.name_en;
  } else if (booking.office_id) {
    const { data: off } = await admin
      .from("offices").select("monthly_rent,unit_no").eq("id", booking.office_id).single();
    if (!off) return json({ error: "office not found" }, 404);
    amount = Number(off.monthly_rent);
    label = label || `Rent — ${off.unit_no}`;
  }
  if (!amount || amount <= 0) return json({ error: "no price for booking" }, 400);

  const base = origin || SUPABASE_URL;

  // 5) Create the hosted payment at MyFatoorah with the server-computed amount.
  const mfRes = await fetch(`${MF_BASE}/v2/SendPayment`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MF_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      CustomerName: user.user_metadata?.full_name || user.email || "Masarik member",
      CustomerEmail: user.email,
      NotificationOption: "LNK",
      InvoiceValue: amount,                 // <-- server value, never the frontend's
      DisplayCurrencyIso: "KWD",
      CustomerReference: bookingId,         // our reference == booking id
      CallBackUrl: `${base}/pay/return?ref=${bookingId}`,
      ErrorUrl: `${base}/pay/return?ref=${bookingId}&error=1`,
      Language: "EN",
    }),
  });
  const mf = await mfRes.json();
  if (!mf.IsSuccess) {
    return json({ error: "gateway error", detail: mf.Message ?? mf.ValidationErrors }, 502);
  }
  const invoiceId = String(mf.Data.InvoiceId);
  const url = mf.Data.InvoiceURL;

  // 6) Move the booking to awaiting_payment and record the invoice. (Service role.)
  await admin.from("bookings").update({
    amount_kwd: amount,
    label,
    provider: "myfatoorah",
    provider_invoice_id: invoiceId,
    payment_url: url,
    reference: bookingId,
    payment_status: "awaiting_payment",
    status: "requested",
  }).eq("id", bookingId);

  await admin.from("payment_events").insert({
    booking_id: bookingId,
    old_status: booking.payment_status,
    new_status: "awaiting_payment",
    source: "initiate",
    detail: { invoiceId, amount },
  });

  return json({ url });
});

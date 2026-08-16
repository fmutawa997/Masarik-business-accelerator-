// payment-config — super-admin-only connector for the payment gateway.
//
// The API key never travels to the browser. The admin UI calls this function to:
//   - action:"status" → { connected, mode, provider, last4 }   (no secret)
//   - action:"save"   → validates the key with MyFatoorah, then stores it
// Only a user whose profile.role = 'super' may call it (checked server-side).
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Identify the caller.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Authorization: must be a super admin.
  const { data: prof } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "super") return json({ error: "forbidden" }, 403);

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const action = body.action ?? "status";

  const { data: cfg } = await admin.from("payment_config").select("*").eq("id", "default").single();

  if (action === "status") {
    return json({
      connected: !!cfg?.api_key,
      mode: cfg?.mode ?? "sandbox",
      provider: cfg?.provider ?? "myfatoorah",
      base_url: cfg?.base_url,
      last4: cfg?.api_key ? String(cfg.api_key).slice(-4) : null,
      webhook_secret_set: !!cfg?.webhook_secret,
      updated_at: cfg?.updated_at ?? null,
    });
  }

  if (action === "save") {
    const apiKey = (body.api_key ?? "").trim();
    const mode = body.mode === "production" ? "production" : "sandbox";
    const baseUrl = mode === "production"
      ? "https://api.myfatoorah.com"
      : "https://apitest.myfatoorah.com";
    const webhookSecret = (body.webhook_secret ?? "").trim() || null;

    if (!apiKey) return json({ error: "api_key required" }, 400);

    // Validate the key with MyFatoorah before storing it (InitiatePayment lists methods).
    try {
      const test = await fetch(`${baseUrl}/v2/InitiatePayment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ InvoiceAmount: 1, CurrencyIso: "KWD" }),
      });
      const tj = await test.json();
      if (!tj.IsSuccess) {
        return json({ error: "The gateway rejected this key. Check the key and mode." }, 400);
      }
    } catch {
      return json({ error: "Could not reach the gateway to validate the key." }, 502);
    }

    await admin.from("payment_config").update({
      api_key: apiKey,
      base_url: baseUrl,
      mode,
      webhook_secret: webhookSecret,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }).eq("id", "default");

    return json({ ok: true, connected: true, mode, last4: apiKey.slice(-4), webhook_secret_set: !!webhookSecret });
  }

  return json({ error: "unknown action" }, 400);
});

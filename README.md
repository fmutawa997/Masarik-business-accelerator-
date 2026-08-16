# Masarik Incubators — Member & Admin Web App

A bilingual (English / العربية, full RTL), mobile-first web app for **Masarik**, a Kuwait
business incubator — office space across three towers, mentorship & experts, service packages,
member events, partner offers, tenant billing, a funding programme ("Fund Me"), and a staff
**admin operations console**. Built with **Next.js (App Router) + Supabase**, with **real
payments via MyFatoorah**.

> Recreated from the design handoff prototype as a production-shaped web app — real database,
> authentication, row-level security, edge functions and a live payment gateway.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Server Components) |
| Styling | Tailwind CSS v4 + design tokens from the handoff |
| Fonts | Cormorant Garamond (display), Instrument Sans (body), Amiri (Arabic) |
| Backend | Supabase (Postgres + Auth + Row Level Security + Realtime + Edge Functions) |
| Payments | **MyFatoorah** (KNET / Visa / Mastercard) — hosted checkout + webhook |
| i18n | Keyed EN/AR strings + direction-aware layout (no hard-coded trees) |

**Live Supabase project:** `zpvfyibrkumkxhadgfld` · `https://zpvfyibrkumkxhadgfld.supabase.co`
The database, RLS policies, seed data and all three edge functions are already deployed there.

---

## 2. Run it locally

```bash
npm install
cp .env.example .env.local   # already filled in for the provisioned project
npm run dev
```

Open http://localhost:3000. `.env.local` holds only the **public** Supabase URL + publishable
key — safe to expose; Row Level Security is what protects the data.

---

## 3. How it was built (the same workflow as the gym-tracker days)

1. **Scaffold + design system** — Next.js app, Masarik design tokens, three Google fonts, a full
   EN/AR i18n layer with RTL, and a responsive "device frame" (phone-width on desktop, full-bleed
   on mobile).
2. **Supabase database + RLS** — profiles, catalog tables (towers, offices, services, experts,
   events, offers) and user-scoped tables (waitlist, lease requests, bookings, RSVPs, Fund Me,
   call requests). Every user-scoped table isolates rows by `user_id`. See §5.
3. **Auth** — email/password sign-up, sign-in, sign-out. A Postgres trigger auto-creates a
   profile row from the sign-up metadata. Session handled by cookies + a Next `proxy` (middleware).
4. **Edge functions** — server-side logic with secrets protected (payments; see §6).
5. **Payments** — MyFatoorah charge flow, webhook source-of-truth, a payment state machine, and
   real-world failure handling. See §6.

Migrations live in [`supabase/migrations/`](supabase/migrations) and edge functions in
[`supabase/functions/`](supabase/functions) — the whole backend is reproducible from source.

---

## 4. Auth setup (do this once in the Supabase dashboard)

- **Disable email confirmations for class:** Dashboard → **Authentication → Sign In / Providers**
  → turn off *"Enable email confirmations"*. Sign-up then creates a session immediately. (The app
  handles the confirmed case too — it shows a friendly notice if confirmation is still on.)
- **Make yourself an admin:** the Admin console (`/admin`) is gated by `profiles.role`. Grant
  yourself access with:

  ```sql
  update public.profiles set role = 'super'   -- or 'staff'
  where id = (select id from auth.users where email = 'you@email.com');
  ```

  `super` = General Manager (all admin tabs). `staff` = Leasing officer (Offices + Waitlist only).

---

## 5. Database & Row Level Security

**Catalog tables** (towers, offices, services, experts, events, offers) are **public-read** to any
signed-in user; **only `super` admins can write** them (that's what the admin "Edit" mode uses).

**User-scoped tables** isolate rows by `user_id` — a user only ever sees their own:

| Table | Read | Insert | Notes |
|---|---|---|---|
| `waitlist` | own **+ admins see all** | own | the cross-persona loop: a member joining a waitlist appears in the admin Waitlist tab in realtime |
| `lease_requests` | own + admins | own | office booking requests (no in-app payment on first booking) |
| `bookings` | own + admins | own (`payment_status` forced `pending`) | **no client UPDATE** — see below |
| `payment_events` | own + admins | — | audit log; only edge functions write |
| `event_rsvps`, `fundme_applications`, `call_requests` | own + admins | own | |

**The `payment_status` lock (this is the important one):**
`bookings` has **no UPDATE policy** for `anon`/`authenticated`, and table-level `UPDATE` is
**revoked** from both roles. So no browser client can ever change a booking — only the **service
role** (used by edge functions, which bypasses RLS) can flip `payment_status`. Verify it:

```sql
-- both return false → clients cannot write payment_status
select has_column_privilege('authenticated','public.bookings','payment_status','UPDATE'),
       has_column_privilege('anon','public.bookings','payment_status','UPDATE');
```

**Verify user isolation (the data-day exercise):** sign up as user A, add data; open an incognito
window, sign up as user B — user B sees none of user A's bookings/waitlist/etc. Screenshots to
submit: *Authentication → Users* (two accounts) and *Table Editor → bookings → Policies*.

---

## 6. Payments (MyFatoorah)

### The five facts from the gateway docs
| # | Fact | Value |
|---|---|---|
| 1 | Sandbox base URL | `https://apitest.myfatoorah.com` |
| 2 | Auth | `Authorization: Bearer <API key>` header |
| 3 | Create charge | `POST /v2/SendPayment` → returns `Data.InvoiceId` + `Data.InvoiceURL` |
| 4 | Verify status | `POST /v2/GetPaymentStatus` `{Key, KeyType:"InvoiceId"}` → `Data.InvoiceStatus` |
| 5 | Test cards | success `4508750015741019` (any exp/CVV); decline `2223000000000007` exp `01/39` CVV `100`. 3DS emulator: choose **(Y) Successful** or **(N)** to fail. |

### The three edge functions (already deployed)
- **`initiate-payment`** *(verify_jwt = true)* — the **charge flow**. Receives **only a
  `booking_id`** from the frontend. It looks the booking up, computes the amount **server-side**
  (`services.price_kwd` for packages/events/consults, `offices.monthly_rent` for rent), calls
  `SendPayment`, stores the invoice, flips the booking to `awaiting_payment`, and returns the
  hosted URL. **The request body's amount is never read** → the free-haircut / DevTools-tamper bug
  is impossible.
- **`payment-webhook`** *(verify_jwt = false)* — the **source of truth**. It never trusts a status
  in a URL or POST body; it re-queries `GetPaymentStatus` server-to-server and acts on the
  gateway's answer. Idempotent (a conditional `... where payment_status = 'awaiting_payment'`
  update means only the first of any duplicate webhooks wins). Writes the audit log.
- **`expire-bookings`** *(scheduled)* — **bad weather: abandoned checkout**. Finds bookings stuck
  in `awaiting_payment` for > 1 hour and closes them to `expired` (re-verifying first so a
  genuinely-paid-but-missed-webhook booking becomes `paid`, not wrongly expired).

### The state machine
```
pending  ──(click Pay / initiate-payment)──▶  awaiting_payment
awaiting_payment ──(webhook confirms success)──▶ paid
awaiting_payment ──(webhook confirms failure)──▶ failed
awaiting_payment ──(24h, no webhook / cron)────▶ expired
```
Colour-coded badges in the admin + tenant views: grey `pending`, blue `awaiting_payment`,
green `paid`, red `failed`, orange `expired`.

### The trust boundary
The Pay button sends **one thing** — the booking ID. Try the tamper test: DevTools → Network →
resend the `initiate-payment` request with `amount: 0.001`. The MyFatoorah page still shows the
real price, because the edge function ignores the body and reads the price from the database.

### The truth test
Pasting `?status=success` into the return URL does **nothing** — the return page passes only the
booking ref to the webhook, which re-verifies with the gateway. Only a real `Paid` result flips
the row.

### Failure modes implemented
- ✅ **Declined card** → `failed` (webhook maps the gateway's failure result)
- ✅ **Abandoned checkout** → `expired` (the `expire-bookings` cron)
- ✅ **Double-tap Pay** → the button disables on first click; `initiate-payment` reuses the
  existing invoice for a booking already `awaiting_payment`
- ✅ **Duplicate webhook** → idempotent conditional update; the second call is a no-op
- ✅ **Audit log** → every `payment_status` change writes a `payment_events` row (source =
  initiate | webhook | cron)

### Connect the gateway from the admin (super admin)
A super admin can connect the gateway in‑app: **Admin → Payments** → paste the MyFatoorah key,
pick Sandbox/Production, **Test & Save**. The key is validated against MyFatoorah, then stored in a
**locked `payment_config` table** (RLS on, no client policies, privileges revoked) that only the
edge functions' service role can read — the key is never returned to the browser. The payment
functions read the key from there, falling back to the env secret, then the sandbox token.

### Secrets & webhook registration (alternative: set it yourself)
The functions fall back to MyFatoorah's **public sandbox token**, so the demo runs out of the box.
Instead of (or in addition to) the in‑app connector, you can set secrets and register the webhook:

```bash
supabase secrets set MYFATOORAH_API_KEY="<your key>" \
                     MYFATOORAH_BASE_URL="https://apitest.myfatoorah.com" \
                     MYFATOORAH_WEBHOOK_SECRET="<random string>"   # optional gate
```

- **Webhook URL** to register in the MyFatoorah dashboard (Settings → Webhooks):
  `https://zpvfyibrkumkxhadgfld.supabase.co/functions/v1/payment-webhook?secret=<the secret>`
- **Schedule `expire-bookings`** hourly — Supabase Dashboard → Edge Functions → Schedules
  (or `pg_cron` calling the function URL).

---

## 7. Deploy to production (Vercel)

1. Push to GitHub (see below), import the repo in Vercel.
2. Set env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as
   `.env.local`).
3. In Supabase Auth → URL Configuration, add your Vercel domain to the redirect allow-list.
4. Register the webhook URL (above) with MyFatoorah and schedule `expire-bookings`.

---

## 8. Push to GitHub

`gh` isn't installed here, so create the repo on github.com, then:

```bash
git remote add origin https://github.com/<you>/masarik-app.git
git branch -M main
git push -u origin main
```

---

## 9. Project structure

```
src/
  app/
    page.tsx, Onboarding.tsx         # hero splash
    login/  signup/                  # auth
    (app)/                           # authenticated shell (guard + tab bar + device frame)
      home/ spaces/ spaces/[tower]/  # member journey
      services/ services/packages/ experts/ call/ ai/
      events/ offers/ tenant/ profile/ fundme/
      admin/                         # staff operations console (role-gated)
    pay/return/                      # payment return handler (verifies via webhook, never trusts URL)
  components/                        # Frame, TabBar, PaymentBadge, ui primitives
  lib/
    supabase/                        # browser + server + proxy clients
    i18n/                            # EN/AR strings + LangProvider (RTL)
    pay.ts                           # usePay hook (create booking → initiate-payment → redirect)
supabase/
  migrations/                        # full schema + RLS + seed
  functions/                         # initiate-payment, payment-webhook, expire-bookings
```

---

## Notes
- A demo account (`yousef.masarik.demo@gmail.com`, promoted to `super`) exists in the live project
  for verification — feel free to delete it in Auth → Users.
- Currency is always **KD** (Kuwaiti Dinar), grouped with `en-US` formatting even in Arabic, as
  specified in the design handoff.

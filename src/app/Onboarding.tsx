"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSettings } from "@/lib/SettingsProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { Btn, LangToggle } from "@/components/ui";

export default function Onboarding() {
  const { t } = useLang();
  const settings = useSettings();
  const supabase = useSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const brand = settings.brand_name || t.brand;

  async function exploreDemo() {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setErr(t.demoUnavailable);
      setBusy(false);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-screen lg:flex-row">
      {/* Image side (top on mobile, right on desktop) */}
      <div className="relative h-[42vh] w-full flex-none lg:order-2 lg:h-auto lg:min-h-[100dvh] lg:w-[54%]">
        <Image src="/assets/lounge.png" alt="Masarik space" fill priority className="object-cover" />
        {/* bottom fade on mobile, left fade on desktop */}
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{ background: "linear-gradient(180deg,rgba(58,15,24,.12) 0%,rgba(248,246,244,0) 55%,var(--screen) 100%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ background: "linear-gradient(90deg,var(--screen) 0%,rgba(248,246,244,0) 22%)" }}
        />
        <div className="absolute end-5 top-5 z-10">
          <LangToggle />
        </div>
      </div>

      {/* Content side */}
      <div className="flex flex-1 flex-col justify-center gap-4 px-7 pb-8 pt-2 lg:order-1 lg:px-16 lg:py-10">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={brand} className="mb-4 h-10 w-auto object-contain" />
          ) : (
            <div className="mb-4 text-[13px] font-semibold tracking-[0.28em] text-accent">
              {brand} · مسارك
            </div>
          )}
          <h1 className="font-display text-[32px] font-medium leading-[1.15] lg:text-[46px]">
            {t.onbTitle}
          </h1>
          <p className="mt-4 text-[14px] leading-[1.7] text-muted lg:text-[15px]">{t.onbSub}</p>
          {err && <p className="mt-3 text-[12px] text-accent">{err}</p>}
          <div className="mt-7 flex flex-col gap-2.5">
            <Btn href="/signup" className="w-full py-4">
              {t.onbCta}
            </Btn>
            <Btn onClick={exploreDemo} disabled={busy} variant="outline" className="w-full py-3.5">
              {busy ? t.loading : t.exploreDemo}
            </Btn>
            <Btn href="/login" variant="ghost" className="w-full py-2 text-[12.5px]">
              {t.haveAccount}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

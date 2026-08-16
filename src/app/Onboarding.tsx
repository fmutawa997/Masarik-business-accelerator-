"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSettings } from "@/lib/SettingsProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { Btn, LangToggle } from "@/components/ui";
import { Frame } from "@/components/Frame";

export default function Onboarding() {
  const { t } = useLang();
  const settings = useSettings();
  const supabase = useSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const brand = settings.brand_name || t.brand;

  // Quick viewers: anonymous session — no signup, isolated by RLS like any member.
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
    <Frame>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="relative h-[46%] flex-none">
          <Image src="/assets/lounge.png" alt="Masarik space" fill priority className="object-cover" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,rgba(58,15,24,.15) 0%,rgba(248,246,244,0) 55%,var(--screen) 100%)",
            }}
          />
          <div className="absolute end-4 top-4">
            <LangToggle />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-7 pt-1.5">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={brand} className="h-9 w-auto self-start object-contain" />
          ) : (
            <div className="text-[13px] font-semibold tracking-[0.28em] text-accent">
              {brand} · مسارك
            </div>
          )}
          <div className="font-display text-[30px] leading-[1.25] font-medium">{t.onbTitle}</div>
          <div className="text-[13.5px] leading-[1.65] text-muted">{t.onbSub}</div>
          {err && <div className="text-[12px] text-accent">{err}</div>}
          <div className="mt-auto flex flex-col gap-2 pb-5">
            <Btn href="/signup" className="w-full py-4">
              {t.onbCta}
            </Btn>
            <Btn onClick={exploreDemo} disabled={busy} variant="outline" className="w-full py-3">
              {busy ? t.loading : t.exploreDemo}
            </Btn>
            <Btn href="/login" variant="ghost" className="w-full py-1.5 text-[12.5px]">
              {t.haveAccount}
            </Btn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

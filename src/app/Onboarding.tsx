"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LangProvider";
import { Btn, LangToggle } from "@/components/ui";
import { Frame } from "@/components/Frame";

export default function Onboarding() {
  const { t } = useLang();
  return (
    <Frame>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Hero image */}
        <div className="relative h-[46%] flex-none">
          <Image
            src="/assets/lounge.png"
            alt="Masarik space"
            fill
            priority
            className="object-cover"
          />
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

        {/* Copy + CTAs */}
        <div className="flex flex-1 flex-col gap-3 px-7 pt-1.5">
          <div className="text-[13px] font-semibold tracking-[0.28em] text-accent">
            MASARIK · مسارك
          </div>
          <div className="font-display text-[30px] leading-[1.25] font-medium">
            {t.onbTitle}
          </div>
          <div className="text-[13.5px] leading-[1.65] text-muted">{t.onbSub}</div>
          <div className="mt-auto flex flex-col gap-2.5 pb-6">
            <Btn href="/signup" className="w-full py-4">
              {t.onbCta}
            </Btn>
            <Btn href="/login" variant="ghost" className="w-full py-2.5 text-[12.5px]">
              {t.haveAccount}
            </Btn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

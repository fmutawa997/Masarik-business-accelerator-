"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import { BackHeader } from "@/components/ui";

export default function NotAdmin({ userId }: { userId: string }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <BackHeader title={t.admConsole} backHref="/profile" />
      <div className="rounded-2xl border border-hair bg-surface p-5">
        <div className="font-display text-[18px] font-semibold">{t.notAdmin}</div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">{t.notAdminSub}</p>
        <div className="mt-3 rounded-xl bg-tint px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-accent break-all">
          update public.profiles set role = &apos;super&apos; where id = &apos;{userId}&apos;;
        </div>
      </div>
    </div>
  );
}

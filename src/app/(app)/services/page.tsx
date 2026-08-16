"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { Diamond } from "@/components/ui";

export default function ServicesPage() {
  const { t } = useLang();

  const rows = [
    { title: t.svcMktg, sub: `${t.fromKd} 280`, href: "/services/packages?cat=mktg" },
    { title: t.svcFin, sub: `${t.fromKd} 90`, href: "/services/packages?cat=fin" },
    { title: t.svcBd, sub: `${t.fromKd} 250`, href: "/services/packages?cat=bd" },
    { title: t.svcAi, sub: t.aiRowSub, href: "/ai" },
  ];

  return (
    <div className="flex flex-col gap-2.5 px-5 py-4 lg:px-8 lg:py-8">
      <div className="font-display text-[25px] font-semibold lg:text-[32px]">{t.services}</div>

      <div className="grid gap-2.5 lg:grid-cols-2">
      {/* Free business setup banner → routes to AI advisor */}
      <Link href="/ai" className="flex items-center gap-3 rounded-2xl bg-accent-dark p-4">
        <div className="flex-1">
          <div className="font-display text-[15px] font-semibold text-screen">{t.svcFree}</div>
          <div className="text-[11px] text-screen/75">{t.svcFreeSub}</div>
        </div>
        <span className="flip-rtl text-screen">›</span>
      </Link>

      {/* Experts row */}
      <Link
        href="/experts"
        className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3.5 transition-colors hover:border-accent"
      >
        <div className="flex flex-none">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-screen bg-accent-dark font-display text-[11px] font-semibold text-screen">
            FA
          </span>
          <span className="-ms-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-screen bg-edit font-display text-[11px] font-semibold text-screen">
            AA
          </span>
        </div>
        <div className="flex-1">
          <div className="font-display text-[14.5px] font-semibold">{t.expRow}</div>
          <div className="text-[11px] text-muted">{t.expRowSub}</div>
        </div>
        <span className="flip-rtl text-muted">›</span>
      </Link>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
      {rows.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className="flex items-center gap-3 rounded-2xl border border-hair bg-surface p-3.5 transition-colors hover:border-accent"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-tint">
            <Diamond />
          </span>
          <div className="flex-1">
            <div className="font-display text-[14.5px] font-semibold">{r.title}</div>
            <div className="text-[11px] text-muted">{r.sub}</div>
          </div>
          <span className="flip-rtl text-muted">›</span>
        </Link>
      ))}
      </div>

      {/* Call banner */}
      <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-edit bg-[#fbf7f5] p-3.5">
        <div className="flex-1">
          <div className="font-display text-[13.5px] font-semibold text-accent">{t.callBanner}</div>
          <div className="text-[11px] text-muted">{t.callBannerSub}</div>
        </div>
        <Link
          href="/call"
          className="rounded-full bg-accent px-3 py-2 text-[10.5px] font-semibold text-screen"
        >
          {t.callCta}
        </Link>
      </div>
    </div>
  );
}

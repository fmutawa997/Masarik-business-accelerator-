"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { useProfile } from "@/lib/ProfileProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { initials } from "@/lib/format";
import { Btn, Field } from "@/components/ui";

export default function ProfilePage() {
  const { t, toggle } = useLang();
  const profile = useProfile();
  const supabase = useSupabase();
  const router = useRouter();

  const [name, setName] = useState(profile.display_name || profile.full_name || "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const shownName = profile.display_name || profile.full_name || "Member";
  const created = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function saveName() {
    setBusy(true);
    await supabase.from("profiles").update({ display_name: name }).eq("id", profile.id);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const rows = [
    { label: t.rowPortal, href: "/tenant" },
    { label: t.rowFundme, href: "/fundme" },
    { label: t.rowOffers, href: "/offers" },
  ];

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-accent-dark font-display text-[16px] font-semibold text-screen">
          {initials(shownName)}
        </div>
        <div>
          <div className="font-display text-[19px] font-semibold">{shownName}</div>
          <div className="text-[11px] text-muted">
            {t.memberSince} {created}
          </div>
        </div>
      </div>

      {/* Membership card */}
      <div className="rounded-2xl bg-accent-dark p-4">
        <div className="text-[9px] font-semibold tracking-widest text-screen/65">
          {t.membership}
        </div>
        <div className="mt-1 font-display text-[19px] font-semibold text-screen">
          {profile.role === "super" ? t.roleSuper : profile.role === "staff" ? t.roleStaff : t.tenantTier}
        </div>
        <div className="mt-0.5 text-[11px] text-screen/75">{t.tierPerks}</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-hair bg-surface">
        {rows.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex items-center gap-3 border-b border-hair px-3.5 py-3 last:border-0"
          >
            <span className="flex-1 text-[13px] font-medium">{r.label}</span>
            <span className="flip-rtl text-muted">›</span>
          </Link>
        ))}
        <button
          onClick={toggle}
          className="flex items-center gap-3 border-b border-hair px-3.5 py-3 text-start"
        >
          <span className="flex-1 text-[13px] font-medium">{t.rowLang}</span>
          <span className="text-[11px] font-semibold text-accent">{t.langBtn}</span>
        </button>
        <Link href="/admin" className="flex items-center gap-3 px-3.5 py-3">
          <span className="flex-1 text-[13px] font-medium">{t.rowAdmin}</span>
          <span className="flip-rtl text-muted">›</span>
        </Link>
      </div>

      {/* Display name */}
      <Field label={t.displayName} value={name} onChange={setName} placeholder={t.namePh} />
      <Btn onClick={saveName} disabled={busy} variant="outline" className="w-full">
        {saved ? t.saved : t.save}
      </Btn>

      <Btn onClick={signOut} variant="ghost" className="w-full">
        {t.signOut}
      </Btn>

      <p className="whitespace-pre-line text-center text-[10.5px] leading-relaxed text-muted">
        {t.footer}
      </p>
    </div>
  );
}

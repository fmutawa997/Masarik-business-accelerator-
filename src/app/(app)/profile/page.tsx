"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { useProfile } from "@/lib/ProfileProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { initials } from "@/lib/format";
import { Btn, Field, Label, Chip } from "@/components/ui";

export default function ProfilePage() {
  const { t, toggle } = useLang();
  const profile = useProfile();
  const supabase = useSupabase();
  const router = useRouter();

  // Editable profile fields (seeded from the profile row).
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [typeIdx, setTypeIdx] = useState(
    Math.max(0, t.typeValues.indexOf(profile.member_type || "")),
  );
  const [savedProfile, setSavedProfile] = useState(false);
  const [busyProfile, setBusyProfile] = useState(false);

  // Auth-side info (email + confirmation status).
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [busyPw, setBusyPw] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? "");
        setEmailConfirmed(!!data.user.email_confirmed_at);
      }
    })();
  }, [supabase]);

  const shownName = displayName || fullName || "Member";
  const created = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function saveProfile() {
    setBusyProfile(true);
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        display_name: displayName,
        phone,
        member_type: t.typeValues[typeIdx],
      })
      .eq("id", profile.id);
    setBusyProfile(false);
    setSavedProfile(true);
    router.refresh();
    setTimeout(() => setSavedProfile(false), 1800);
  }

  async function updateEmail() {
    setBusyEmail(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email });
    setBusyEmail(false);
    setEmailMsg(error ? error.message : t.emailChangeSent);
  }

  async function resendConfirmation() {
    setBusyEmail(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusyEmail(false);
    setEmailMsg(error ? error.message : t.confirmationSent);
  }

  async function updatePassword() {
    if (password.length < 6) return;
    setBusyPw(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusyPw(false);
    setPwMsg(error ? error.message : t.passwordUpdated);
    if (!error) setPassword("");
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
  const isAdmin = profile.role === "super" || profile.role === "staff";

  return (
    <div className="flex flex-col gap-3 px-5 py-4 lg:px-8 lg:py-8">
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
        <div className="text-[9px] font-semibold tracking-widest text-screen/65">{t.membership}</div>
        <div className="mt-1 font-display text-[19px] font-semibold text-screen">
          {profile.role === "super" ? t.roleSuper : profile.role === "staff" ? t.roleStaff : t.tenantTier}
        </div>
        <div className="mt-0.5 text-[11px] text-screen/75">{t.tierPerks}</div>
      </div>

      {/* Quick rows */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-hair bg-surface">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="flex items-center gap-3 border-b border-hair px-3.5 py-3">
            <span className="flex-1 text-[13px] font-medium">{r.label}</span>
            <span className="flip-rtl text-muted">›</span>
          </Link>
        ))}
        <button onClick={toggle} className="flex items-center gap-3 border-b border-hair px-3.5 py-3 text-start">
          <span className="flex-1 text-[13px] font-medium">{t.rowLang}</span>
          <span className="text-[11px] font-semibold text-accent">{t.langBtn}</span>
        </button>
        {isAdmin && (
          <Link href="/admin" className="flex items-center gap-3 px-3.5 py-3">
            <span className="flex-1 text-[13px] font-medium">{t.rowAdmin}</span>
            <span className="flip-rtl text-muted">›</span>
          </Link>
        )}
      </div>

      {/* Account settings */}
      <div className="font-display text-[16px] font-semibold">{t.account}</div>

      <div className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-4">
        <Field label={t.name} value={fullName} onChange={setFullName} placeholder={t.namePh} />
        <Field label={t.displayName} value={displayName} onChange={setDisplayName} placeholder={t.namePh} />
        <Field label={t.phone} value={phone} onChange={setPhone} placeholder="+965" />
        <div className="rounded-xl border border-hair bg-surface px-3.5 py-3">
          <Label>{t.iam}</Label>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {t.types.map((label, i) => (
              <Chip key={i} label={label} active={typeIdx === i} onClick={() => setTypeIdx(i)} />
            ))}
          </div>
        </div>
        <Btn onClick={saveProfile} disabled={busyProfile} className="w-full">
          {savedProfile ? t.saved : busyProfile ? t.loading : t.save}
        </Btn>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-4">
        {!emailConfirmed && (
          <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-accent bg-[#fbf7f5] p-3">
            <div className="text-[12px] font-semibold text-accent">{t.emailNotConfirmed}</div>
            <Btn onClick={resendConfirmation} disabled={busyEmail} variant="outline" className="w-full py-2.5">
              {t.resendConfirm}
            </Btn>
          </div>
        )}
        {emailConfirmed && <div className="text-[11px] font-semibold text-success">{t.emailConfirmed}</div>}
        <Field label={t.email} value={email} onChange={setEmail} placeholder={t.emailPh} type="email" />
        <Btn onClick={updateEmail} disabled={busyEmail} variant="outline" className="w-full">
          {t.updateEmail}
        </Btn>
        {emailMsg && <div className="text-[11.5px] text-muted">{emailMsg}</div>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-surface p-4">
        <Field label={t.newPassword} value={password} onChange={setPassword} placeholder={t.passwordPh} type="password" />
        <Btn onClick={updatePassword} disabled={busyPw || password.length < 6} variant="outline" className="w-full">
          {t.updatePassword}
        </Btn>
        {pwMsg && <div className="text-[11.5px] text-muted">{pwMsg}</div>}
      </div>

      <Btn onClick={signOut} variant="ghost" className="w-full">
        {t.signOut}
      </Btn>

      <p className="whitespace-pre-line text-center text-[10.5px] leading-relaxed text-muted">{t.footer}</p>
    </div>
  );
}

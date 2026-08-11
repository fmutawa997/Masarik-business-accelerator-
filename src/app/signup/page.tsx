"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { Frame } from "@/components/Frame";
import { Btn, Field, Label, Chip, LangToggle } from "@/components/ui";

export default function SignupPage() {
  const { t } = useLang();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setNotice(null);
    if (!email || password.length < 6) {
      setError(t.authError);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          member_type: t.typeValues[type],
        },
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // If email confirmation is disabled (recommended for class), a session exists now.
    if (data.session) {
      router.push("/home");
      router.refresh();
      return;
    }
    // Otherwise try an immediate sign-in; if it fails, prompt to confirm email.
    const { error: siErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!siErr) {
      router.push("/home");
      router.refresh();
    } else {
      setNotice(
        "Account created. If sign-in didn't start, disable email confirmations in Supabase (Auth → Providers) or confirm your email, then sign in.",
      );
      setBusy(false);
    }
  }

  return (
    <Frame>
      <div className="flex flex-1 flex-col overflow-auto px-6 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-surface text-[15px]"
          >
            <span className="flip-rtl">‹</span>
          </Link>
          <LangToggle />
        </div>

        <div className="mt-4 font-display text-[27px] font-medium leading-tight">
          {t.suTitle}
        </div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-muted">{t.suSub}</div>

        <div className="mt-4 flex flex-col gap-2.5">
          <Field label={t.name} value={name} onChange={setName} placeholder={t.namePh} />
          <Field label={t.phone} value={phone} onChange={setPhone} placeholder="+965" />
          <Field label={t.email} value={email} onChange={setEmail} placeholder={t.emailPh} type="email" />
          <Field label={t.password} value={password} onChange={setPassword} placeholder={t.passwordPh} type="password" />

          <div className="rounded-xl border border-hair bg-surface px-3.5 py-3">
            <Label>{t.iam}</Label>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {t.types.map((label, i) => (
                <Chip key={i} label={label} active={type === i} onClick={() => setType(i)} />
              ))}
            </div>
          </div>
        </div>

        {error && <div className="mt-3 text-[12px] text-accent">{error}</div>}
        {notice && <div className="mt-3 text-[12px] text-muted">{notice}</div>}

        <Btn onClick={submit} disabled={busy} className="mt-4 w-full py-4">
          {busy ? t.loading : t.createAccount}
        </Btn>
        <Link href="/login" className="mt-3 text-center text-[12.5px] font-semibold text-accent">
          {t.signIn}
        </Link>
      </div>
    </Frame>
  );
}

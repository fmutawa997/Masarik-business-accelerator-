"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { Frame } from "@/components/Frame";
import { Btn, Field, LangToggle } from "@/components/ui";

export default function LoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/home");
    router.refresh();
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

        <div className="mt-10 font-display text-[27px] font-medium leading-tight">
          {t.liTitle}
        </div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-muted">{t.liSub}</div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Field label={t.email} value={email} onChange={setEmail} placeholder={t.emailPh} type="email" />
          <Field label={t.password} value={password} onChange={setPassword} placeholder={t.passwordPh} type="password" />
        </div>

        {error && <div className="mt-3 text-[12px] text-accent">{error}</div>}

        <Btn onClick={submit} disabled={busy} className="mt-4 w-full py-4">
          {busy ? t.loading : t.signIn}
        </Btn>
        <Link href="/signup" className="mt-3 text-center text-[12.5px] font-semibold text-accent">
          {t.noAccount}
        </Link>
      </div>
    </Frame>
  );
}

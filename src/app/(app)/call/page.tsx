"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { useProfile } from "@/lib/ProfileProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { BackHeader, Btn, Field, Label, Chip, SuccessCard } from "@/components/ui";

export default function CallPage() {
  const { t } = useLang();
  const profile = useProfile();
  const supabase = useSupabase();

  const [name, setName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [topic, setTopic] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } = await supabase.from("call_requests").insert({
      name,
      phone,
      topic: t.topics[topic],
    });
    setBusy(false);
    if (!error) setDone(true);
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <BackHeader title={t.callTitle} backHref="/services" />
      {done ? (
        <div className="mt-3">
          <SuccessCard title={t.callDoneTitle} sub={t.callDoneSub} />
        </div>
      ) : (
        <>
          <div className="font-display text-[20px] leading-relaxed">{t.callHead}</div>
          <Field label={t.name} value={name} onChange={setName} placeholder={t.namePh} />
          <Field label={t.phone} value={phone} onChange={setPhone} placeholder="+965" />
          <div className="rounded-xl border border-hair bg-surface px-3.5 py-3">
            <Label>{t.topic}</Label>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {t.topics.map((label, i) => (
                <Chip key={i} label={label} active={topic === i} onClick={() => setTopic(i)} />
              ))}
            </div>
          </div>
          <Btn onClick={submit} disabled={busy || !name || !phone} className="w-full py-4">
            {busy ? t.loading : t.callSubmit}
          </Btn>
        </>
      )}
    </div>
  );
}

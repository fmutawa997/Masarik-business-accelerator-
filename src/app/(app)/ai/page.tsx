"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { cx } from "@/components/ui";

type Msg = { who: "ai" | "me"; text: string };

export default function AiPage() {
  const { t } = useLang();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "ai", text: t.aiHello }]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { who: "me", text }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { who: "ai", text: t.aiReply }]), 500);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-hair px-5 pb-3 pt-4">
        <button
          onClick={() => router.push("/home")}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-surface text-[15px]"
        >
          <span className="flip-rtl">‹</span>
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-screen">
          AI
        </span>
        <div>
          <div className="font-display text-[15px] font-semibold">{t.aiTitle}</div>
          <div className="text-[10px] text-success">{t.aiSub}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-3.5">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={cx(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
              m.who === "me"
                ? "self-end bg-accent text-screen"
                : "self-start border border-hair bg-surface",
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2.5 border-t border-hair bg-surface px-5 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t.aiPh}
          className="flex-1 rounded-full border border-hair bg-screen px-4 py-3 text-[13px]"
        />
        <button
          onClick={send}
          className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-accent text-[16px] text-screen"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

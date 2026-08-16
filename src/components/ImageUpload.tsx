"use client";

import { useState } from "react";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { cx } from "./ui";

// Reusable image upload → Supabase Storage ('site-media', super-only write) → public URL.
export function ImageUpload({
  folder,
  onUploaded,
  label = "Upload",
  className,
}: {
  folder: string;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}) {
  const supabase = useSupabase();
  const [busy, setBusy] = useState(false);

  async function handle(file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onUploaded(data.publicUrl);
    }
    setBusy(false);
  }

  return (
    <label
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-full border border-accent px-3 py-1.5 text-[10.5px] font-semibold text-accent",
        busy && "opacity-50",
        className,
      )}
    >
      {busy ? "Uploading…" : label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
    </label>
  );
}

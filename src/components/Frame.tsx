"use client";

// Responsive "device frame": a centred phone-width column on desktop (on the ivory
// desk background), full-bleed on phones. Children manage their own internal scroll.
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-stretch justify-center bg-page sm:items-center sm:py-6">
      <div
        className="relative flex w-full max-w-[440px] flex-col overflow-hidden bg-screen sm:h-[min(880px,92vh)] sm:rounded-[34px] sm:border sm:border-black/5 sm:shadow-[0_30px_80px_-20px_rgba(58,15,24,0.35)]"
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* Surface card */
export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "rounded-2xl border border-hair bg-surface",
        onClick && "cursor-pointer transition-colors hover:border-accent",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* Uppercase micro-label */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("label text-[9.5px]", className)}>{children}</div>;
}

/* Primary pill / block button */
export function Btn({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "outline" | "ghost" | "dark";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-opacity disabled:opacity-50";
  const styles = {
    primary: "bg-accent text-screen hover:opacity-90",
    dark: "bg-accent-dark text-screen hover:opacity-90",
    outline: "border border-accent text-accent bg-transparent",
    ghost: "text-accent bg-transparent",
  }[variant];
  const cls = cx(base, styles, className);
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/* Labeled input box (design pattern: label above borderless input in a card) */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block rounded-xl border border-hair bg-surface px-3.5 py-3">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full bg-transparent text-[14px] text-ink placeholder:text-muted/60"
      />
    </label>
  );
}

/* Selectable pill chip */
export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-2 text-[11.5px] font-semibold transition-colors",
        active
          ? "border-accent bg-accent text-screen"
          : "border-hair bg-surface text-muted hover:border-accent",
      )}
    >
      {label}
    </button>
  );
}

/* Small screen header with a circular back button */
export function BackHeader({ title, backHref }: { title: string; backHref?: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-surface text-[15px]"
        aria-label="Back"
      >
        <span className="flip-rtl">‹</span>
      </button>
      <span className="font-display text-[19px] font-semibold">{title}</span>
    </div>
  );
}

/* Rotated-square accent glyph used all over the design */
export function Diamond({ className = "bg-accent", size = 10 }: { className?: string; size?: number }) {
  return (
    <span
      className={cx("block rotate-45", className)}
      style={{ width: size, height: size }}
    />
  );
}

/* Section title (serif) with optional action link */
export function SectionTitle({
  children,
  action,
  href,
}: {
  children: React.ReactNode;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-display text-[18px] font-semibold">{children}</span>
      {action && href && (
        <Link href={href} className="text-[11px] font-semibold text-accent">
          {action}
        </Link>
      )}
    </div>
  );
}

/* Success confirmation card */
export function SuccessCard({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border-[1.5px] border-success bg-surface p-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-[19px] font-bold text-white">
        ✓
      </span>
      <div className="font-display text-[19px] font-semibold">{title}</div>
      {sub && <div className="text-[12px] leading-relaxed text-muted">{sub}</div>}
    </div>
  );
}

/* Language toggle button */
export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { t, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className={cx(
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold",
        dark
          ? "border-screen/35 text-screen"
          : "border-hair text-accent bg-surface",
      )}
    >
      {t.langBtn}
    </button>
  );
}

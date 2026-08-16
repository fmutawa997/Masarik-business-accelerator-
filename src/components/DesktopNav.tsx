"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSettings } from "@/lib/SettingsProvider";
import { useProfile } from "@/lib/ProfileProvider";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { cx } from "./ui";

// Desktop-only top navigation bar (hidden on mobile, where the bottom tab bar is used).
export function DesktopNav() {
  const { t, toggle } = useLang();
  const settings = useSettings();
  const profile = useProfile();
  const supabase = useSupabase();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = profile.role === "super" || profile.role === "staff";

  const links = [
    { href: "/home", label: t.navHome },
    { href: "/spaces", label: t.ourSpaces },
    { href: "/services", label: t.services },
    { href: "/events", label: t.events },
    { href: "/offers", label: t.rowOffers },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 hidden border-b border-hair bg-screen/85 backdrop-blur lg:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-8">
        <Link href="/home" className="flex items-center gap-2">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={settings.brand_name || t.brand} className="h-7 w-auto object-contain" />
          ) : (
            <span className="text-[15px] font-semibold tracking-[0.22em] text-accent">
              {settings.brand_name || t.brand}
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                  active ? "bg-tint text-accent" : "text-ink/70 hover:text-accent",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-full border border-hair px-3 py-1.5 text-[12px] font-semibold text-accent"
          >
            {t.langBtn}
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full border border-hair px-3 py-1.5 text-[12px] font-semibold text-ink/70 hover:text-accent"
            >
              {t.admConsole}
            </Link>
          )}
          <Link
            href="/profile"
            className={cx(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold",
              pathname.startsWith("/profile") ? "bg-tint text-accent" : "text-ink/70 hover:text-accent",
            )}
          >
            {t.navProfile}
          </Link>
          <button
            onClick={signOut}
            className="rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-screen"
          >
            {t.signOut}
          </button>
        </div>
      </div>
    </header>
  );
}

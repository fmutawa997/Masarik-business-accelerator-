"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { cx } from "./ui";

export function TabBar() {
  const { t } = useLang();
  const pathname = usePathname();

  const tabs = [
    { href: "/home", label: t.navHome, key: "home" },
    { href: "/spaces", label: t.ourSpaces, key: "spaces" },
    { href: "/services", label: t.services, key: "services" },
    { href: "/events", label: t.events, key: "events" },
    { href: "/profile", label: t.navProfile, key: "profile" },
  ];

  return (
    <div className="flex flex-none items-center justify-around border-t border-hair bg-surface px-2.5 pb-1.5 pt-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className="flex min-w-[52px] flex-col items-center gap-1 py-0.5"
          >
            <span
              className={cx(
                "block h-[9px] w-[9px] rotate-45",
                active ? "bg-accent" : "border border-muted bg-transparent",
              )}
            />
            <span
              className={cx(
                "text-[9.5px] font-semibold",
                active ? "text-accent" : "text-muted",
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

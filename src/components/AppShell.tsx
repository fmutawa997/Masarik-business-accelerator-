"use client";

import { usePathname } from "next/navigation";
import { Frame } from "./Frame";
import { TabBar } from "./TabBar";
import { ProfileProvider } from "@/lib/ProfileProvider";
import type { Profile } from "@/lib/types";

// Screens that hide the bottom tab bar (full-screen sub-flows).
const NO_TABS = ["/ai", "/admin"];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showTabs = !NO_TABS.some((p) => pathname.startsWith(p));

  return (
    <ProfileProvider profile={profile}>
      <Frame>
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        {showTabs && <TabBar />}
      </Frame>
    </ProfileProvider>
  );
}

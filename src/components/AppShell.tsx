"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "./TabBar";
import { DesktopNav } from "./DesktopNav";
import { ProfileProvider } from "@/lib/ProfileProvider";
import type { Profile } from "@/lib/types";

// Screens that hide the app chrome (full-screen sub-flows).
const NO_CHROME = ["/ai", "/admin"];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showChrome = !NO_CHROME.some((p) => pathname.startsWith(p));

  return (
    <ProfileProvider profile={profile}>
      <div
        className="min-h-[100dvh] bg-page"
        style={{ filter: "var(--app-filter, none)" }}
      >
        {showChrome && <DesktopNav />}

        <div className="flex justify-center">
          {/* Mobile/tablet: phone app column. Desktop (lg): full-width website. */}
          <div
            className="relative flex min-h-[100dvh] w-full max-w-[460px] flex-col overflow-hidden bg-screen
                       md:my-6 md:h-[min(880px,92vh)] md:min-h-0 md:rounded-[34px] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_rgba(58,15,24,0.35)]
                       lg:my-0 lg:h-auto lg:min-h-[calc(100dvh-4rem)] lg:max-w-3xl lg:overflow-visible lg:rounded-none lg:border-0 lg:shadow-none"
            style={{ zoom: "var(--app-zoom, 1)" } as React.CSSProperties}
          >
            <div className="flex flex-1 flex-col overflow-y-auto lg:block lg:overflow-visible">
              {children}
            </div>
            {showChrome && <TabBar />}
          </div>
        </div>
      </div>
    </ProfileProvider>
  );
}

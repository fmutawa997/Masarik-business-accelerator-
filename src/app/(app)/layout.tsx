import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import type { Profile } from "@/lib/types";

// Auth guard for every /home, /spaces, ... route. Loads the profile (via RLS)
// and hands it to the client shell.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fall back to a minimal profile if the row hasn't propagated yet.
  const safeProfile: Profile =
    (profile as Profile) ?? {
      id: user.id,
      full_name: user.email ?? "",
      display_name: null,
      phone: null,
      member_type: null,
      role: "member",
      created_at: new Date().toISOString(),
    };

  return <AppShell profile={safeProfile}>{children}</AppShell>;
}

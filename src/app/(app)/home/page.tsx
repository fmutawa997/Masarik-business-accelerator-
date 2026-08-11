import { createClient } from "@/lib/supabase/server";
import HomeScreen from "./HomeScreen";
import type { Tower, EventRow } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: towers }, { data: events }] = await Promise.all([
    supabase.from("towers").select("*").order("sort"),
    supabase.from("events").select("*").order("sort").limit(1),
  ]);
  return (
    <HomeScreen
      towers={(towers as Tower[]) ?? []}
      featured={(events as EventRow[])?.[0] ?? null}
    />
  );
}

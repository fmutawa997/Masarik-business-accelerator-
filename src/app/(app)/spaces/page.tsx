import { createClient } from "@/lib/supabase/server";
import SpacesScreen from "./SpacesScreen";
import type { Tower } from "@/lib/types";

export default async function SpacesPage() {
  const supabase = await createClient();
  const { data: towers } = await supabase.from("towers").select("*").order("sort");
  return <SpacesScreen towers={(towers as Tower[]) ?? []} />;
}

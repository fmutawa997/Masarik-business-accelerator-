import { createClient } from "@/lib/supabase/server";
import ExpertsScreen from "./ExpertsScreen";
import type { Expert } from "@/lib/types";

export default async function ExpertsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("experts").select("*").order("sort");
  return <ExpertsScreen experts={(data as Expert[]) ?? []} />;
}

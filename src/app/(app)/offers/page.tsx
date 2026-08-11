import { createClient } from "@/lib/supabase/server";
import OffersScreen from "./OffersScreen";
import type { Offer } from "@/lib/types";

export default async function OffersPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("*").order("sort");
  return <OffersScreen offers={(data as Offer[]) ?? []} />;
}

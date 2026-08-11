import { createClient } from "@/lib/supabase/server";
import FundmeScreen from "./FundmeScreen";
import type { FundmeApp } from "@/lib/types";

export default async function FundmePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fundme_applications")
    .select("*")
    .order("created_at", { ascending: false });
  return <FundmeScreen apps={(data as FundmeApp[]) ?? []} />;
}

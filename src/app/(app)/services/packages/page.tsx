import { createClient } from "@/lib/supabase/server";
import PackagesScreen from "./PackagesScreen";
import type { Service } from "@/lib/types";

export default async function PackagesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("kind", "package")
    .order("sort");
  return <PackagesScreen packages={(data as Service[]) ?? []} />;
}

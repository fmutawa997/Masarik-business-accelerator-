import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TowerScreen from "./TowerScreen";
import type { Tower, Office } from "@/lib/types";

export default async function TowerPage({
  params,
}: {
  params: Promise<{ tower: string }>;
}) {
  const { tower } = await params;
  const supabase = await createClient();
  const [{ data: tw }, { data: offices }] = await Promise.all([
    supabase.from("towers").select("*").eq("id", tower).single(),
    supabase.from("offices").select("*").eq("tower_id", tower).order("sort"),
  ]);
  if (!tw) notFound();
  return <TowerScreen tower={tw as Tower} offices={(offices as Office[]) ?? []} />;
}

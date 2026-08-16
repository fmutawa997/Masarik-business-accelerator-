import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Onboarding from "./Onboarding";
import { LANDING_DEFAULT, type LandingContent } from "@/lib/pages";

// Landing / onboarding hero. Logged-in users skip straight to Home.
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  const { data } = await supabase
    .from("page_content")
    .select("content")
    .eq("page", "landing")
    .single();

  const content: LandingContent = { ...LANDING_DEFAULT, ...(data?.content ?? {}) };
  return <Onboarding content={content} />;
}

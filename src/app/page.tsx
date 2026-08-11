import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Onboarding from "./Onboarding";

// Landing / onboarding hero. Logged-in users skip straight to Home.
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");
  return <Onboarding />;
}

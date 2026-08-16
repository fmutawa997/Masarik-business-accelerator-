import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type SiteSettings } from "./theme";

// Server-side fetch of the super admin's site settings (theme + brand + icon).
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .single();
    if (data) return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    /* fall back to defaults */
  }
  return DEFAULT_SETTINGS;
}

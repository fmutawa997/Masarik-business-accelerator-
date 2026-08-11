import { createClient } from "@/lib/supabase/server";
import EventsScreen from "./EventsScreen";
import type { EventRow } from "@/lib/types";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase.from("events").select("*").order("sort");
  const { data: { user } } = await supabase.auth.getUser();
  const { data: rsvps } = await supabase.from("event_rsvps").select("event_id");
  return (
    <EventsScreen
      events={(events as (EventRow & { service_code: string | null })[]) ?? []}
      rsvpIds={(rsvps ?? []).map((r) => r.event_id as string)}
      userId={user?.id ?? ""}
    />
  );
}

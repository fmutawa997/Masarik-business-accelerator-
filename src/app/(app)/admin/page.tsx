import { createClient } from "@/lib/supabase/server";
import AdminScreen from "./AdminScreen";
import NotAdmin from "./NotAdmin";
import type {
  Tower, Office, Waitlist, LeaseRequest, Booking, FundmeApp, EventRow, Offer,
} from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();

  const role = profile?.role ?? "member";
  if (role !== "staff" && role !== "super") return <NotAdmin userId={user!.id} />;

  // As an admin, RLS admin policies return ALL rows for these tables.
  const [towers, offices, waitlist, leases, bookings, fundme, events, offers] = await Promise.all([
    supabase.from("towers").select("*").order("sort"),
    supabase.from("offices").select("*").order("sort"),
    supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
    supabase.from("lease_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("fundme_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("sort"),
    supabase.from("offers").select("*").order("sort"),
  ]);

  return (
    <AdminScreen
      role={role as "staff" | "super"}
      towers={(towers.data as Tower[]) ?? []}
      offices={(offices.data as Office[]) ?? []}
      waitlist={(waitlist.data as Waitlist[]) ?? []}
      leases={(leases.data as LeaseRequest[]) ?? []}
      bookings={(bookings.data as Booking[]) ?? []}
      fundme={(fundme.data as FundmeApp[]) ?? []}
      events={(events.data as EventRow[]) ?? []}
      offers={(offers.data as Offer[]) ?? []}
    />
  );
}

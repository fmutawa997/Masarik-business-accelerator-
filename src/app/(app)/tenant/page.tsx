import { createClient } from "@/lib/supabase/server";
import TenantScreen from "./TenantScreen";
import type { Booking, LeaseRequest } from "@/lib/types";

export default async function TenantPage() {
  const supabase = await createClient();
  const [{ data: leases }, { data: rentBookings }] = await Promise.all([
    supabase.from("lease_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("*").eq("kind", "rent").order("created_at", { ascending: false }),
  ]);
  return (
    <TenantScreen
      lease={(leases as LeaseRequest[])?.[0] ?? null}
      rentBookings={(rentBookings as Booking[]) ?? []}
    />
  );
}

export type Role = "member" | "staff" | "super";

export type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  member_type: string | null;
  role: Role;
  created_at: string;
};

export type Tower = {
  id: string;
  name_en: string; name_ar: string;
  tier_en: string | null; tier_ar: string | null;
  sub_en: string | null; sub_ar: string | null;
  price_label_en: string | null; price_label_ar: string | null;
  image: string | null;
  units_total: number; units_available: number; sort: number;
};

export type Office = {
  id: string; tower_id: string; unit_no: string;
  size_m2: number | null; monthly_rent: string | null;
  tenant_name: string | null; status: "available" | "rented"; sort: number;
};

export type Service = {
  code: string; kind: string; category: string | null;
  name_en: string; name_ar: string; price_kwd: string;
  features_en: string[]; features_ar: string[];
  meta: Record<string, unknown>; active: boolean; sort: number;
};

export type Expert = {
  id: string; initials: string; name_en: string; name_ar: string;
  role_en: string; role_ar: string; bio_en: string; bio_ar: string;
  skills_en: string[]; skills_ar: string[];
  price_kwd: string; duration_min: number; avatar: string; sort: number;
};

export type EventRow = {
  id: string; day: string; month_en: string; month_ar: string;
  title_en: string; title_ar: string; sub_en: string; sub_ar: string;
  price_kwd: string | null; price_label_en: string; price_label_ar: string;
  image: string; sort: number;
};

export type Offer = {
  id: string; name_en: string; name_ar: string; cat_en: string; cat_ar: string;
  perk_en: string; perk_ar: string; discount: string; image: string; sort: number;
};

export type PaymentStatus =
  | "pending" | "awaiting_payment" | "paid" | "failed" | "expired" | "refunded";

export type Booking = {
  id: string; user_id: string; kind: "rent" | "package" | "event" | "consult";
  service_code: string | null; office_id: string | null; label: string | null;
  amount_kwd: string | null; currency: string; status: string;
  payment_status: PaymentStatus; provider: string | null;
  provider_invoice_id: string | null; payment_url: string | null;
  reference: string | null; paid_at: string | null;
  created_at: string; updated_at: string;
};

export type Waitlist = {
  id: string; user_id: string; tower_id: string; name: string; phone: string; created_at: string;
};

export type LeaseRequest = {
  id: string; user_id: string; office_id: string | null; tower_id: string | null;
  unit_no: string | null; term_months: number | null; monthly_rent: string | null;
  deposit: string | null; total: string | null; civil_id_attached: boolean;
  status: string; created_at: string;
};

export type FundmeApp = {
  id: string; user_id: string; business_name: string | null; sector: string | null;
  amount_kwd: string | null; stage: "submitted" | "review" | "analysis" | "decision"; created_at: string;
};

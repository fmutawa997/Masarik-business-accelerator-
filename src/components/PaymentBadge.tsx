"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import type { PaymentStatus } from "@/lib/types";
import { cx } from "./ui";

// Colour-coded payment status: gray pending, blue awaiting, green paid, red failed,
// orange expired, muted refunded.
const STYLES: Record<PaymentStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  awaiting_payment: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-[#eaf3ec] text-success border-success/40",
  failed: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-orange-50 text-orange-700 border-orange-200",
  refunded: "bg-purple-50 text-purple-700 border-purple-200",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const { t } = useLang();
  return (
    <span
      className={cx(
        "inline-block rounded-full border px-2.5 py-1 text-[10px] font-semibold",
        STYLES[status] ?? STYLES.pending,
      )}
    >
      {t.payStatus[status] ?? status}
    </span>
  );
}

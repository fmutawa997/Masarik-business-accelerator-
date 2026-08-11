"use client";

import { useMemo } from "react";
import { createClient } from "./client";

// Memoised browser client so components don't spin up a new one per render.
export function useSupabase() {
  return useMemo(() => createClient(), []);
}

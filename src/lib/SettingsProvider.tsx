"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SETTINGS, type SiteSettings } from "./theme";

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

// Brand identity (name/tagline/logo) for client components. Theme colours/fonts are
// applied as CSS variables by the root layout, so components rarely need those here.
export function useSettings() {
  return useContext(SettingsContext);
}

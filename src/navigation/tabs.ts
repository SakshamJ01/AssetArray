import { AppTab } from "../types/wealth";

/**
 * Canonical navigation registry (3.3.x core-integrity).
 * Single source for desktop/mobile tab mapping. Labels for chrome
 * (BottomTabBar/DesktopSidebar) must derive from here, not diverge.
 */

export type TabDef = { key: AppTab; label: string; mobileVisible: boolean };

export const TAB_REGISTRY: TabDef[] = [
  { key: "Dashboard", label: "Dashboard", mobileVisible: true },
  { key: "Clients", label: "Clients", mobileVisible: true },
  { key: "Portfolios", label: "Portfolios", mobileVisible: true },
  { key: "Tools", label: "Tools", mobileVisible: false },
  { key: "Workspace", label: "Workspace", mobileVisible: true },
  { key: "Settings", label: "Settings", mobileVisible: false },
  { key: "AI Research", label: "AI Research", mobileVisible: true },
];

export const VISIBLE_TABS: Array<{ key: AppTab; label: string }> = TAB_REGISTRY.map(({ key, label }) => ({
  key,
  label,
}));

export const MOBILE_TABS: Array<{ key: AppTab; label: string }> = TAB_REGISTRY.filter((t) => t.mobileVisible).map(
  ({ key, label }) => ({ key, label })
);

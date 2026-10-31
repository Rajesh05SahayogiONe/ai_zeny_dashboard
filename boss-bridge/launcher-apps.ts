import { Activity, CreditCard, KeyRound, LayoutDashboard, Monitor, Plug, Radio, type LucideIcon } from "lucide-react";

/** One tile in the header's apps launcher. `href` opens inside Boss Bridge; `liveUrl` opens another site in a new tab. */
export interface LauncherApp {
  id: string;
  name: string;
  icon?: LucideIcon;
  logoUrl?: string;
  /** Text mark used when there is no icon or logo. */
  mark?: string;
  /** Tint for the icon chip. */
  fg?: string;
  href?: string;
  liveUrl?: string;
}

/** For now the launcher lists Boss Bridge's own pages; add other products here as they get a URL. */
export const LAUNCHER_APPS: LauncherApp[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, fg: "#2563EB", href: "/" },
  { id: "device", name: "Device", icon: Monitor, fg: "#0891B2", href: "/device" },
  { id: "pusher", name: "Pusher", icon: Radio, fg: "#7C3AED", href: "/pusher" },
  { id: "integrations", name: "Integrations", icon: Plug, fg: "#16A34A", href: "/integrations" },
  { id: "api-tokens", name: "API tokens", icon: KeyRound, fg: "#D97706", href: "/api-tokens" },
  { id: "activity", name: "Activity", icon: Activity, fg: "#DB2777", href: "/activity" },
  { id: "subscription", name: "Subscription", icon: CreditCard, fg: "#4F46E5", href: "/subscription" },
];

export const DEFAULT_FAVORITES = ["dashboard", "device", "api-tokens"];

export const isLinked = (app: LauncherApp) => Boolean(app.href || app.liveUrl);

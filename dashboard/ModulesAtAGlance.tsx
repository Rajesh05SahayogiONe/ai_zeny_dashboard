import { ArrowRight } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { DrillLink } from "@/components/dashboard/DrillLink";
import { StatusBadge, type StatusLevel } from "@/components/dashboard/StatusBadge";
import { MODULE_DESCRIPTIONS, MODULE_HOME_HREFS } from "../constants/module-labels";
import type { NavItem } from "../types/workspace-context";

// Setu's AREA_TONE: the arrow takes the status' foreground colour.
const TONE_FG: Record<StatusLevel, string> = {
  healthy: "var(--status-healthy-fg)",
  warning: "var(--status-warning-fg)",
  critical: "var(--status-critical-fg)",
  info: "var(--status-info-fg)",
  neutral: "var(--status-neutral-fg)",
};

const TILE_CLASS =
  "relative flex min-w-0 grow basis-full items-center gap-2.5 rounded-[var(--card-radius)] border border-[var(--divider)] bg-[var(--surface)] p-[var(--card-pad)] screen-sm:basis-[calc((100%-var(--space-sm))/2)] screen-lg:basis-[calc((100%-(var(--space-sm)*2))/3)]";

/**
 * Setu's "Nine Areas at a Glance" card, one tile per module in the user's rail.
 * Real, not sample: the modules come from the same filtered nav the rail uses,
 * and "Live" means the module has a page today (MODULE_HOME_HREFS). A module
 * with no page yet shows "Coming soon" as a plain tile, since there is nowhere
 * for it to link to.
 */
export function ModulesAtAGlance({ items }: { items: NavItem[] }) {
  const modules = items.filter((item) => item.moduleKey);
  if (modules.length === 0) return null;

  return (
    <Card title="Modules at a Glance" description="Every module you have access to">
      <div className="flex flex-wrap gap-[var(--space-sm)]">
        {modules.map((item) => {
          const key = item.moduleKey ?? "";
          const href = MODULE_HOME_HREFS[key];
          const status: StatusLevel = href ? "healthy" : "neutral";
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg [&_img]:h-full [&_img]:w-full">
                {item.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--text-heading)]">{item.label}</span>
                  <StatusBadge status={status} label={href ? "Live" : "Coming soon"} />
                </span>
                <span className="truncate text-xs text-[var(--text-muted)]">{MODULE_DESCRIPTIONS[key] ?? ""}</span>
              </span>
            </>
          );

          if (!href) {
            return (
              <div key={key} className={TILE_CLASS} style={{ boxShadow: "var(--card-shadow)" }}>
                {body}
              </div>
            );
          }

          return (
            <DrillLink
              key={key}
              href={href}
              className={`card-interactive tap-pop group ${TILE_CLASS}`}
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              {body}
              <span
                aria-hidden="true"
                className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                style={{ color: TONE_FG[status] }}
              >
                <ArrowRight size={14} />
              </span>
            </DrillLink>
          );
        })}
      </div>
    </Card>
  );
}

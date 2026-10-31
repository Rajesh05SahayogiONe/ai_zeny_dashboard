import * as React from "react"
import Link from "next/link"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps extends React.ComponentPropsWithoutRef<"nav"> {
  items: BreadcrumbItem[]
  backHref?: string
  onBackAction?: () => void
  /** Called before a breadcrumb link navigates; it may `preventDefault()` to
   *  hold the navigation (e.g. PageHeader's unsaved-changes guard). */
  onLinkClick?: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void
}

export function Breadcrumbs({ items, className, backHref, onBackAction, onLinkClick, ...props }: BreadcrumbsProps) {
  if ((!items || items.length === 0) && !backHref && !onBackAction) return null

  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      {...props}
    >
      {onBackAction ? (
        <button
          onClick={onBackAction}
          type="button"
          className="flex items-center gap-1.5 border rounded-md px-3 py-1.5 mr-6 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shrink-0 shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
      ) : backHref ? (
        <Link
          href={backHref}
          className="flex items-center gap-1.5 border rounded-md px-3 py-1.5 mr-6 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shrink-0 shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Link>
      ) : null}
      {items && items.length > 0 && (
        <ol className="flex items-center space-x-2 overflow-hidden">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const href = item.href

            return (
              <li key={index} className="flex items-center">
                {isLast || !href ? (
                  <span
                    className={cn(
                      "truncate",
                      isLast ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="truncate transition-colors hover:text-foreground"
                    onClick={onLinkClick ? (event) => onLinkClick(event, href) : undefined}
                  >
                    {item.label}
                  </Link>
                )}
                {!isLast && (
                  <ChevronRight className="mx-2 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </nav>
  )
}

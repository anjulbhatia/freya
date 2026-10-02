import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * Board header: project title, live counts, optional actions.
 * Meta stays one quiet line. No description paragraphs here.
 */
export function PageHeader({
  title,
  meta,
  actions,
  className,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-12 flex-none items-center gap-3 px-4", className)}>
      <div className="min-w-0">
        <div className="truncate text-title-sm font-semibold tracking-tight">
          {title}
        </div>
        {meta && (
          <div className="truncate text-caption text-muted-foreground">{meta}</div>
        )}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Board content shell. Columns live here, on the page canvas.
 */
export function CollectionPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-h-0 min-w-0 flex-1 overflow-x-auto bg-page-canvas",
        className
      )}
    >
      {children}
    </section>
  );
}

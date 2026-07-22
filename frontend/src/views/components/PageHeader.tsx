import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  /** The backend route this page drives, shown so operators can correlate logs. */
  endpoint?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  endpoint,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-ink sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
        {endpoint ? (
          <code className="mt-3 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-[10px] font-medium text-brand-bright">
            {endpoint}
          </code>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

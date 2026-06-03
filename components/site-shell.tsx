"use client";

import type { ReactNode } from "react";

export function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,oklch(0.55_0.2_285/0.22),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,oklch(0.6_0.15_200/0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_0%_100%,oklch(0.55_0.18_320/0.1),transparent_45%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(1 0 0 / 0.04) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-2">
      {eyebrow && (
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">
          {eyebrow}
        </p>
      )}
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-sm">
            <Icon className="size-5 text-primary" />
          </span>
        )}
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PanelCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

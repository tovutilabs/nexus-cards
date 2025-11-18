import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export function DashboardShell({
  children,
  sidebar,
  header,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50" {...props}>
      {header && (
        <header className="sticky top-0 z-dropdown w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">{header}</div>
        </header>
      )}
      <div className="flex">
        {sidebar && (
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r bg-background lg:block">
            <div className="h-full overflow-y-auto py-6 px-4">{sidebar}</div>
          </aside>
        )}
        <main className={cn('flex-1 py-6', className)}>
          <div className="container max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

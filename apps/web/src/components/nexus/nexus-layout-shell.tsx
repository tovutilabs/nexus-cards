import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NexusLayoutShellProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const NexusLayoutShell = React.forwardRef<
  HTMLDivElement,
  NexusLayoutShellProps
>(
  (
    { children, header, sidebar, maxWidth = 'xl', className, ...props },
    ref
  ) => {
    return (
      <div className="min-h-screen bg-background" ref={ref} {...props}>
        {header && (
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div
              className={cn(
                'container flex h-16 items-center',
                maxWidthClasses[maxWidth]
              )}
            >
              {header}
            </div>
          </header>
        )}
        <div className="flex">
          {sidebar && (
            <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r lg:block">
              <div className="h-full overflow-y-auto py-6 px-4">{sidebar}</div>
            </aside>
          )}
          <main className={cn('flex-1 py-6', className)}>
            <div className={cn('container', maxWidthClasses[maxWidth])}>
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }
);
NexusLayoutShell.displayName = 'NexusLayoutShell';

export { NexusLayoutShell };

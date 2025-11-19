import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const nexusBadgeVariants = cva(
  'inline-flex items-center rounded-md transition-all duration-200 font-medium border',
  {
    variants: {
      variant: {
        primary:
          'bg-nexus-blue-100 text-nexus-blue-700 border-nexus-blue-200 dark:bg-nexus-blue-950 dark:text-nexus-blue-300 dark:border-nexus-blue-800',
        success:
          'bg-nexus-green-100 text-nexus-green-700 border-nexus-green-200 dark:bg-nexus-green-950 dark:text-nexus-green-300 dark:border-nexus-green-800',
        danger:
          'bg-nexus-red-100 text-nexus-red-700 border-nexus-red-200 dark:bg-nexus-red-950 dark:text-nexus-red-300 dark:border-nexus-red-800',
        warning:
          'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
        secondary: 'bg-secondary text-secondary-foreground border-border',
        outline:
          'border-2 border-nexus-blue-600 text-nexus-blue-600 bg-transparent',
      },
      size: {
        default: 'text-xs px-2.5 py-0.5',
        sm: 'text-2xs px-2 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface NexusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof nexusBadgeVariants> {
  dot?: boolean;
}

const NexusBadge = React.forwardRef<HTMLDivElement, NexusBadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => {
    return (
      <div
        className={cn(nexusBadgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {dot && (
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
        )}
        {children}
      </div>
    );
  }
);
NexusBadge.displayName = 'NexusBadge';

export { NexusBadge, nexusBadgeVariants };

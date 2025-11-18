import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const nexusCardVariants = cva(
  'transition-all duration-200 border-border',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground shadow-sm',
        elevated: 'bg-card text-card-foreground shadow-md hover:shadow-lg',
        outlined: 'border-2 border-nexus-blue-200 dark:border-nexus-blue-800',
        gradient: 'bg-gradient-to-br from-nexus-blue-50 to-nexus-blue-100 dark:from-nexus-blue-950 dark:to-nexus-blue-900',
        glass: 'bg-white/80 dark:bg-black/40 backdrop-blur-md shadow-lg border border-white/20',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-lg',
        glow: 'hover:ring-2 hover:ring-nexus-blue-500/50',
        scale: 'hover:scale-105',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
    },
  }
);

export interface NexusCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof nexusCardVariants> {
  header?: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

const NexusCard = React.forwardRef<HTMLDivElement, NexusCardProps>(
  ({ className, variant, hover, header, title, description, footer, children, ...props }, ref) => {
    return (
      <Card className={cn(nexusCardVariants({ variant, hover, className }))} ref={ref} {...props}>
        {(header || title || description) && (
          <CardHeader>
            {header}
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        {children && <CardContent>{children}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    );
  }
);
NexusCard.displayName = 'NexusCard';

export { NexusCard, nexusCardVariants };

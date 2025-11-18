import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nexusButtonVariants = cva(
  'transition-all duration-200 font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-nexus-blue-600 hover:bg-nexus-blue-700 text-white shadow-sm hover:shadow-md',
        secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
        success: 'bg-nexus-green-600 hover:bg-nexus-green-700 text-white shadow-sm hover:shadow-md',
        danger: 'bg-nexus-red-600 hover:bg-nexus-red-700 text-white shadow-sm hover:shadow-md',
        outline: 'border-2 border-nexus-blue-600 text-nexus-blue-600 hover:bg-nexus-blue-50 dark:hover:bg-nexus-blue-950',
        ghost: 'hover:bg-nexus-blue-50 hover:text-nexus-blue-700 dark:hover:bg-nexus-blue-950',
        link: 'text-nexus-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-sm',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface NexusButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof nexusButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const NexusButton = React.forwardRef<HTMLButtonElement, NexusButtonProps>(
  ({ className, variant, size, loading, disabled, fullWidth, children, ...props }, ref) => {
    return (
      <Button
        className={cn(
          nexusButtonVariants({ variant, size, className }),
          fullWidth && 'w-full'
        )}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);
NexusButton.displayName = 'NexusButton';

export { NexusButton, nexusButtonVariants };

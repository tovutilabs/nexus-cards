import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const nexusInputVariants = cva('transition-all duration-200', {
  variants: {
    variant: {
      default: 'border-input focus-visible:ring-nexus-blue-500',
      success: 'border-nexus-green-500 focus-visible:ring-nexus-green-500',
      error: 'border-nexus-red-500 focus-visible:ring-nexus-red-500',
      warning: 'border-yellow-500 focus-visible:ring-yellow-500',
    },
    inputSize: {
      default: 'h-10 px-3 py-2',
      sm: 'h-9 px-3 py-2 text-sm',
      lg: 'h-11 px-4 py-2 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    inputSize: 'default',
  },
});

export interface NexusInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof nexusInputVariants> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const NexusInput = React.forwardRef<HTMLInputElement, NexusInputProps>(
  (
    {
      className,
      variant,
      inputSize,
      label,
      helperText,
      errorText,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const hasError = !!errorText;
    const finalVariant = hasError ? 'error' : variant;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <Input
            className={cn(
              nexusInputVariants({
                variant: finalVariant,
                inputSize,
                className,
              }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {errorText && (
          <p className="text-sm text-nexus-red-600 dark:text-nexus-red-400">
            {errorText}
          </p>
        )}
        {!errorText && helperText && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
NexusInput.displayName = 'NexusInput';

export { NexusInput, nexusInputVariants };

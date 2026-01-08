import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default' | 'destructive' | 'link' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'default';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  asChild?: boolean;
}

// shadcn/ui compatibility: buttonVariants export
export const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-[#F2D12E] text-black hover:border-yellow-500 focus:ring-yellow-400',
        secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        default: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400',
        outline: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400 border-transparent',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        link: 'text-gray-700 hover:text-gray-900 underline-offset-4 hover:underline border-transparent bg-transparent shadow-none focus:ring-0 p-0 h-auto rounded-none',
        icon: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400 border-transparent bg-transparent shadow-none p-2 rounded-none'
      },
      size: {
        sm: 'px-3 py-1.5 text-sm space-x-1 min-h-[32px]',
        md: 'px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base space-x-1 lg:space-x-2 min-h-[36px] sm:min-h-[40px]',
        lg: 'px-4 py-2 sm:px-5 sm:py-2.5 lg:px-7 lg:py-3.5 text-sm sm:text-base lg:text-lg xl:text-xl space-x-1 lg:space-x-2 min-h-[36px] sm:min-h-[40px] lg:min-h-[52px]',
        xl: 'px-8 py-4 text-lg lg:text-xl xl:text-2xl space-x-2 min-h-[56px]',
        icon: 'h-10 w-10 p-0',
        default: 'px-4 py-2 text-sm min-h-[40px]'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isMinimalVariant = variant === 'link' || variant === 'icon';

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          !isMinimalVariant && 'rounded-full',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Export both default and named for compatibility
export { Button };
export default Button;

import React from 'react';
import { cn } from '../../lib/utils';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

/**
 * Bouton standardisé pour l'interface admin
 * Utilise rgb(20, 104, 154) comme couleur principale
 * Style simple et cohérent comme le sidebar
 */
export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-[rgb(20,104,154)] text-white hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)]',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-[rgb(20,104,154)] hover:text-white',
    outline: 'border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white',
    ghost: 'text-gray-700 hover:bg-[rgb(20,104,154)] hover:text-white',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    default: 'bg-[rgb(20,104,154)] text-white hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)]'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    icon: 'p-2'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

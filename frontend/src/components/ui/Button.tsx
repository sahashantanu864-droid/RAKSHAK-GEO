import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-link focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants: Record<string, string> = {
    primary: 'bg-primary text-on-primary hover:opacity-90',
    secondary:
      'bg-canvas-elevated text-ink border border-hairline hover:bg-hairline-soft',
    ghost: 'bg-transparent text-ink hover:bg-hairline-soft',
  };

  // Use inline style for pill radius to avoid Tailwind v4 name-collision with built-in rounded-sm
  const sizeStyles: Record<string, { cls: string; radius: string }> = {
    md: { cls: 'h-8 px-3 text-sm', radius: '6px' },
    lg: { cls: 'h-11 px-6 text-base', radius: '100px' },
  };

  const { cls, radius } = sizeStyles[size];

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${cls} ${className}`}
      style={{ borderRadius: radius }}
      {...props}
    >
      {children}
    </button>
  );
};

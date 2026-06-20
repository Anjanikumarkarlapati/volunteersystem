import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../LoadingSpinner.jsx';

const variants = {
  primary:
    'bg-[#1b1c1a] text-white hover:bg-[#1b1c1a]/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-all duration-300 shadow-sm',
  secondary: 'border border-line bg-white-card text-text hover:bg-soft-card-2 transition-all',
  danger: 'bg-[#f43f5e] text-white hover:bg-[#e11d48] transition-all',
  ghost: 'text-muted hover:bg-soft-card-2 hover:text-text',
  subtle: 'bg-soft-card-2 text-text hover:bg-soft-card border border-line/20',
};

const sizes = {
  xs: 'min-h-8 px-4 text-[11px] font-bold uppercase tracking-wider',
  sm: 'min-h-9 px-5 text-xs font-bold uppercase tracking-wider',
  md: 'min-h-10 px-6 text-sm font-bold',
  lg: 'min-h-12 px-8 text-base font-bold',
};

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      loading,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

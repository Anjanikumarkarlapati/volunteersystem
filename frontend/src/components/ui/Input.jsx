import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, className = '', ...props }, ref) => {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 ${Icon ? 'pl-10' : ''} ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 resize-none ${error ? 'border-rose-300' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, icon: Icon, className = '', children, ...props }) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <select
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-slate-600 ${Icon ? 'pl-10' : ''} ${error ? 'border-rose-300' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, id }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input type="checkbox" id={id} className="sr-only" checked={checked} onChange={onChange} />
        <div
          className={`h-6 w-10 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
        />
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}
    </label>
  );
}

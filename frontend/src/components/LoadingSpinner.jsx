export default function LoadingSpinner({ size = 'md', text }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="relative">
        <div
          className={`${sizes[size]} animate-spin rounded-full border-2 border-primary-200 dark:border-primary-900`}
        />
        <div
          className={`absolute inset-0 ${sizes[size]} animate-spin rounded-full border-2 border-transparent border-t-primary-600 dark:border-t-primary-400`}
          style={{ animationDuration: '0.7s' }}
        />
      </div>
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}

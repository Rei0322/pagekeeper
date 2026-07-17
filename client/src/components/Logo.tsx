export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-label="PageKeeper logo"
      data-testid="img-logo"
    >
      <path
        d="M20 8c-3.5-2.5-8-3-12-1.5v22c4-1.5 8.5-1 12 1.5V8Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M20 8c3.5-2.5 8-3 12-1.5v22c-4-1.5-8.5-1-12 1.5V8Z"
        fill="currentColor"
      />
      <path d="M20 8v22" stroke="hsl(var(--background))" strokeWidth="1.2" />
    </svg>
  );
}

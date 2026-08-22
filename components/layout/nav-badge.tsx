export function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-danger-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}

import { cn } from '../lib/utils';

type BrandMarkProps = {
  className?: string;
  letterClassName?: string;
};

export function BrandMark({ className, letterClassName }: BrandMarkProps) {
  return (
    <div
      className={cn(
        'bg-amber-400 rounded-full flex items-center justify-center text-indigo-900 font-black shadow-lg border-2 border-white/20',
        className,
      )}
      aria-hidden
    >
      <span className={cn('leading-none select-none', letterClassName)}>B</span>
    </div>
  );
}

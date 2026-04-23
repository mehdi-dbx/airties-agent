import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type SuggestionProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = 'outline',
  size = 'sm',
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn('cursor-pointer rounded-lg border-border px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-accent hover:border-[#D0D0EE] hover:text-[var(--primary)] transition-colors', className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};

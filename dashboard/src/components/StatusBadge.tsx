import { STATUS_COLORS, STATUS_LABELS, type OrderStatus } from '@/lib/types';
import clsx from 'clsx';

interface Props {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      STATUS_COLORS[status],
      className
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
}

import { RentPeriodStatus } from '@/types/rent';

export function getRentPeriodStatus(
  dueDate: string,
  amountDue: number,
  amountPaid: number
): RentPeriodStatus {
  const remaining = amountDue - amountPaid;
  const today = new Date().toISOString().split('T')[0];

  if (remaining <= 0) {
    return 'paid';
  }

  if (dueDate < today) {
    return 'overdue';
  }

  if (amountPaid > 0) {
    return 'partial';
  }

  return 'due';
}

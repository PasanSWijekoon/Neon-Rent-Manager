import { RentPeriodStatus } from '@/types/rent';

export function getRentPeriodStatus(
  dueDate: string,
  amountDue: number,
  amountPaid: number
): RentPeriodStatus {
  const remaining = amountDue - amountPaid;

  if (remaining <= 0) {
    return 'paid';
  }

  if (amountPaid > 0) {
    return 'partial';
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  
  const [dueYear, dueMonth, dueDay] = dueDate.split('-').map(Number);
  const due = new Date(Date.UTC(dueYear, dueMonth - 1, dueDay));

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  }

  if (diffDays === 0) {
    return 'due';
  }

  return 'upcoming';
}

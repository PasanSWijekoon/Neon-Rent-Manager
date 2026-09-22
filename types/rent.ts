export type RentPeriodStatus = 'upcoming' | 'due' | 'partial' | 'paid' | 'overdue';

export interface RentPeriod {
  id: string;
  contractId: string;
  periodYear: number;
  periodMonth: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: RentPeriodStatus;
  createdAt: string;
  updatedAt: string;
}

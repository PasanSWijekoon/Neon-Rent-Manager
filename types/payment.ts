export type PaymentMethod = 'cash' | 'bank_transfer' | 'digital_payment' | 'other';

export interface Payment {
  id: string;
  rentPeriodId: string;
  contractId: string;
  tenantId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes: string | null;
  createdAt: string;
}

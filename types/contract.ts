export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';

export interface Contract {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  dueDay: number;
  deposit: number;
  status: ContractStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

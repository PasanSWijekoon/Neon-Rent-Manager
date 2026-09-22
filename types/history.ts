export type HistoryEventType = 
  | 'payment'
  | 'contract_new'
  | 'contract_ended'
  | 'tenant_added'
  | 'tenant_archived'
  | 'unit_added';

export interface HistoryItem {
  id: string; // we can synthesize a unique ID like `${eventType}-${entityId}`
  eventType: HistoryEventType;
  eventLabel: string;
  eventDate: string;
  entityId: string;
  unitName: string | null;
  tenantName: string | null;
  amount: number | null;
  detail: string | null;
  extraInfo: string | null;
}

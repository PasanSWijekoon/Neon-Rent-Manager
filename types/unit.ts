export type UnitType = 'hostel_room' | 'shop';
export type UnitStatus = 'vacant' | 'occupied';

export interface Unit {
  id: string;
  propertyId: string;
  type: UnitType;
  name: string;
  status: UnitStatus;
  currentContractId: string | null;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

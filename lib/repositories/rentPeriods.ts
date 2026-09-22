import * as SQLite from 'expo-sqlite';
import { RentPeriod } from '@/types/rent';
import { Contract } from '@/types/contract';
import { Tenant } from '@/types/tenant';
import { Unit } from '@/types/unit';
import { getRentPeriodStatus } from '../rentHelpers';

export async function createRentPeriod(db: SQLite.SQLiteDatabase, rentPeriod: RentPeriod): Promise<void> {
  await db.runAsync(
    'INSERT INTO rent_periods (id, contractId, periodYear, periodMonth, amountDue, amountPaid, dueDate, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [rentPeriod.id, rentPeriod.contractId, rentPeriod.periodYear, rentPeriod.periodMonth, rentPeriod.amountDue, rentPeriod.amountPaid, rentPeriod.dueDate, rentPeriod.status, rentPeriod.createdAt, rentPeriod.updatedAt]
  );
}

export async function getRentPeriodsForContract(db: SQLite.SQLiteDatabase, contractId: string): Promise<RentPeriod[]> {
  return await db.getAllAsync<RentPeriod>(
    'SELECT * FROM rent_periods WHERE contractId = ? ORDER BY periodYear DESC, periodMonth DESC', 
    [contractId]
  );
}

export async function getRentPeriodById(db: SQLite.SQLiteDatabase, id: string): Promise<RentPeriod | null> {
  return await db.getFirstAsync<RentPeriod>('SELECT * FROM rent_periods WHERE id = ?', [id]);
}

export async function updateRentPeriod(db: SQLite.SQLiteDatabase, id: string, data: Partial<RentPeriod>): Promise<void> {
  const updates: string[] = [];
  const args: any[] = [];
  
  if (data.amountPaid !== undefined) { updates.push('amountPaid = ?'); args.push(data.amountPaid); }
  if (data.status !== undefined) { updates.push('status = ?'); args.push(data.status); }
  if (data.updatedAt !== undefined) { updates.push('updatedAt = ?'); args.push(data.updatedAt); }
  
  if (updates.length === 0) return;
  
  args.push(id);
  await db.runAsync(`UPDATE rent_periods SET ${updates.join(', ')} WHERE id = ?`, args);
}

export async function generateRentPeriodsForContract(db: SQLite.SQLiteDatabase, contract: Contract): Promise<void> {
  const start = new Date(contract.startDate);
  const endLimit = new Date();
  endLimit.setMonth(endLimit.getMonth() + 1); 
  
  let end = endLimit;
  if (contract.endDate) {
    const contractEnd = new Date(contract.endDate);
    if (contractEnd < endLimit) {
      end = contractEnd;
    }
  }

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;

    const exists = await db.getFirstAsync<{id: string}>(
      'SELECT id FROM rent_periods WHERE contractId = ? AND periodYear = ? AND periodMonth = ?',
      [contract.id, year, month]
    );

    if (!exists) {
      const dueDay = contract.dueDay;
      // Handle leap years and short months properly
      // Using just Date(year, month - 1, dueDay) might push into next month if day > max days.
      // E.g., Feb 30 becomes Mar 2 or 1.
      // If contract dueDay is 31 and month has 30, it becomes next month 1st.
      // A safe fallback is to clamp dueDay.
      const maxDays = new Date(year, month, 0).getDate();
      const safeDueDay = dueDay > maxDays ? maxDays : dueDay;
      const dueDateObj = new Date(year, month - 1, safeDueDay);
      // Manually pad to YYYY-MM-DD
      const yyyy = dueDateObj.getFullYear();
      const mm = String(dueDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dueDateObj.getDate()).padStart(2, '0');
      const dueDate = `${yyyy}-${mm}-${dd}`;
      
      const status = getRentPeriodStatus(dueDate, contract.monthlyRent, 0);
      const now = new Date().toISOString();
      const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      const newPeriod: RentPeriod = {
        id: newId,
        contractId: contract.id,
        periodYear: year,
        periodMonth: month,
        amountDue: contract.monthlyRent,
        amountPaid: 0,
        dueDate,
        status,
        createdAt: now,
        updatedAt: now
      };
      
      await createRentPeriod(db, newPeriod);
    }

    current.setMonth(current.getMonth() + 1);
  }
}

export type RentPeriodWithDetails = RentPeriod & { contract: Contract, tenant: Tenant, unit: Unit };

export async function getRentPeriodsWithDetails(db: SQLite.SQLiteDatabase): Promise<RentPeriodWithDetails[]> {
  const rows = await db.getAllAsync<any>(`
    SELECT r.*, 
           c.id as c_id, c.unitId as c_unitId, c.tenantId as c_tenantId, c.startDate as c_startDate, c.endDate as c_endDate, c.monthlyRent as c_monthlyRent, c.dueDay as c_dueDay, c.deposit as c_deposit, c.status as c_status, c.notes as c_notes, c.createdAt as c_createdAt, c.updatedAt as c_updatedAt,
           t.id as t_id, t.name as t_name, t.phone as t_phone, t.address as t_address, t.notes as t_notes, t.createdAt as t_createdAt, t.updatedAt as t_updatedAt, t.archivedAt as t_archivedAt,
           u.id as u_id, u.propertyId as u_propertyId, u.type as u_type, u.name as u_name, u.status as u_status, u.currentContractId as u_currentContractId, u.createdAt as u_createdAt, u.updatedAt as u_updatedAt
    FROM rent_periods r
    JOIN contracts c ON r.contractId = c.id
    JOIN tenants t ON c.tenantId = t.id
    JOIN units u ON c.unitId = u.id
    ORDER BY r.periodYear DESC, r.periodMonth DESC, r.dueDate DESC
  `);
  
  return rows.map(row => {
    const { 
      c_id, c_unitId, c_tenantId, c_startDate, c_endDate, c_monthlyRent, c_dueDay, c_deposit, c_status, c_notes, c_createdAt, c_updatedAt,
      t_id, t_name, t_phone, t_address, t_notes, t_createdAt, t_updatedAt, t_archivedAt,
      u_id, u_propertyId, u_type, u_name, u_status, u_currentContractId, u_createdAt, u_updatedAt,
      ...rentPeriod 
    } = row;

    const contract: Contract = {
      id: c_id, unitId: c_unitId, tenantId: c_tenantId, startDate: c_startDate, endDate: c_endDate, monthlyRent: c_monthlyRent, dueDay: c_dueDay, deposit: c_deposit, status: c_status, notes: c_notes, createdAt: c_createdAt, updatedAt: c_updatedAt
    };
    const tenant: Tenant = {
      id: t_id, name: t_name, phone: t_phone, address: t_address, notes: t_notes, createdAt: t_createdAt, updatedAt: t_updatedAt, archivedAt: t_archivedAt
    };
    const unit: Unit = {
      id: u_id, propertyId: u_propertyId, type: u_type, name: u_name, status: u_status, currentContractId: u_currentContractId, createdAt: u_createdAt, updatedAt: u_updatedAt
    };
    
    return { ...rentPeriod, contract, tenant, unit };
  });
}

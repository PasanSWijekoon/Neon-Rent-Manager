import * as SQLite from 'expo-sqlite';
import { HistoryItem } from '@/types/history';

export type HistoryCategory = 'All' | 'Contracts' | 'Payments' | 'Tenants' | 'Units';

export interface GetHistoryOptions {
  db: SQLite.SQLiteDatabase;
  startDate: string;
  endDate: string;
  category: HistoryCategory;
  limit: number;
  offset: number;
}

export async function getHistoryEvents({
  db,
  startDate,
  endDate,
  category,
  limit,
  offset,
}: GetHistoryOptions): Promise<HistoryItem[]> {
  const queries: string[] = [];
  const args: any[] = [];

  const addQuery = (sql: string, dateCol: string) => {
    queries.push(`
      ${sql}
      ${sql.includes('WHERE') ? 'AND' : 'WHERE'} ${dateCol} >= ? AND ${dateCol} < ?
    `);
    args.push(startDate, endDate);
  };

  if (category === 'All' || category === 'Payments') {
    addQuery(`
      SELECT 
        'payment-' || p.id AS id,
        'payment' AS eventType,
        'PAYMENT RECEIVED' AS eventLabel,
        p.paymentDate AS eventDate,
        p.id AS entityId,
        u.name AS unitName,
        t.name AS tenantName,
        p.amount AS amount,
        p.method AS detail,
        p.rentPeriodId as extraInfo
      FROM payments p
      JOIN tenants t ON p.tenantId = t.id
      JOIN contracts c ON p.contractId = c.id
      JOIN units u ON c.unitId = u.id
    `, 'p.paymentDate');
  }

  if (category === 'All' || category === 'Contracts') {
    addQuery(`
      SELECT
        'contract_new-' || c.id AS id,
        'contract_new' AS eventType,
        'NEW CONTRACT' AS eventLabel,
        c.createdAt AS eventDate,
        c.id AS entityId,
        u.name AS unitName,
        t.name AS tenantName,
        c.monthlyRent AS amount,
        c.startDate AS detail,
        NULL as extraInfo
      FROM contracts c
      JOIN tenants t ON c.tenantId = t.id
      JOIN units u ON c.unitId = u.id
    `, 'c.createdAt');

    addQuery(`
      SELECT
        'contract_ended-' || c.id AS id,
        'contract_ended' AS eventType,
        CASE WHEN c.status = 'expired' THEN 'CONTRACT EXPIRED' ELSE 'CONTRACT ENDED' END AS eventLabel,
        c.updatedAt AS eventDate,
        c.id AS entityId,
        u.name AS unitName,
        t.name AS tenantName,
        c.monthlyRent AS amount,
        c.endDate AS detail,
        NULL as extraInfo
      FROM contracts c
      JOIN tenants t ON c.tenantId = t.id
      JOIN units u ON c.unitId = u.id
      WHERE c.status IN ('expired', 'terminated')
    `, 'c.updatedAt');
  }

  if (category === 'All' || category === 'Tenants') {
    addQuery(`
      SELECT
        'tenant_added-' || t.id AS id,
        'tenant_added' AS eventType,
        'TENANT ADDED' AS eventLabel,
        t.createdAt AS eventDate,
        t.id AS entityId,
        NULL AS unitName,
        t.name AS tenantName,
        NULL AS amount,
        t.phone AS detail,
        NULL as extraInfo
      FROM tenants t
    `, 't.createdAt');

    addQuery(`
      SELECT
        'tenant_archived-' || t.id AS id,
        'tenant_archived' AS eventType,
        'TENANT ARCHIVED' AS eventLabel,
        t.archivedAt AS eventDate,
        t.id AS entityId,
        NULL AS unitName,
        t.name AS tenantName,
        NULL AS amount,
        NULL AS detail,
        NULL as extraInfo
      FROM tenants t
      WHERE t.archivedAt IS NOT NULL
    `, 't.archivedAt');
  }

  if (category === 'All' || category === 'Units') {
    addQuery(`
      SELECT
        'unit_added-' || u.id AS id,
        'unit_added' AS eventType,
        CASE WHEN u.type = 'shop' THEN 'SHOP ADDED' ELSE 'HOSTEL ROOM ADDED' END AS eventLabel,
        u.createdAt AS eventDate,
        u.id AS entityId,
        u.name AS unitName,
        NULL AS tenantName,
        NULL AS amount,
        NULL AS detail,
        NULL as extraInfo
      FROM units u
    `, 'u.createdAt');
  }

  if (queries.length === 0) return [];

  const finalQuery = `
    ${queries.join(' UNION ALL ')}
    ORDER BY eventDate DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  args.push(limit, offset);

  return await db.getAllAsync<HistoryItem>(finalQuery, args);
}

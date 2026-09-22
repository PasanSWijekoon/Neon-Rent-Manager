import { SQLiteDatabase } from 'expo-sqlite';
import { getTenant } from '@/lib/repositories/tenants';
import { getUnitById } from '@/lib/repositories/units';
import { RentPeriod } from '@/types/rent';

const getMonthName = (month: number) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
};

export async function generatePaymentReminder(db: SQLiteDatabase, tenantId: string): Promise<string | null> {
  try {
    const tenant = await getTenant(db, tenantId);
    if (!tenant) return null;

    const outstandingPeriods = await db.getAllAsync<RentPeriod & { unitName: string }>(`
      SELECT rp.*, u.name as unitName
      FROM rent_periods rp
      JOIN contracts c ON rp.contractId = c.id
      JOIN units u ON c.unitId = u.id
      WHERE c.tenantId = ? AND rp.status IN ('due', 'overdue', 'partial')
      ORDER BY u.name ASC, rp.periodYear ASC, rp.periodMonth ASC
    `, [tenantId]);

    if (outstandingPeriods.length === 0) {
      return null;
    }

    const uniqueUnits = Array.from(new Set(outstandingPeriods.map(p => p.unitName)));
    let totalDue = 0;
    let message = '';

    if (uniqueUnits.length === 1) {
      // Formatting for a single contract / unit
      message = `Hello ${tenant.name.split(' ')[0]},\n\nThis is a friendly reminder regarding your rent for ${uniqueUnits[0]}.\n\nCurrent Status:\n`;
      
      outstandingPeriods.forEach(period => {
        const balance = period.amountDue - period.amountPaid;
        totalDue += balance;
        const monthStr = `${getMonthName(period.periodMonth)} ${period.periodYear}`;
        const statusStr = period.status.charAt(0).toUpperCase() + period.status.slice(1);
        message += `- ${monthStr} (${statusStr}): LKR ${balance.toLocaleString()} remaining\n`;
      });
    } else {
      // Formatting for a tenant with multiple contracts / units
      message = `Hello ${tenant.name.split(' ')[0]},\n\nThis is a friendly reminder regarding your pending rent.\n\nCurrent Status:\n`;
      
      uniqueUnits.forEach(unit => {
        message += `\n[${unit}]\n`;
        const unitPeriods = outstandingPeriods.filter(p => p.unitName === unit);
        
        unitPeriods.forEach(period => {
          const balance = period.amountDue - period.amountPaid;
          totalDue += balance;
          const monthStr = `${getMonthName(period.periodMonth)} ${period.periodYear}`;
          const statusStr = period.status.charAt(0).toUpperCase() + period.status.slice(1);
          message += `- ${monthStr} (${statusStr}): LKR ${balance.toLocaleString()} remaining\n`;
        });
      });
      message += `\n`;
    }

    message += `------------------------\n`;
    message += `Total Amount Due: LKR ${totalDue.toLocaleString()}\n\n`;
    message += `Please arrange payment at your earliest convenience. Thank you!\n- Neon Rent Manager`;

    return message;
  } catch (error) {
    console.error("Error generating reminder:", error);
    return null;
  }
}

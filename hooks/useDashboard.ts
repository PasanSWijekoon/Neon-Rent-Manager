import { useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { RentPeriod } from '@/types/rent';

export type DashboardRentPeriod = RentPeriod & { tenantName: string; unitName: string };
export type DashboardPayment = {
  id: string;
  rentPeriodId: string;
  amount: number;
  paymentDate: string;
  method: string;
  tenantName: string;
  unitName: string;
};

export function useDashboard(year: number, month: number) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [totalCollected, setTotalCollected] = useState(0);
  const [expectedRent, setExpectedRent] = useState(0);
  const [outstandingRent, setOutstandingRent] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [collectionProgress, setCollectionProgress] = useState(0);
  const [monthOverMonthChange, setMonthOverMonthChange] = useState(0);
  
  const [thisMonthDue, setThisMonthDue] = useState<DashboardRentPeriod[]>([]);
  const [recentPayments, setRecentPayments] = useState<DashboardPayment[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch rent periods for current year/month
      const rentPeriods = await db.getAllAsync<RentPeriod>(
        'SELECT * FROM rent_periods WHERE periodYear = ? AND periodMonth = ?',
        [year, month]
      );
      
      let collected = 0;
      let expected = 0;
      let paidC = 0;
      let dueC = 0;
      let overdueC = 0;
      
      for (const rp of rentPeriods) {
        collected += rp.amountPaid;
        expected += rp.amountDue;
        
        if (rp.status === 'paid') paidC++;
        else if (rp.status === 'due' || rp.status === 'upcoming' || rp.status === 'partial') dueC++;
      }
      
      // Get all-time overdue count
      const allOverdue = await db.getFirstAsync<{count: number}>(
        'SELECT COUNT(*) as count FROM rent_periods WHERE status = ?',
        ['overdue']
      );
      if (allOverdue) overdueC = allOverdue.count;
      
      setTotalCollected(collected);
      setExpectedRent(expected);
      const outstanding = expected - collected;
      setOutstandingRent(outstanding > 0 ? outstanding : 0);
      setPaidCount(paidC);
      setDueCount(dueC);
      setOverdueCount(overdueC);
      
      const progress = expected > 0 ? (collected / expected) * 100 : 0;
      setCollectionProgress(progress);

      // 2. Calculate Month-over-Month change
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      
      const prevRentPeriods = await db.getAllAsync<RentPeriod>(
        'SELECT amountPaid FROM rent_periods WHERE periodYear = ? AND periodMonth = ?',
        [prevYear, prevMonth]
      );
      
      const prevCollected = prevRentPeriods.reduce((sum, rp) => sum + rp.amountPaid, 0);
      
      if (prevCollected > 0) {
        const change = ((collected - prevCollected) / prevCollected) * 100;
        setMonthOverMonthChange(change);
      } else if (collected > 0) {
        setMonthOverMonthChange(100); // 100% increase if prev was 0 but now we have something
      } else {
        setMonthOverMonthChange(0);
      }

      // 3. This Month's Due & Overdue
      const pendingList = await db.getAllAsync<DashboardRentPeriod>(`
        SELECT r.*, t.name as tenantName, u.name as unitName
        FROM rent_periods r
        JOIN contracts c ON r.contractId = c.id
        JOIN tenants t ON c.tenantId = t.id
        JOIN units u ON c.unitId = u.id
        WHERE (r.periodYear = ? AND r.periodMonth = ? AND r.status != 'paid') 
           OR (r.status = 'overdue')
        ORDER BY r.dueDate ASC
      `, [year, month]);
      
      setThisMonthDue(pendingList);

      // 4. Recent Payments
      const recent = await db.getAllAsync<DashboardPayment>(`
        SELECT p.id, p.rentPeriodId, p.amount, p.paymentDate, p.method, t.name as tenantName, u.name as unitName
        FROM payments p
        JOIN tenants t ON p.tenantId = t.id
        JOIN contracts c ON p.contractId = c.id
        JOIN units u ON c.unitId = u.id
        ORDER BY p.paymentDate DESC, p.createdAt DESC
        LIMIT 5
      `);
      setRecentPayments(recent);
      
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, [db, year, month]);

  return {
    loading,
    totalCollected,
    expectedRent,
    outstandingRent,
    paidCount,
    dueCount,
    overdueCount,
    collectionProgress,
    monthOverMonthChange,
    thisMonthDue,
    recentPayments,
    refresh: loadData
  };
}

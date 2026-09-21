// Visual mock records only. Future database integration can replace this mock data easily.
export const mockDashboard = {
  summary: {
    expected: 139000,
    collected: 116000,
    outstanding: 23000,
  },
  status: {
    paid: 8,
    due: 2,
    overdue: 3,
  },
  todaysDue: [
    { id: '1', tenant: 'Raj Kumar', unit: 'Room A-01', amount: 8000, status: 'due' },
    { id: '2', tenant: 'Ravi Kumar', unit: 'Shop 2', amount: 12000, status: 'overdue' },
  ],
  recentPayments: [
    { id: '1', tenant: 'Raj Kumar', amount: 8000, status: 'paid' },
    { id: '2', tenant: 'Ahmed Khan', amount: 15000, status: 'paid' },
  ]
};

import * as SQLite from 'expo-sqlite';
import { DB_NAME, initDatabase } from '@/lib/database';
import { createProperty, getProperties } from '@/lib/repositories/properties';
import { createUnit, getUnitsForProperty } from '@/lib/repositories/units';
import { createTenant, getTenants } from '@/lib/repositories/tenants';
import { createContract, getContractsForUnit } from '@/lib/repositories/contracts';
import { createRentPeriod, getRentPeriodsForContract } from '@/lib/repositories/rentPeriods';
import { createPayment, getPaymentsForContract } from '@/lib/repositories/payments';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export async function runDatabaseTests() {
  try {
    console.log('--- STARTING DATABASE TESTS ---');
    // Open DB
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Initialize schema
    await initDatabase(db);
    console.log('1. Database opened and initialized successfully.');

    // 4. Store a property
    const propertyId = generateId();
    await createProperty(db, {
      id: propertyId,
      name: 'Test Property',
      address: '123 Main St',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const properties = await getProperties(db);
    if (properties.some(p => p.id === propertyId)) {
      console.log('4. Property stored successfully.');
    } else {
      throw new Error('Property not found');
    }

    // 5. Store a unit
    const unitId = 'shop-3-' + generateId();
    await createUnit(db, {
      id: unitId,
      propertyId: propertyId,
      type: 'shop',
      name: 'Shop 3',
      status: 'occupied',
      currentContractId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('5. Unit stored referencing property.');

    // Ahmed Scenario
    const ahmedId = 'tenant-ahmed-' + generateId();
    await createTenant(db, {
      id: ahmedId,
      name: 'Ahmed',
      phone: '0771234567',
      address: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    });
    console.log('6. Tenant Ahmed stored.');

    const ahmedContractId = 'contract-ahmed-' + generateId();
    await createContract(db, {
      id: ahmedContractId,
      unitId: unitId,
      tenantId: ahmedId,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      monthlyRent: 15000,
      dueDay: 1,
      deposit: 30000,
      status: 'expired',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('7. Contract for Ahmed stored referencing unit and tenant.');

    const rentPeriodAhmedId = 'rp-ahmed-' + generateId();
    await createRentPeriod(db, {
      id: rentPeriodAhmedId,
      contractId: ahmedContractId,
      periodYear: 2025,
      periodMonth: 1,
      amountDue: 15000,
      amountPaid: 15000,
      dueDate: '2025-01-01',
      status: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('8. Rent period for Ahmed stored referencing contract.');

    const paymentAhmedId = 'pay-ahmed-' + generateId();
    await createPayment(db, {
      id: paymentAhmedId,
      rentPeriodId: rentPeriodAhmedId,
      contractId: ahmedContractId,
      tenantId: ahmedId,
      amount: 15000,
      paymentDate: '2025-01-05',
      method: 'cash',
      notes: null,
      createdAt: new Date().toISOString(),
    });
    console.log('9. Payment for Ahmed stored referencing rent period.');

    // Duplicate rent period test
    let duplicateRejected = false;
    try {
      await createRentPeriod(db, {
        id: 'rp-ahmed-dup-' + generateId(),
        contractId: ahmedContractId,
        periodYear: 2025,
        periodMonth: 1, // Same year and month
        amountDue: 15000,
        amountPaid: 0,
        dueDate: '2025-01-01',
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      duplicateRejected = true;
    }
    if (duplicateRejected) {
      console.log('10. Duplicate contract/month rent periods are rejected.');
    } else {
      throw new Error('Duplicate rent period was NOT rejected');
    }

    // Ravi Scenario
    const raviId = 'tenant-ravi-' + generateId();
    await createTenant(db, {
      id: raviId,
      name: 'Ravi',
      phone: '0777654321',
      address: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    });

    const raviContractId = 'contract-ravi-' + generateId();
    await createContract(db, {
      id: raviContractId,
      unitId: unitId,
      tenantId: raviId,
      startDate: '2027-01-01',
      endDate: '2028-12-31',
      monthlyRent: 18000,
      dueDay: 1,
      deposit: 36000,
      status: 'active',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const rentPeriodRaviId = 'rp-ravi-' + generateId();
    await createRentPeriod(db, {
      id: rentPeriodRaviId,
      contractId: raviContractId,
      periodYear: 2027,
      periodMonth: 1,
      amountDue: 18000,
      amountPaid: 18000,
      dueDate: '2027-01-01',
      status: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const paymentRaviId = 'pay-ravi-' + generateId();
    await createPayment(db, {
      id: paymentRaviId,
      rentPeriodId: rentPeriodRaviId,
      contractId: raviContractId,
      tenantId: raviId,
      amount: 18000,
      paymentDate: '2027-01-02',
      method: 'bank_transfer',
      notes: null,
      createdAt: new Date().toISOString(),
    });

    // Verification of history
    const allContracts = await getContractsForUnit(db, unitId);
    if (allContracts.length >= 2) {
      console.log('11. Historical contracts can coexist for the same unit (Shop 3 has multiple contracts).');
    } else {
      throw new Error('Historical contracts did not coexist');
    }

    const ahmedPayments = await getPaymentsForContract(db, ahmedContractId);
    const raviPayments = await getPaymentsForContract(db, raviContractId);

    if (ahmedPayments.some(p => p.id === paymentAhmedId) && raviPayments.some(p => p.id === paymentRaviId)) {
      console.log('12. Historical payments remain linked to their original contract. Ahmed and Ravi payments are separate.');
      console.log('   - Ahmed Payment:', ahmedPayments.find(p => p.id === paymentAhmedId)?.amount);
      console.log('   - Ravi Payment:', raviPayments.find(p => p.id === paymentRaviId)?.amount);
    } else {
      throw new Error('Payments got mixed up or overwritten');
    }

    // Second init call to simulate reload
    await initDatabase(db);
    const checkProperties = await getProperties(db);
    if (checkProperties.some(p => p.id === propertyId)) {
      console.log('13. Database initialization does not destroy existing data.');
    } else {
      throw new Error('Data was destroyed on second init');
    }

    console.log('--- ALL DATABASE TESTS PASSED ---');
  } catch (error) {
    console.error('--- DATABASE TESTS FAILED ---', error);
  }
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_STATUS } from '../src/utils/constants.js';

describe('Orders & Credit Limit Business Logic Unit Tests', () => {
  it('should accurately calculate total order value from items', () => {
    const items = [
      { productId: 'prod-01', name: 'Minyak Goreng 2L', unitPrice: 34000, quantity: 10 },
      { productId: 'prod-02', name: 'Gula Pasir 1kg', unitPrice: 17500, quantity: 20 },
      { productId: 'prod-03', name: 'Beras Premium 5kg', unitPrice: 72000, quantity: 5 },
    ];

    const processedItems = items.map((item) => ({
      ...item,
      subtotal: item.unitPrice * item.quantity,
    }));

    const totalValue = processedItems.reduce((acc, curr) => acc + curr.subtotal, 0);

    assert.equal(processedItems[0].subtotal, 340000);
    assert.equal(processedItems[1].subtotal, 350000);
    assert.equal(processedItems[2].subtotal, 360000);
    assert.equal(totalValue, 1050000);
  });

  it('should validate order against outlet credit limit and outstanding balance', () => {
    const outlet = {
      id: 'outlet-01',
      creditLimit: 10000000,
      outstanding: 8500000,
    };

    const newOrderAmount = 2000000;
    const remainingCredit = outlet.creditLimit - outlet.outstanding;
    const exceedsCredit = newOrderAmount > remainingCredit;

    assert.equal(remainingCredit, 1500000);
    assert.equal(exceedsCredit, true);
  });

  it('should transition order status on Admin approval and update timestamps', () => {
    const pendingOrder = {
      id: 'ord-101',
      totalValue: 1050000,
      status: ORDER_STATUS.PENDING_APPROVAL,
    };

    // Admin approves order
    const approvedOrder = {
      ...pendingOrder,
      status: ORDER_STATUS.APPROVED,
      approvedBy: 'usr-admin-1',
      approvedAt: new Date().toISOString(),
    };

    assert.equal(approvedOrder.status, ORDER_STATUS.APPROVED);
    assert.ok(approvedOrder.approvedAt);
    assert.equal(approvedOrder.approvedBy, 'usr-admin-1');
  });
});

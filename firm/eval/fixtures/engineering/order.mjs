// Deliberately flawed evaluation fixture. Not production code.
export function createOrder({sku, quantity, stock, unitPrice}) {
  if (!sku) throw new Error('sku required');
  if (quantity < 0) throw new Error('quantity invalid');
  // Defects: zero and noninteger quantities accepted; stock not enforced.
  return {sku, quantity, total:quantity*unitPrice, stockAfter:stock-quantity, status:'confirmed'};
}
export const helperNames=['normalize','build','validate','format'];

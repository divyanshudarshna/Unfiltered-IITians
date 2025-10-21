// Debug utility for transaction filtering issues
console.log("=== Transaction Debug Test ===");

// Test data that mimics what might be coming from the API
const testTransactions = [
  {
    id: "1",
    actualAmountPaid: 199, // Bundle transaction
    status: "success",
    type: "bundle"
  },
  {
    id: "2", 
    actualAmountPaid: 0, // Individual mock from bundle (should be filtered)
    status: "success",
    type: "mock"
  },
  {
    id: "3",
    actualAmountPaid: 59, // Individual mock purchase
    status: "success", 
    type: "mock"
  },
  {
    id: "4",
    actualAmountPaid: 100, // Failed transaction
    status: "pending",
    type: "course"
  },
  {
    id: "5",
    actualAmountPaid: 0, // Another bundle individual mock (should be filtered)
    status: "success",
    type: "mock"
  }
];

console.log("Original transactions:", testTransactions.length);

// Frontend filtering logic
const filteredTransactions = testTransactions.filter(t => t.actualAmountPaid > 0);
console.log("After filtering actualAmountPaid > 0:", filteredTransactions.length);
console.log("Filtered transactions:", filteredTransactions.map(t => ({ id: t.id, amount: t.actualAmountPaid, type: t.type })));

// Selectable transactions (non-success with amount > 0)
const selectableTransactions = filteredTransactions.filter(t => t.status !== 'success');
console.log("Selectable transactions (non-success):", selectableTransactions.length);
console.log("Selectable:", selectableTransactions.map(t => ({ id: t.id, amount: t.actualAmountPaid, status: t.status })));

console.log("\n=== Expected Behavior ===");
console.log("✅ Should show 3 transactions: bundle(199), individual mock(59), pending course(100)");
console.log("✅ Should hide 2 transactions: both individual mocks with amount 0");
console.log("✅ Should allow selection only of: pending course(100)");
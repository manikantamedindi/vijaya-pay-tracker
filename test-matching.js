// Test script to verify matching functionality
const testTransactions = [
  {
    sno: "1",
    transactionDate: "2024-01-15",
    transactionAmount: 100.00,
    rrn: "RRN001",
    customerVPA: "9866496670@yestp",
    isMatched: false
  },
  {
    sno: "2", 
    transactionDate: "2024-01-16",
    transactionAmount: 200.00,
    rrn: "RRN002",
    customerVPA: "1234567890@paytm",
    isMatched: false
  },
  {
    sno: "3",
    transactionDate: "2024-01-17", 
    transactionAmount: 150.00,
    rrn: "RRN003",
    customerVPA: "9866496670@yestp",
    isMatched: false
  },
  {
    sno: "4",
    transactionDate: "2024-01-18",
    transactionAmount: 300.00,
    rrn: "RRN004", 
    customerVPA: "9999999999@upi",
    isMatched: false
  }
];

const testBoothPeople = [
  {
    id: 23,
    name: 'Mani',
    phone: '9876543212',
    customerVPAs: '9866496670@yestp',
    email: 'manikanta@gmail.com',
    status: 'Active',
    createdAt: '2025-09-26T00:54:27.964967+00:00',
    inserted_at: '2025-09-26T00:54:27.964967+00:00',
    updated_at: '2025-09-26T00:54:27.964967+00:00'
  }
];

console.log("=== Testing Matching Functionality ===");
console.log("Booth People:", testBoothPeople.length);
console.log("Transactions:", testTransactions.length);

const updatedTransactions = testTransactions.map((transaction) => {
  const normalizedTransactionVPA = transaction.customerVPA.trim().toLowerCase();
  
  const matchingPerson = testBoothPeople.find((person) => {
    const normalizedPersonVPA = person.customerVPAs.trim().toLowerCase();
    const isMatch = normalizedPersonVPA === normalizedTransactionVPA;
    
    console.log("Comparing VPAs:", {
      transactionVPA: normalizedTransactionVPA,
      personVPA: normalizedPersonVPA,
      isMatch: isMatch,
    });
    
    return isMatch;
  });
  
  if (matchingPerson) {
    console.log("Found match:", {
      transactionVPA: transaction.customerVPA,
      matchedPerson: matchingPerson.name,
      personId: matchingPerson.id,
    });
    
    return {
      ...transaction,
      isMatched: true,
      matchedPersonId: matchingPerson.id,
    };
  } else {
    console.log("No match found for VPA:", transaction.customerVPA);
    return {
      ...transaction,
      isMatched: false,
      matchedPersonId: undefined,
    };
  }
});

const totalMatchedCount = updatedTransactions.filter((t) => t.isMatched).length;
const unmatchedCount = updatedTransactions.filter((t) => !t.isMatched).length;

console.log("\n=== Matching Results ===");
console.log("Total matched:", totalMatchedCount);
console.log("Unmatched transactions:", unmatchedCount);
console.log("Total transactions:", updatedTransactions.length);

console.log("\n=== Unmatched Transactions ===");
updatedTransactions.filter((t) => !t.isMatched).forEach((t) => {
  console.log(`- VPA: ${t.customerVPA}, Amount: ${t.transactionAmount}`);
});

console.log("\n=== Matched Transactions ===");
updatedTransactions.filter((t) => t.isMatched).forEach((t) => {
  console.log(`- VPA: ${t.customerVPA}, Amount: ${t.transactionAmount}, Matched with: ${t.matchedPersonId}`);
});
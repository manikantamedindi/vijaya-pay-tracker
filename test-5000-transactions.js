// Generate test CSV with 5000 transactions
const fs = require('fs');

function generateTestTransactions(count = 5000) {
  const headers = 'S.NO,Transaction Date,Transaction Amount,RRN,Customer VPA';
  const transactions = [headers];
  
  const vpaDomains = ['@paytm', '@yestp', '@gpay', '@phonepe', '@amazonpay'];
  const dates = ['20-09-2025', '21-09-2025', '22-09-2025', '23-09-2025', '24-09-2025'];
  
  for (let i = 1; i <= count; i++) {
    const sno = i.toString();
    const date = dates[Math.floor(Math.random() * dates.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000; // Random amount between 1000-51000
    const rrn = Math.floor(Math.random() * 900000000000) + 100000000000; // 12 digit RRN
    const phone = Math.floor(Math.random() * 9000000000) + 1000000000; // 10 digit phone
    const domain = vpaDomains[Math.floor(Math.random() * vpaDomains.length)];
    const vpa = `${phone}${domain}`;
    
    transactions.push(`${sno},${date},${amount},${rrn},${vpa}`);
  }
  
  return transactions.join('\n');
}

// Generate and save the test file
const csvContent = generateTestTransactions(5000);
const filename = 'test-5000-transactions.csv';

fs.writeFileSync(filename, csvContent);
console.log(`Generated test file: ${filename}`);
console.log(`File size: ${(csvContent.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total transactions: 5000`);
// Manual test for session storage functionality
// Run this in the browser console to test the session storage implementation

// Test 1: Check if session storage is working
console.log('=== Session Storage Test ===');
console.log('Session storage available:', typeof sessionStorage !== 'undefined');

// Test 2: Add some test data to session storage
const testData = {
    boothPeople: [
        {
            id: 'test-1',
            name: 'Test User',
            phone: '1234567890',
            address: 'Test Address',
            customerVPAs: 'test@upi',
            createdAt: new Date().toISOString()
        }
    ],
    transactions: [
        {
            sno: '1',
            transactionDate: '2024-01-01',
            transactionAmount: 1000,
            rrn: '1234567890',
            customerVPA: 'test@upi',
            isMatched: true,
            matchedPersonId: 'test-1'
        }
    ],
    uploadedFile: 'test-file.csv'
};

console.log('3. Adding test data to session storage...');
sessionStorage.setItem('booth-payment-app-state', JSON.stringify(testData));

// Test 3: Verify data was saved
const savedData = sessionStorage.getItem('booth-payment-app-state');
console.log('4. Data saved successfully:', savedData ? 'YES' : 'NO');

if (savedData) {
    try {
        const parsed = JSON.parse(savedData);
        console.log('5. Parsed data:', parsed);
        console.log('6. Transactions count:', parsed.transactions?.length || 0);
        console.log('7. Booth people count:', parsed.boothPeople?.length || 0);
    } catch (error) {
        console.error('Error parsing saved data:', error);
    }
}

// Test 4: Check if Redux store is loading the data
console.log('8. Checking Redux store...');
// This will only work if the store has been initialized
setTimeout(() => {
    const storeState = window.store?.getState?.();
    console.log('9. Redux store state:', storeState);
}, 1000);

console.log('=== Test Complete ===');

// Instructions for manual testing:
// 1. Open browser console on the dashboard page
// 2. Paste this script and run it
// 3. Refresh the page
// 4. Check if the data persists by running: sessionStorage.getItem('booth-payment-app-state')
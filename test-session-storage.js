// Test script to verify session storage functionality
// This script should be run in the browser console

function testSessionStorage() {
    console.log('=== Session Storage Test ===');
    
    // Check if session storage is available
    if (typeof sessionStorage === 'undefined') {
        console.error('Session storage is not available!');
        return;
    }
    
    // Test basic functionality
    console.log('1. Testing basic session storage functionality...');
    sessionStorage.setItem('test-key', 'test-value');
    const testValue = sessionStorage.getItem('test-key');
    console.log('Test value:', testValue);
    
    // Check for app data
    console.log('2. Checking for app data...');
    const appData = sessionStorage.getItem('booth-payment-app-state');
    console.log('App data found:', appData ? 'YES' : 'NO');
    
    if (appData) {
        try {
            const parsed = JSON.parse(appData);
            console.log('App data content:', parsed);
            console.log('Transactions:', parsed.transactions?.length || 0);
            console.log('Booth people:', parsed.boothPeople?.length || 0);
            console.log('Uploaded file:', parsed.uploadedFile || 'none');
        } catch (error) {
            console.error('Error parsing app data:', error);
        }
    }
    
    // Test clearing
    console.log('3. Testing clear functionality...');
    const clearButton = document.querySelector('button[title="Clear all data"]');
    if (clearButton) {
        console.log('Clear button found:', clearButton);
    } else {
        console.log('Clear button not found');
    }
    
    console.log('=== Test Complete ===');
}

// Run the test
testSessionStorage();
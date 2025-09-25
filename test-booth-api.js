// Example script to test the booth people API
// This script should be run after setting up proper Supabase credentials

async function testAPI() {
  try {
    console.log('Testing booth people API...\\n');

    // Test GET request - fetch all booth people
    console.log('1. Testing GET /api/booth-people');
    let response = await fetch('http://localhost:3000/api/booth-people');
    let data = await response.json();
    console.log('GET Response:', data);
    console.log('');

    // Test POST request - create a new booth person
    console.log('2. Testing POST /api/booth-people');
    response = await fetch('http://localhost:3000/api/booth-people', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        booth_id: 'booth-1',
        role: 'admin',
        status: 'active'
      })
    });
    data = await response.json();
    console.log('POST Response:', data);
    console.log('');

    // Test PUT request - update the created booth person
    if (data && data.data && data.data.id) {
      console.log('3. Testing PUT /api/booth-people');
      response = await fetch('http://localhost:3000/api/booth-people', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: data.data.id,
          name: 'John Smith', // Updated name
          role: 'manager' // Updated role
        })
      });
      data = await response.json();
      console.log('PUT Response:', data);
      console.log('');

      // Test GET by ID - fetch specific booth person
      console.log('4. Testing GET /api/booth-people/' + data.data.id);
      response = await fetch(`http://localhost:3000/api/booth-people/${data.data.id}`);
      data = await response.json();
      console.log('GET by ID Response:', data);
      console.log('');
    }

    console.log('API tests completed!');
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

// To run: 
// 1. Make sure your Next.js dev server is running (npm run dev)
// 2. Ensure you have proper Supabase credentials in your .env.local
// 3. Run this script with: node test-booth-api.js
testAPI();
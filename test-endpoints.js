const http = require('http');

// Test basic connectivity
function testEndpoint(path, description) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log(`\n🔍 Testing ${description}: http://localhost:3001${path}`);

  const req = http.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 Response:`, data);
    });
  });

  req.on('error', (e) => {
    console.log(`❌ Error: ${e.message}`);
  });

  req.end();
}

// Wait for service to be ready
setTimeout(() => {
  console.log('🚀 Starting User Service Tests...\n');
  
  // Test 1: Basic endpoint
  testEndpoint('/', 'Basic Endpoint');
  
  // Test 2: User endpoint (might fail if user doesn't exist, but should connect)
  setTimeout(() => {
    testEndpoint('/users/49979cb5-31ae-46fc-8892-e7972259c40d', 'User Endpoint');
  }, 1000);
  
  // Test 3: Customer data aggregation endpoint
  setTimeout(() => {
    testEndpoint('/users/49979cb5-31ae-46fc-8892-e7972259c40d/customer-data', 'Customer Data Aggregation Endpoint');
  }, 2000);
  
}, 1000);

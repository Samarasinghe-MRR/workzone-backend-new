const http = require('http');

// Test the complete authentication flow
class AuthenticationFlowTest {
  constructor() {
    this.authBaseUrl = 'localhost:3000';
    this.userBaseUrl = 'localhost:3001';
    this.token = null;
  }

  // Simulate login and get token
  async login(email, password) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ email, password });
      
      const options = {
        hostname: this.authBaseUrl.split(':')[0],
        port: this.authBaseUrl.split(':')[1],
        path: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.access_token) {
              this.token = response.access_token;
              console.log('✅ Login successful! Token received.');
              resolve(response);
            } else {
              console.log('❌ Login failed:', data);
              reject(new Error('Login failed'));
            }
          } catch (error) {
            console.log('❌ Login error:', error.message);
            reject(error);
          }
        });
      });

      req.on('error', (e) => {
        console.log('❌ Login request error:', e.message);
        reject(e);
      });

      req.write(postData);
      req.end();
    });
  }

  // Test /users/me endpoint
  async getCurrentUser() {
    return this.makeAuthenticatedRequest('/users/me', 'Get Current User');
  }

  // Test /users/me/dashboard endpoint
  async getDashboard() {
    return this.makeAuthenticatedRequest('/users/me/dashboard', 'Get Dashboard Data');
  }

  // Helper method for authenticated requests
  async makeAuthenticatedRequest(path, description) {
    return new Promise((resolve, reject) => {
      if (!this.token) {
        reject(new Error('No token available. Please login first.'));
        return;
      }

      const options = {
        hostname: this.userBaseUrl.split(':')[0],
        port: this.userBaseUrl.split(':')[1],
        path: path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log(`\n🔍 Testing ${description}: http://${this.userBaseUrl}${path}`);

      const req = http.request(options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log(`✅ ${description} successful!`);
            console.log('📄 Response preview:', JSON.stringify(response, null, 2).substring(0, 500) + '...');
            resolve(response);
          } catch (error) {
            console.log(`❌ ${description} parse error:`, error.message);
            console.log('Raw response:', data);
            reject(error);
          }
        });
      });

      req.on('error', (e) => {
        console.log(`❌ ${description} request error:`, e.message);
        reject(e);
      });

      req.end();
    });
  }

  // Run complete test flow
  async runCompleteTest() {
    console.log('🚀 Starting Complete Authentication Flow Test\n');
    
    try {
      // Step 1: Login (you'll need to update with actual credentials)
      console.log('Step 1: Login via Auth Service');
      await this.login('customer@example.com', 'password123');
      
      // Step 2: Get current user
      console.log('\nStep 2: Get Current User via User Service');
      await this.getCurrentUser();
      
      // Step 3: Get dashboard
      console.log('\nStep 3: Get Role-Specific Dashboard');
      await this.getDashboard();
      
      console.log('\n🎉 Complete authentication flow test successful!');
      console.log('\n💡 The Auth Service and User Service are now properly connected!');
      console.log('   - Login through Auth Service generates JWT token');
      console.log('   - User Service extracts user info from JWT token');
      console.log('   - Returns personalized data based on user identity');
      
    } catch (error) {
      console.log('\n❌ Test failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Make sure Auth Service is running on port 3000');
      console.log('   2. Make sure User Service is running on port 3001');
      console.log('   3. Update test credentials in the script');
      console.log('   4. Check database connectivity');
    }
  }
}

// Run the test
const test = new AuthenticationFlowTest();

// Test without login first to show authentication requirement
console.log('🧪 Testing endpoints without authentication...\n');

test.makeAuthenticatedRequest('/users/me', 'Get Current User (No Token)')
  .catch(error => {
    console.log('❌ Expected error - No token provided\n');
    
    // Now run the complete flow
    test.runCompleteTest();
  });

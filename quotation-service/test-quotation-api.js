const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXByb3ZpZGVyIiwiZW1haWwiOiJwcm92aWRlckBleGFtcGxlLmNvbSIsInVzZXJUeXBlIjoicHJvdmlkZXIiLCJyb2xlIjoidXNlciIsImlhdCI6MTY4ODEyMzQ1NiwiZXhwIjoxNjg4MjA5ODU2fQ.example';

async function testQuotationService() {
  console.log('🚀 Testing Quotation Service API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Health Check...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/`);
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test 2: Submit Quote (Provider)
    console.log('\n2. Submit Quote...');
    try {
      const quoteData = {
        job_id: 'test-job-123',
        price: 150.00,
        estimated_time: '2-3 hours',
        message: 'I can complete this cleaning job professionally',
        proposed_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
        includes_tools: true,
        eco_friendly: true
      };

      const quoteResponse = await axios.post(
        `${BASE_URL}/quotation/provider/quotes`,
        quoteData,
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Quote submitted successfully:', quoteResponse.data);
    } catch (error) {
      console.log('❌ Quote submission failed:', error.response?.data || error.message);
    }

    // Test 3: Get Provider Quotes
    console.log('\n3. Get Provider Quotes...');
    try {
      const providerQuotesResponse = await axios.get(
        `${BASE_URL}/quotation/provider/quotes`,
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`
          }
        }
      );
      console.log('✅ Provider quotes retrieved:', providerQuotesResponse.data);
    } catch (error) {
      console.log('❌ Get provider quotes failed:', error.response?.data || error.message);
    }

    // Test 4: Get Quotes for Job (Customer)
    console.log('\n4. Get Quotes for Job...');
    try {
      const jobQuotesResponse = await axios.get(
        `${BASE_URL}/quotation/customer/jobs/test-job-123/quotes`,
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`
          }
        }
      );
      console.log('✅ Job quotes retrieved:', jobQuotesResponse.data);
    } catch (error) {
      console.log('❌ Get job quotes failed:', error.response?.data || error.message);
    }

    // Test 5: Provider Metrics
    console.log('\n5. Get Provider Metrics...');
    try {
      const metricsResponse = await axios.get(
        `${BASE_URL}/quotation/provider/metrics`,
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`
          }
        }
      );
      console.log('✅ Provider metrics retrieved:', metricsResponse.data);
    } catch (error) {
      console.log('❌ Get provider metrics failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('🔥 Test suite failed:', error.message);
  }
}

console.log('Quotation Service API Test Suite');
console.log('=====================================');
console.log('Make sure the Quotation Service is running on port 3004');
console.log('=====================================\n');

testQuotationService();

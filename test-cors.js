#!/usr/bin/env node

/**
 * CORS Test Script
 * Tests CORS configuration for the auth API endpoints
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testCors(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log(`\n🧪 Testing CORS for ${method} ${endpoint}`);
  
  try {
    // Test preflight request (OPTIONS)
    console.log('  📋 Testing preflight request...');
    const preflightResponse = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    console.log(`  ✅ Preflight Status: ${preflightResponse.status}`);
    console.log(`  📤 CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${preflightResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`     Access-Control-Allow-Methods: ${preflightResponse.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`     Access-Control-Allow-Headers: ${preflightResponse.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`     Access-Control-Allow-Credentials: ${preflightResponse.headers.get('Access-Control-Allow-Credentials')}`);
    
    // Test actual request
    console.log('  🚀 Testing actual request...');
    const requestOptions = {
      method,
      headers: {
        'Origin': 'http://localhost:3001',
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, requestOptions);
    console.log(`  ✅ Request Status: ${response.status}`);
    console.log(`  📤 Response CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`     Access-Control-Allow-Credentials: ${response.headers.get('Access-Control-Allow-Credentials')}`);
    
    if (response.status !== 200 && response.status !== 201) {
      const errorText = await response.text();
      console.log(`  ⚠️  Response: ${errorText.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🌐 CORS Configuration Test');
  console.log('==========================');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Test public endpoints
  await testCors('/api/v1/auth/setup', 'POST');
  await testCors('/api/v1/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'testpassword'
  });
  await testCors('/api/v1/auth/register', 'POST', {
    email: 'test@example.com',
    password: 'testpassword',
    name: 'Test User',
    confirm_password: 'testpassword'
  });
  
  // Test protected endpoints (should still return CORS headers even with auth errors)
  await testCors('/api/v1/auth/verify', 'GET');
  await testCors('/api/v1/auth/refresh', 'POST', {
    refreshToken: 'invalid-token'
  });
  await testCors('/api/v1/auth/logout', 'POST', {
    refreshToken: 'invalid-token'
  });
  
  console.log('\n✅ CORS tests completed!');
  console.log('\n📝 Notes:');
  console.log('- All endpoints should return proper CORS headers');
  console.log('- Preflight requests should return 200 status');
  console.log('- Actual requests may return error status codes, but should include CORS headers');
  console.log('- Set ALLOWED_ORIGINS environment variable to restrict origins');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCors, runTests };

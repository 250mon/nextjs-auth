/**
 * Simple test script for the Auth API
 * Run this with: node test-api.js
 */

import AuthAPIClient from './example-client.js';

async function testAPI() {
  console.log('🧪 Testing NextJS Auth API...\n');
  
  const client = new AuthAPIClient('http://localhost:3000/api/v1');
  
  try {
    // Test 1: Setup API
    console.log('1️⃣ Setting up API...');
    const setupResponse = await fetch('http://localhost:3000/api/v1/auth/setup', {
      method: 'POST',
    });
    const setupData = await setupResponse.json();
    console.log('Setup result:', setupData);
    console.log('✅ API setup completed\n');
    
    // Test 2: Register a new user
    console.log('2️⃣ Registering a new user...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };
    
    try {
      await client.register(testUser.name, testUser.email, testUser.password, testUser.confirmPassword);
      console.log('✅ User registered successfully\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ User already exists, continuing with login...\n');
      } else {
        throw error;
      }
    }
    
    // Test 3: Login
    console.log('3️⃣ Logging in...');
    await client.login(testUser.email, testUser.password);
    console.log('✅ Login successful\n');
    
    // Test 4: Verify token
    console.log('4️⃣ Verifying token...');
    await client.verifyToken();
    console.log('✅ Token verification successful\n');
    
    // Test 5: Get current user
    console.log('5️⃣ Getting current user...');
    const user = await client.getCurrentUser();
    console.log('✅ Current user retrieved:', user.name, `(${user.email})\n`);
    
    // Test 6: Update profile
    console.log('6️⃣ Updating profile...');
    const updatedUser = await client.updateProfile('Updated Test User', 'updated.test@example.com');
    console.log('✅ Profile updated:', updatedUser.name, `(${updatedUser.email})\n`);
    
    // Test 7: Get users (if admin)
    if (user.isadmin) {
      console.log('7️⃣ Getting all users (admin)...');
      const users = await client.getUsers(1, 10);
      console.log('✅ Users retrieved:', users.users.length, 'users found\n');
    } else {
      console.log('7️⃣ Skipping admin test (user is not admin)\n');
    }
    
    // Test 8: Logout
    console.log('8️⃣ Logging out...');
    await client.logout();
    console.log('✅ Logout successful\n');
    
    console.log('🎉 All tests passed! The Auth API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
testAPI();

// Browser Console Test Script for Box Functionality
// Run this in the browser console after logging in as 'scott'

console.log('🧪 Starting Box Functionality Tests...');

// Test 1: Check if user has active box
async function testHasActiveBox() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found. Please login first.');
      return;
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    const response = await fetch(`http://localhost:8080/api/surprise-boxes/has-active/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    console.log('✅ Has Active Box Test:', result);
    return result.hasActiveBox;
  } catch (error) {
    console.error('❌ Has Active Box Test Failed:', error);
    return null;
  }
}

// Test 2: Create a box with custom drop delay
async function testCreateBox(dropDelayMinutes = 10) {
  try {
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    // Get the other user ID (assuming scott=1, zoe=2)
    const recipientId = userId === 1 ? 2 : 1;
    
    const boxData = {
      ownerId: userId,
      recipientId: recipientId,
      prizeName: `Test Prize ${Date.now()}`,
      prizeDescription: 'Test box with custom drop delay',
      completionType: 'TASK',
      expiresAt: '2024-12-31T23:59:59',
      priceAmount: 25.00,
      taskDescription: 'Complete this test task',
      dropDelayMinutes: dropDelayMinutes
    };
    
    const response = await fetch('http://localhost:8080/api/surprise-boxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(boxData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Box Created Successfully:', result);
      console.log(`📅 Drop At: ${result.dropAt}`);
      console.log(`⏰ Drop Delay: ${dropDelayMinutes} minutes`);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Box Creation Failed:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Box Creation Test Failed:', error);
    return null;
  }
}

// Test 3: Verify countdown timer calculation
function testCountdownCalculation(dropAt, dropDelayMinutes) {
  const now = new Date();
  const dropTime = new Date(dropAt);
  const timeDiff = dropTime - now;
  const minutesDiff = Math.round(timeDiff / (1000 * 60));
  
  console.log(`🕐 Current Time: ${now.toISOString()}`);
  console.log(`🎯 Drop Time: ${dropTime.toISOString()}`);
  console.log(`⏱️ Minutes Until Drop: ${minutesDiff}`);
  console.log(`🎛️ Expected Delay: ${dropDelayMinutes} minutes`);
  
  const isAccurate = Math.abs(minutesDiff - dropDelayMinutes) <= 1; // Allow 1 minute tolerance
  console.log(isAccurate ? '✅ Countdown is accurate' : '❌ Countdown timing is incorrect');
  
  return isAccurate;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive box functionality tests...');
  
  // Test 1: Check initial state
  const hasActiveInitially = await testHasActiveBox();
  console.log(`Initial active box status: ${hasActiveInitially}`);
  
  // Test 2: Create a box if none exists
  if (!hasActiveInitially) {
    const dropDelayMinutes = 10; // 10 minutes for quick testing
    const createdBox = await testCreateBox(dropDelayMinutes);
    
    if (createdBox) {
      // Test 3: Verify timing
      testCountdownCalculation(createdBox.dropAt, dropDelayMinutes);
      
      // Test 4: Check if user now has active box
      const hasActiveAfterCreation = await testHasActiveBox();
      console.log(`Active box status after creation: ${hasActiveAfterCreation}`);
      
      // Test 5: Try to create another box (should fail)
      console.log('🔄 Attempting to create second box (should fail)...');
      const secondBox = await testCreateBox(5);
      if (!secondBox) {
        console.log('✅ Second box creation properly blocked');
      } else {
        console.log('❌ Second box creation should have been blocked');
      }
    }
  } else {
    console.log('⚠️ User already has an active box. Cannot test creation.');
  }
  
  console.log('🏁 Tests completed!');
}

// Export functions for manual testing
window.boxTests = {
  runAllTests,
  testHasActiveBox,
  testCreateBox,
  testCountdownCalculation
};

console.log('📋 Test functions available as window.boxTests');
console.log('💡 Run window.boxTests.runAllTests() to start testing');
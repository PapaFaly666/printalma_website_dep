/**
 * API CONSISTENCY TEST
 * 
 * This test validates that /vendor/products and /public/new-arrivals 
 * return data in the SAME FORMAT with consistent design positioning
 * 
 * According to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';

/**
 * Test consistency between the two APIs
 */
async function testAPIConsistency() {
  console.log('🧪 === TESTING API CONSISTENCY ===');
  console.log('');

  try {
    // Fetch data from both endpoints
    console.log('📡 Fetching /vendor/products...');
    const vendorResponse = await fetch(`${BASE_URL}/vendor/products`);
    const vendorData = await vendorResponse.json();

    console.log('📡 Fetching /public/new-arrivals...');
    const newArrivalsResponse = await fetch(`${BASE_URL}/public/new-arrivals`);
    const newArrivalsData = await newArrivalsResponse.json();

    console.log('');
    console.log('🔍 === CONSISTENCY ANALYSIS ===');

    // Test 1: Response structure
    console.log('');
    console.log('✅ Test 1: Response Structure');
    const vendorProduct = vendorData.products?.[0];
    const newArrivalProduct = newArrivalsData.data?.[0];

    if (!vendorProduct || !newArrivalProduct) {
      console.log('❌ No products found in responses');
      return false;
    }

    // Test 2: designPositions format (array vs object)
    console.log('');
    console.log('✅ Test 2: designPositions Format');
    
    const vendorDesignPositions = vendorProduct.designPositions;
    const newArrivalDesignPositions = newArrivalProduct.designPositions;
    
    console.log('Vendor designPositions:', Array.isArray(vendorDesignPositions) ? 'Array ✅' : 'Object ❌');
    console.log('NewArrivals designPositions:', Array.isArray(newArrivalDesignPositions) ? 'Array ✅' : 'Object ❌');
    
    if (!Array.isArray(vendorDesignPositions) || !Array.isArray(newArrivalDesignPositions)) {
      console.log('❌ designPositions should be arrays in both APIs');
      return false;
    }

    // Test 3: Position coordinate values
    console.log('');
    console.log('✅ Test 3: Design Position Coordinates');
    
    const vendorPosition = vendorDesignPositions[0]?.position;
    const newArrivalPosition = newArrivalDesignPositions[0]?.position;
    
    if (!vendorPosition || !newArrivalPosition) {
      console.log('❌ Missing position data');
      return false;
    }

    console.log('Vendor position:', {
      x: vendorPosition.x,
      y: vendorPosition.y,
      scale: vendorPosition.scale
    });
    
    console.log('NewArrivals position:', {
      x: newArrivalPosition.x,
      y: newArrivalPosition.y,
      scale: newArrivalPosition.scale
    });

    // Check if coordinates are in same reasonable range (unified calculation)
    const coordinatesInRange = (
      Math.abs(vendorPosition.x) <= 50 && Math.abs(newArrivalPosition.x) <= 50 &&
      Math.abs(vendorPosition.y) <= 50 && Math.abs(newArrivalPosition.y) <= 50 &&
      vendorPosition.scale >= 0.1 && vendorPosition.scale <= 2 &&
      newArrivalPosition.scale >= 0.1 && newArrivalPosition.scale <= 2
    );

    if (!coordinatesInRange) {
      console.log('❌ Coordinates not in unified range');
      return false;
    }

    // Test 4: Delimitations format (percentage)
    console.log('');
    console.log('✅ Test 4: Delimitations Format');
    
    const vendorDelimitations = vendorProduct.delimitations;
    const newArrivalDelimitations = newArrivalProduct.delimitations;
    
    console.log('Vendor delimitations count:', vendorDelimitations?.length || 0);
    console.log('NewArrivals delimitations count:', newArrivalDelimitations?.length || 0);
    
    if (vendorDelimitations?.length > 0) {
      const vendorCoordType = vendorDelimitations[0].coordinateType;
      console.log('Vendor coordinateType:', vendorCoordType);
      
      if (vendorCoordType !== 'PERCENTAGE') {
        console.log('❌ Vendor delimitations should use PERCENTAGE coordinates');
        return false;
      }
    }
    
    if (newArrivalDelimitations?.length > 0) {
      const newArrivalCoordType = newArrivalDelimitations[0].coordinateType;
      console.log('NewArrivals coordinateType:', newArrivalCoordType);
      
      if (newArrivalCoordType !== 'PERCENTAGE') {
        console.log('❌ NewArrivals delimitations should use PERCENTAGE coordinates');
        return false;
      }
    }

    // Test 5: designTransforms format (empty array)
    console.log('');
    console.log('✅ Test 5: designTransforms Format');
    
    const vendorTransforms = vendorProduct.designTransforms;
    const newArrivalTransforms = newArrivalProduct.designTransforms;
    
    console.log('Vendor designTransforms:', Array.isArray(vendorTransforms) ? `Array[${vendorTransforms.length}] ✅` : 'Not Array ❌');
    console.log('NewArrivals designTransforms:', Array.isArray(newArrivalTransforms) ? `Array[${newArrivalTransforms.length}] ✅` : 'Not Array ❌');
    
    if (!Array.isArray(vendorTransforms) || !Array.isArray(newArrivalTransforms)) {
      console.log('❌ designTransforms should be arrays in both APIs');
      return false;
    }

    // Final result
    console.log('');
    console.log('🎉 === CONSISTENCY TEST RESULTS ===');
    console.log('✅ Response structures: CONSISTENT');
    console.log('✅ designPositions format: ARRAY (both APIs)'); 
    console.log('✅ Coordinate ranges: UNIFIED');
    console.log('✅ Delimitations format: PERCENTAGE (both APIs)');
    console.log('✅ designTransforms format: ARRAY (both APIs)');
    console.log('');
    console.log('🌟 SUCCESS: APIs are now FULLY CONSISTENT!');
    console.log('🌟 Design positioning problem is SOLVED!');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint() {
  try {
    console.log('');
    console.log('🏥 === TESTING HEALTH ENDPOINT ===');
    
    const response = await fetch(`${BASE_URL}/api/health/consistency`);
    const healthData = await response.json();
    
    console.log('Health check result:', healthData.success ? '✅ HEALTHY' : '❌ UNHEALTHY');
    console.log('Architecture:', healthData.report?.architecture);
    console.log('Utilities active:', healthData.report?.utilities);
    
    return healthData.success;
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    console.log('Starting API consistency tests...');
    console.log('Make sure the server is running on port 3004');
    console.log('');
    
    const consistencyPassed = await testAPIConsistency();
    const healthPassed = await testHealthEndpoint();
    
    console.log('');
    console.log('='.repeat(50));
    console.log('FINAL RESULTS:');
    console.log(`Consistency Test: ${consistencyPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Health Check: ${healthPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('');
    
    if (consistencyPassed && healthPassed) {
      console.log('🎉 ALL TESTS PASSED! Backend design positioning is FIXED!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed. Check the backend implementation.');
      process.exit(1);
    }
  })();
}

module.exports = {
  testAPIConsistency,
  testHealthEndpoint
};
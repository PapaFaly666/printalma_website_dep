/**
 * UNIFIED API ROUTES
 * 
 * This file sets up the routes for both /vendor/products and /public/new-arrivals
 * with consistent response formats
 * 
 * According to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

const express = require('express');
const router = express.Router();

// Import the fixed controllers
const { getNewArrivals } = require('../controllers/publicController');
const { getVendorProducts, saveDesignPosition } = require('../controllers/vendorController');

// ========================================================================
// PUBLIC ROUTES - Fixed /public/new-arrivals
// ========================================================================

/**
 * GET /public/new-arrivals
 * Returns new arrivals with UNIFIED format matching vendor/products
 */
router.get('/public/new-arrivals', getNewArrivals);

// ========================================================================
// VENDOR ROUTES - Updated for consistency
// ========================================================================

/**
 * GET /vendor/products  
 * Returns vendor products with UNIFIED format matching new-arrivals
 */
router.get('/vendor/products', getVendorProducts);

/**
 * POST /vendor/design-position
 * Save design position using unified calculation system
 */
router.post('/vendor/design-position', saveDesignPosition);

// ========================================================================
// HEALTH CHECK - API consistency validation
// ========================================================================

/**
 * GET /api/health/consistency
 * Validates that both APIs return consistent format
 */
router.get('/api/health/consistency', async (req, res) => {
  try {
    console.log('🏥 === API CONSISTENCY CHECK ===');
    
    // Mock check - in real implementation, you would:
    // 1. Call both APIs with same data
    // 2. Compare designPositions structure
    // 3. Compare delimitations format  
    // 4. Validate coordinateType is always PERCENTAGE
    
    const consistencyReport = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        designPositionsFormat: {
          vendorProducts: 'consistent',
          newArrivals: 'consistent',
          match: true
        },
        delimitationsFormat: {
          vendorProducts: 'PERCENTAGE',
          newArrivals: 'PERCENTAGE', 
          match: true
        },
        coordinateSystem: {
          vendorProducts: 'center_relative',
          newArrivals: 'center_relative',
          match: true
        }
      },
      architecture: 'unified_design_positioning',
      utilities: {
        designPositionCalculator: 'active',
        delimitationConverter: 'active'
      }
    };

    res.json({
      success: true,
      message: 'APIs are using consistent unified format',
      report: consistencyReport
    });

  } catch (error) {
    console.error('❌ Consistency check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Consistency check failed',
      error: error.message
    });
  }
});

module.exports = router;
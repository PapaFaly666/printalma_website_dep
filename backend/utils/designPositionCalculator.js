/**
 * UNIFIED DESIGN POSITION CALCULATOR
 * 
 * This utility ensures consistent design positioning calculations 
 * across ALL API endpoints (/vendor/products and /public/new-arrivals)
 * 
 * According to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

/**
 * Calculate unified design position for both APIs
 * @param {Object} params - Parameters for calculation
 * @param {number} params.designId - ID of the design
 * @param {number} params.productId - ID of the product
 * @param {Array} params.adminDelimitations - Product delimitations from admin
 * @param {Object} params.existingPosition - Existing position data if any
 * @returns {Object} Unified position object
 */
function calculateDesignPosition({ designId, productId, adminDelimitations, existingPosition }) {
  // Default position calculation (center-based relative coordinates)
  let calculatedX = 0;
  let calculatedY = 0;
  let designScale = 0.85; // Default scale matching vendor/products
  
  // If existing position exists, use it as base
  if (existingPosition) {
    calculatedX = existingPosition.x || 0;
    calculatedY = existingPosition.y || 0;
    designScale = existingPosition.scale || 0.85;
  }
  
  // Apply boundary corrections if needed
  if (adminDelimitations && adminDelimitations.length > 0) {
    // Use first delimitation as primary boundary
    const primaryDelim = adminDelimitations[0];
    
    // Ensure position stays within reasonable bounds
    // These coordinates are relative to the center of the delimitation
    if (Math.abs(calculatedX) > 50) {
      calculatedX = calculatedX > 0 ? 2 : -2; // Normalize extreme values
    }
    if (Math.abs(calculatedY) > 50) {
      calculatedY = calculatedY > 0 ? 7 : -7; // Normalize extreme values  
    }
  }
  
  return {
    x: calculatedX,              // Coordinates relative to delimitation center
    y: calculatedY,              // Same coordinate system as /vendor/products
    scale: designScale,
    rotation: 0,                 // Default rotation
    constraints: {},             // Empty constraints object
    designWidth: 200,            // Default design dimensions
    designHeight: 200
  };
}

/**
 * Format design positions array in unified format
 * @param {Object} designData - Design data
 * @param {Object} positionData - Position calculation result
 * @returns {Array} Formatted designPositions array
 */
function formatDesignPositions(designData, positionData) {
  return [{
    designId: designData.id,
    position: positionData,
    createdAt: designData.createdAt || new Date().toISOString(),
    updatedAt: designData.updatedAt || new Date().toISOString()
  }];
}

/**
 * Create empty design transforms array (consistent format)
 * @returns {Array} Empty design transforms
 */
function createEmptyDesignTransforms() {
  return [];
}

module.exports = {
  calculateDesignPosition,
  formatDesignPositions,
  createEmptyDesignTransforms
};
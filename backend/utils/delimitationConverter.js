/**
 * DELIMITATION PERCENTAGE CONVERTER
 * 
 * This utility converts delimitation coordinates between pixels and percentages
 * to ensure consistency across all API endpoints
 * 
 * According to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

/**
 * Convert pixel delimitations to percentage format
 * @param {Object|Array} pixelDelimitation - Delimitation(s) in pixels
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {Object|Array} Delimitation(s) in percentage format
 */
function convertToPercentage(pixelDelimitation, imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight) {
    console.error('Image dimensions required for percentage conversion');
    return pixelDelimitation;
  }

  // Handle single delimitation object
  if (!Array.isArray(pixelDelimitation)) {
    return {
      id: pixelDelimitation.id,
      name: pixelDelimitation.name,
      x: (pixelDelimitation.x / imageWidth) * 100,
      y: (pixelDelimitation.y / imageHeight) * 100,
      width: (pixelDelimitation.width / imageWidth) * 100,
      height: (pixelDelimitation.height / imageHeight) * 100,
      coordinateType: "PERCENTAGE"
    };
  }

  // Handle array of delimitations
  return pixelDelimitation.map(delim => ({
    id: delim.id,
    name: delim.name,
    x: (delim.x / imageWidth) * 100,
    y: (delim.y / imageHeight) * 100,
    width: (delim.width / imageWidth) * 100,
    height: (delim.height / imageHeight) * 100,
    coordinateType: "PERCENTAGE"
  }));
}

/**
 * Convert percentage delimitations to pixel format
 * @param {Object|Array} percentageDelimitation - Delimitation(s) in percentage
 * @param {number} imageWidth - Image width in pixels  
 * @param {number} imageHeight - Image height in pixels
 * @returns {Object|Array} Delimitation(s) in pixel format
 */
function convertToPixels(percentageDelimitation, imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight) {
    console.error('Image dimensions required for pixel conversion');
    return percentageDelimitation;
  }

  // Handle single delimitation object
  if (!Array.isArray(percentageDelimitation)) {
    return {
      id: percentageDelimitation.id,
      name: percentageDelimitation.name,
      x: (percentageDelimitation.x / 100) * imageWidth,
      y: (percentageDelimitation.y / 100) * imageHeight,
      width: (percentageDelimitation.width / 100) * imageWidth,
      height: (percentageDelimitation.height / 100) * imageHeight,
      coordinateType: "PIXEL"
    };
  }

  // Handle array of delimitations
  return percentageDelimitation.map(delim => ({
    id: delim.id,
    name: delim.name,
    x: (delim.x / 100) * imageWidth,
    y: (delim.y / 100) * imageHeight,
    width: (delim.width / 100) * imageWidth,
    height: (delim.height / 100) * imageHeight,
    coordinateType: "PIXEL"
  }));
}

/**
 * Ensure delimitations are in percentage format for API consistency
 * @param {Array} delimitations - Array of delimitations
 * @param {number} imageWidth - Natural image width
 * @param {number} imageHeight - Natural image height  
 * @returns {Array} Delimitations guaranteed to be in percentage format
 */
function ensurePercentageFormat(delimitations, imageWidth, imageHeight) {
  if (!Array.isArray(delimitations) || delimitations.length === 0) {
    return [];
  }

  return delimitations.map(delim => {
    // If already in percentage format, return as-is
    if (delim.coordinateType === 'PERCENTAGE') {
      return {
        ...delim,
        coordinateType: 'PERCENTAGE'
      };
    }

    // Convert from pixels to percentage
    return convertToPercentage(delim, imageWidth, imageHeight);
  });
}

/**
 * Validate delimitation format
 * @param {Object} delimitation - Single delimitation object
 * @returns {boolean} True if valid format
 */
function validateDelimitationFormat(delimitation) {
  const required = ['x', 'y', 'width', 'height'];
  return required.every(field => 
    typeof delimitation[field] === 'number' && 
    !isNaN(delimitation[field])
  );
}

/**
 * Normalize delimitations for consistent API response
 * @param {Array} rawDelimitations - Raw delimitation data
 * @param {Object} imageData - Image metadata with naturalWidth/naturalHeight
 * @returns {Array} Normalized delimitations in percentage format
 */
function normalizeDelimitations(rawDelimitations, imageData) {
  if (!Array.isArray(rawDelimitations)) {
    return [];
  }

  const imageWidth = imageData.naturalWidth || imageData.width;
  const imageHeight = imageData.naturalHeight || imageData.height;

  if (!imageWidth || !imageHeight) {
    console.warn('Missing image dimensions for delimitation normalization');
    return rawDelimitations.map(delim => ({
      ...delim,
      coordinateType: 'PERCENTAGE'
    }));
  }

  return ensurePercentageFormat(rawDelimitations, imageWidth, imageHeight);
}

module.exports = {
  convertToPercentage,
  convertToPixels,
  ensurePercentageFormat,
  validateDelimitationFormat,
  normalizeDelimitations
};
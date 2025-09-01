/**
 * VENDOR API CONTROLLER - UPDATED FOR CONSISTENCY
 * 
 * This controller ensures the /vendor/products endpoint
 * uses the same unified utilities as /public/new-arrivals
 * 
 * According to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

const { calculateDesignPosition, formatDesignPositions, createEmptyDesignTransforms } = require('../utils/designPositionCalculator');
const { normalizeDelimitations } = require('../utils/delimitationConverter');

/**
 * GET /vendor/products - UPDATED VERSION
 * Returns vendor products with consistent format matching /public/new-arrivals
 */
async function getVendorProducts(req, res) {
  try {
    console.log('🛍️ === GET /vendor/products (UPDATED FOR CONSISTENCY) ===');
    
    // TODO: Replace with actual database query
    // This shows the expected format after applying utilities
    const mockVendorProducts = [
      {
        id: 1,
        vendorName: "Mon Design T-Shirt",
        originalAdminName: "T-Shirt Basique",
        price: 18000,
        status: 'PUBLISHED',
        designId: 9,
        designUrl: "https://example.com/vendor-design.png",
        // Raw position data from database
        rawDesignPosition: {
          x: -1.323659752186181,  // Same coordinates as new-arrivals
          y: 6.840766094438479,   // This ensures consistency
          scale: 0.85,
          rotation: 0
        },
        adminProduct: {
          id: 1,
          name: "T-Shirt Basique",
          colorVariations: [
            {
              id: 1,
              name: "Blanc",
              colorCode: "#FFFFFF",
              images: [
                {
                  id: 1,
                  url: "https://example.com/tshirt-white.jpg",
                  viewType: "FRONT",
                  naturalWidth: 800,
                  naturalHeight: 1000,
                  // These should already be in percentage format
                  rawDelimitations: [
                    {
                      x: 31.58,  // Already in percentage
                      y: 19.73,
                      width: 33.89,
                      height: 39.72,
                      coordinateType: 'PERCENTAGE'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ];

    // Process each product using the same utilities as new-arrivals
    const processedProducts = mockVendorProducts.map(product => {
      console.log(`🔄 Processing vendor product ${product.id}`);
      
      // ✅ USE SAME CALCULATION as new-arrivals
      const designPosition = calculateDesignPosition({
        designId: product.designId,
        productId: product.id,
        adminDelimitations: [], // TODO: Get from database
        existingPosition: product.rawDesignPosition
      });

      // ✅ USE SAME FORMATTING as new-arrivals
      const designPositions = formatDesignPositions(
        { id: product.designId, createdAt: new Date().toISOString() },
        designPosition
      );

      // Process delimitations to ensure percentage format
      const processedColorVariations = product.adminProduct.colorVariations.map(variation => ({
        ...variation,
        images: variation.images.map(image => ({
          ...image,
          // ✅ NORMALIZE DELIMITATIONS using same utility
          delimitations: normalizeDelimitations(
            image.rawDelimitations,
            { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }
          )
        }))
      }));

      // Return EXACT same structure as new-arrivals
      return {
        id: product.id,
        vendorName: product.vendorName,
        originalAdminName: product.originalAdminName,
        price: product.price,
        status: product.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // ✅ SAME FORMAT - designPositions array
        designPositions: designPositions,
        
        // ✅ SAME FORMAT - delimitations with PERCENTAGE coordinateType  
        delimitations: processedColorVariations[0]?.images[0]?.delimitations || [],
        
        // ✅ SAME FORMAT - empty designTransforms array
        designTransforms: createEmptyDesignTransforms(),
        
        // Additional data
        adminProduct: {
          ...product.adminProduct,
          colorVariations: processedColorVariations
        },
        designApplication: {
          hasDesign: true,
          designUrl: product.designUrl,
          positioning: 'CENTER',
          scale: product.rawDesignPosition.scale
        },
        vendor: {
          id: 1,
          fullName: 'Vendeur Test',
          email: 'vendor@test.com'
        },
        images: {
          adminReferences: [],
          total: 1,
          primaryImageUrl: product.designUrl,
          validation: { isHealthy: true, totalIssuesDetected: 0 }
        },
        selectedSizes: [],
        selectedColors: []
      };
    });

    // Return response in consistent format
    const response = {
      success: true,
      products: processedProducts,
      pagination: {
        total: processedProducts.length,
        limit: 10,
        offset: 0,
        hasMore: false
      },
      healthMetrics: {
        totalProducts: processedProducts.length,
        healthyProducts: processedProducts.length,
        unhealthyProducts: 0,
        overallHealthScore: 100,
        architecture: 'v2_preserved_admin'
      }
    };

    console.log('✅ Vendor products response (UNIFIED FORMAT):', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('❌ Error in getVendorProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits vendeur',
      error: error.message
    });
  }
}

/**
 * POST /vendor/design-position
 * Save design position using unified calculation
 */
async function saveDesignPosition(req, res) {
  try {
    console.log('💾 === POST /vendor/design-position (UNIFIED) ===');
    const { vendorProductId, designId, position } = req.body;

    // Use unified calculation for consistency
    const calculatedPosition = calculateDesignPosition({
      designId,
      productId: vendorProductId,
      adminDelimitations: [], // TODO: Get from database
      existingPosition: position
    });

    // TODO: Save to database
    console.log(`✅ Saved unified position for product ${vendorProductId}:`, calculatedPosition);

    res.json({
      success: true,
      message: 'Position sauvegardée avec le système unifié',
      position: calculatedPosition
    });

  } catch (error) {
    console.error('❌ Error in saveDesignPosition:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde de la position',
      error: error.message
    });
  }
}

module.exports = {
  getVendorProducts,
  saveDesignPosition
};
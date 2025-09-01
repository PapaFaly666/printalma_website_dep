/**
 * PUBLIC API CONTROLLER - FIXED VERSION
 * 
 * This controller ensures the /public/new-arrivals endpoint
 * returns data in the SAME FORMAT as /vendor/products
 * 
 * According to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

const { calculateDesignPosition, formatDesignPositions, createEmptyDesignTransforms } = require('../utils/designPositionCalculator');
const { normalizeDelimitations } = require('../utils/delimitationConverter');

/**
 * GET /public/new-arrivals - FIXED VERSION
 * Returns new arrivals with consistent format matching /vendor/products
 */
async function getNewArrivals(req, res) {
  try {
    console.log('🔥 === GET /public/new-arrivals (FIXED VERSION) ===');
    
    // TODO: Replace with actual database query
    // This is a mock implementation showing the correct format
    const mockNewArrivals = [
      {
        id: 1,
        name: "Design T-Shirt Cool",
        price: 15000,
        description: "Design moderne pour t-shirt",
        designId: 9,
        designUrl: "https://example.com/design.png",
        designWidth: 200,
        designHeight: 200,
        designScale: 0.85,
        // Raw position data from database
        rawDesignPosition: {
          x: -1.323659752186181,
          y: 6.840766094438479,
          scale: 0.85,
          rotation: 0
        },
        baseProduct: {
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
                  view: "FRONT",
                  naturalWidth: 800,
                  naturalHeight: 1000,
                  // Raw delimitations in pixels (will be converted)
                  rawDelimitations: [
                    {
                      x: 378.9581298828125,
                      y: 236.7476168252855,
                      width: 406.6666666666667,
                      height: 476.6666302998888
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ];

    // Process each product to match vendor/products format EXACTLY
    const processedProducts = mockNewArrivals.map(product => {
      console.log(`🔄 Processing product ${product.id}`);
      
      // Calculate unified design position
      const designPosition = calculateDesignPosition({
        designId: product.designId,
        productId: product.id,
        adminDelimitations: [], // TODO: Get from database
        existingPosition: product.rawDesignPosition
      });

      // Format design positions array (same structure as vendor/products)
      const designPositions = formatDesignPositions(
        { id: product.designId, createdAt: new Date().toISOString() },
        designPosition
      );

      // Process color variations with consistent delimitations
      const processedColorVariations = product.baseProduct.colorVariations.map(variation => ({
        id: variation.id,
        name: variation.name,
        colorCode: variation.colorCode,
        images: variation.images.map(image => ({
          id: image.id,
          url: image.url,
          viewType: image.view, // Consistent property name
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          // ✅ CONVERT TO PERCENTAGE - This is the key fix!
          delimitations: normalizeDelimitations(
            image.rawDelimitations.map(delim => ({
              ...delim,
              coordinateType: 'PIXEL' // Mark as pixels for conversion
            })),
            { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }
          )
        }))
      }));

      // Return EXACT format matching /vendor/products
      return {
        id: product.id,
        vendorName: product.name,
        price: product.price,
        description: product.description,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // ✅ CONSISTENT FORMAT - designPositions array (not designPosition object)
        designPositions: designPositions,
        
        // ✅ CONSISTENT FORMAT - delimitations with PERCENTAGE coordinateType
        delimitations: processedColorVariations[0]?.images[0]?.delimitations || [],
        
        // ✅ CONSISTENT FORMAT - empty designTransforms array
        designTransforms: createEmptyDesignTransforms(),
        
        // Additional product data
        adminProduct: {
          id: product.baseProduct.id,
          name: product.baseProduct.name,
          colorVariations: processedColorVariations
        },
        designApplication: {
          hasDesign: true,
          designUrl: product.designUrl,
          positioning: 'CENTER',
          scale: product.designScale
        }
      };
    });

    // Return response in consistent format
    const response = {
      success: true,
      data: processedProducts,
      pagination: {
        total: processedProducts.length,
        limit: 10,
        offset: 0,
        hasMore: false
      }
    };

    console.log('✅ New arrivals response (UNIFIED FORMAT):', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('❌ Error in getNewArrivals:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des nouveautés',
      error: error.message
    });
  }
}

module.exports = {
  getNewArrivals
};
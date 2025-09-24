/**
 * ADMIN API CONTROLLER - PRODUCT VALIDATION
 *
 * This controller handles admin validation of vendor products,
 * including WIZARD products (products without designs)
 */

/**
 * GET /api/products/admin/pending
 * Returns products pending admin validation
 */
async function getPendingProducts(req, res) {
  try {
    console.log('🔍 === GET /api/products/admin/pending ===');

    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // TODO: Replace with actual database query
    // Mock data representing both WIZARD and TRADITIONAL products
    const mockPendingProducts = [
      {
        id: 1,
        name: "T-Shirt Personnalisé Vendeur A",
        price: 25000,
        status: 'PENDING_VALIDATION',
        submittedAt: new Date().toISOString(),
        // WIZARD product (no designId)
        designId: null,
        designName: null,
        adminProductName: "T-Shirt Basique",
        baseProduct: {
          id: 1,
          name: "T-Shirt Basique"
        },
        // Vendor uploaded images for WIZARD product
        vendorImages: [
          {
            id: 1,
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
            imageType: "base",
            colorName: "Blanc",
            colorCode: "#FFFFFF"
          },
          {
            id: 2,
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v2/sample2.jpg",
            imageType: "detail",
            colorName: "Blanc",
            colorCode: "#FFFFFF"
          }
        ],
        vendor: {
          id: 1,
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@example.com",
          shop_name: "Boutique Jean"
        },
        categories: ["T-Shirts", "Mode"]
      },
      {
        id: 2,
        name: "Mug avec Design Cool",
        price: 15000,
        status: 'PENDING_VALIDATION',
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        // TRADITIONAL product (with design)
        designId: 101,
        designName: "Design Cool Abstract",
        adminProductName: "Mug Céramique",
        baseProduct: {
          id: 2,
          name: "Mug Céramique"
        },
        // Traditional product images (from admin product + design)
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/mug-sample.jpg"
        ],
        vendorImages: [], // Empty for traditional products
        vendor: {
          id: 2,
          firstName: "Marie",
          lastName: "Martin",
          email: "marie.martin@example.com",
          shop_name: "Design Studio Marie"
        },
        categories: ["Mugs", "Maison"]
      },
      {
        id: 3,
        name: "Hoodie Vintage Personnalisé",
        price: 45000,
        status: 'PENDING_VALIDATION',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        // WIZARD product with multiple colors
        designId: null,
        designName: null,
        adminProductName: "Hoodie Premium",
        baseProduct: {
          id: 3,
          name: "Hoodie Premium"
        },
        vendorImages: [
          {
            id: 3,
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/hoodie-black.jpg",
            imageType: "base",
            colorName: "Noir",
            colorCode: "#000000"
          },
          {
            id: 4,
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/hoodie-white.jpg",
            imageType: "base",
            colorName: "Blanc",
            colorCode: "#FFFFFF"
          },
          {
            id: 5,
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/hoodie-detail.jpg",
            imageType: "detail",
            colorName: "Noir",
            colorCode: "#000000"
          }
        ],
        vendor: {
          id: 3,
          firstName: "Pierre",
          lastName: "Leroy",
          email: "pierre.leroy@example.com",
          shop_name: "Vintage Style"
        },
        categories: ["Hoodies", "Streetwear"]
      }
    ];

    // Apply search filter
    let filteredProducts = mockPendingProducts;
    if (search.trim()) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.vendor.firstName.toLowerCase().includes(search.toLowerCase()) ||
        product.vendor.lastName.toLowerCase().includes(search.toLowerCase()) ||
        product.vendor.shop_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredProducts.length / limit),
        totalItems: filteredProducts.length,
        itemsPerPage: parseInt(limit)
      }
    };

    console.log(`📦 Returning ${paginatedProducts.length} pending products (${filteredProducts.length} total)`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in getPendingProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des produits en attente',
      error: error.message
    });
  }
}

/**
 * POST /api/products/:id/validate
 * Validate or reject a product
 */
async function validateProduct(req, res) {
  try {
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    console.log(`✅ === POST /api/products/${id}/validate ===`);
    console.log(`   Approved: ${approved}`);
    console.log(`   Reason: ${rejectionReason || 'N/A'}`);

    // TODO: Replace with actual database operations
    // 1. Update product status in database
    // 2. If approved: status = 'APPROVED', make product visible
    // 3. If rejected: status = 'REJECTED', store rejection reason
    // 4. Send notification to vendor

    // Simulate validation
    const mockValidatedProduct = {
      id: parseInt(id),
      status: approved ? 'APPROVED' : 'REJECTED',
      validatedAt: new Date().toISOString(),
      validatedBy: 'admin', // TODO: Get from authentication
      rejectionReason: approved ? null : rejectionReason
    };

    console.log(`📋 Product ${id} ${approved ? 'approved' : 'rejected'}`);

    res.json({
      success: true,
      message: `Produit ${approved ? 'approuvé' : 'rejeté'} avec succès`,
      data: mockValidatedProduct
    });

  } catch (error) {
    console.error('❌ Error in validateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du produit',
      error: error.message
    });
  }
}

/**
 * GET /api/products/admin/stats
 * Get validation statistics for admin dashboard
 */
async function getValidationStats(req, res) {
  try {
    console.log('📊 === GET /api/products/admin/stats ===');

    // TODO: Replace with actual database queries
    const mockStats = {
      pending: 15,
      approved: 234,
      rejected: 12,
      wizardProducts: 8,  // Products without designs
      traditionalProducts: 7  // Products with designs
    };

    res.json({
      success: true,
      data: mockStats
    });

  } catch (error) {
    console.error('❌ Error in getValidationStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques',
      error: error.message
    });
  }
}

module.exports = {
  getPendingProducts,
  validateProduct,
  getValidationStats
};
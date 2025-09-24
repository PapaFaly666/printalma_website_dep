Curl

curl -X 'GET' \
  'http://localhost:3004/admin/products/validation' \
  -H 'accept: application/json'
Request URL
http://localhost:3004/admin/products/validation



Download
{
  "success": true,
  "message": "Produits en attente récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 150,
        "vendorName": "C63",
        "vendorDescription": "dddddddddddd",
        "vendorStock": 10,
        "status": "PUBLISHED",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": null,
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "Polo",
        "baseProduct": {
          "id": 34,
          "name": "Polo"
        },
        "createdAt": "2025-09-24T09:31:25.459Z",
        "updatedAt": "2025-09-24T09:31:25.459Z",
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "vendorImages": [
          {
            "id": 416,
            "imageType": "base",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758706282/wizard-products/wizard-base-1758706281957.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          },
          {
            "id": 417,
            "imageType": "detail",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758706283/wizard-products/wizard-detail-1758706283387-1.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          },
          {
            "id": 418,
            "imageType": "detail",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758706284/wizard-products/wizard-detail-1758706284113-2.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          }
        ]
      },
      {
        "id": 143,
        "vendorName": "T-shirt Premium modif",
        "vendorDescription": "C'est un t-shirt de qualité supérieure conçu pour sa fiabilité, son confort et sa durabilité.",
        "vendorStock": 10,
        "status": "PENDING",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758378709/designs/7/1758378708651-Comment-dessiner-momo-ayase-dandadan-cours-de-manga-etape-16-890x1024.jpg",
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "T-shirt Premium modif",
        "baseProduct": {
          "id": 2,
          "name": "T-shirt Premium modif"
        },
        "createdAt": "2025-09-22T15:14:52.430Z",
        "updatedAt": "2025-09-24T00:00:02.222Z",
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "vendorImages": [
          {
            "id": 390,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756740411/printalma/1756740410557-Flux_Dev_Realistic_images_for_a_blank_mockup_for_an_ecommerce__1.jpg",
            "colorName": "Blanc",
            "colorCode": "#ffffff",
            "width": null,
            "height": null
          },
          {
            "id": 391,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756740411/printalma/1756740410557-Flux_Dev_Realistic_images_for_a_blank_mockup_for_an_ecommerce__1.jpg",
            "colorName": "Noir",
            "colorCode": "#000000",
            "width": null,
            "height": null
          },
          {
            "id": 392,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756740411/printalma/1756740410557-Flux_Dev_Realistic_images_for_a_blank_mockup_for_an_ecommerce__1.jpg",
            "colorName": "Rouge",
            "colorCode": "#d40202",
            "width": null,
            "height": null
          },
          {
            "id": 393,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756740411/printalma/1756740410557-Flux_Dev_Realistic_images_for_a_blank_mockup_for_an_ecommerce__1.jpg",
            "colorName": "Bleu",
            "colorCode": "#1b57d0",
            "width": null,
            "height": null
          }
        ]
      },
      {
        "id": 142,
        "vendorName": "Mugs",
        "vendorDescription": "Mugs pour conservation",
        "vendorStock": 10,
        "status": "PENDING",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758378709/designs/7/1758378708651-Comment-dessiner-momo-ayase-dandadan-cours-de-manga-etape-16-890x1024.jpg",
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "Mugs",
        "baseProduct": {
          "id": 33,
          "name": "Mugs"
        },
        "createdAt": "2025-09-22T15:14:50.137Z",
        "updatedAt": "2025-09-24T00:00:02.222Z",
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "vendorImages": [
          {
            "id": 388,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757520701/printalma/1757520700536-Mug_noir.jpg",
            "colorName": "Noir",
            "colorCode": "#000000",
            "width": null,
            "height": null
          },
          {
            "id": 389,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757520701/printalma/1757520700536-Mug_noir.jpg",
            "colorName": "Rouge",
            "colorCode": "#ec0909",
            "width": null,
            "height": null
          }
        ]
      },
      {
        "id": 141,
        "vendorName": "Polo",
        "vendorDescription": "Polos avec toute les couleurs disponible",
        "vendorStock": 100,
        "status": "PENDING",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758378709/designs/7/1758378708651-Comment-dessiner-momo-ayase-dandadan-cours-de-manga-etape-16-890x1024.jpg",
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "Polo",
        "baseProduct": {
          "id": 34,
          "name": "Polo"
        },
        "createdAt": "2025-09-22T15:14:46.951Z",
        "updatedAt": "2025-09-24T00:00:02.222Z",
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "vendorImages": [
          {
            "id": 386,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757606095/printalma/1757606094551-Polo_blanc.jpg",
            "colorName": "Blanc",
            "colorCode": "#ffffff",
            "width": null,
            "height": null
          },
          {
            "id": 387,
            "imageType": "admin_reference",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757606095/printalma/1757606094551-Polo_blanc.jpg",
            "colorName": "Rouge",
            "colorCode": "#f00a0a",
            "width": null,
            "height": null
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 4,
      "itemsPerPage": 20,
      "hasNext": false,
      "hasPrevious": false
    },
    "stats": {
      "pending": 5,
      "validated": 1,
      "rejected": 0,
      "total": 6,
      "wizardProducts": 4,
      "traditionalProducts": 0
    }
  }
}
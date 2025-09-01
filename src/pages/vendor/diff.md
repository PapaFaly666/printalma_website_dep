Pour l'affichage des produits vendeur dans /vendeur/products : 

curl -X 'GET' \
  'http://localhost:3004/vendor/products' \
  -H 'accept: application/json'
Request URL
http://localhost:3004/vendor/products

	
Response body
Download
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 140,
        "vendorName": "dzdez",
        "originalAdminName": "dzdez",
        "description": "dddddddddddddddd",
        "price": 12000,
        "stock": 10,
        "status": "PUBLISHED",
        "createdAt": "2025-08-29T10:59:50.208Z",
        "updatedAt": "2025-08-29T11:00:13.289Z",
        "isDelete": false,
        "bestSeller": {
          "isBestSeller": false,
          "salesCount": 0,
          "totalRevenue": 0
        },
        "adminProduct": {
          "id": 25,
          "name": "dzdez",
          "description": "dddddddddddddddd",
          "price": 12000,
          "colorVariations": [
            {
              "id": 46,
              "name": "dzd",
              "colorCode": "#000000",
              "images": [
                {
                  "id": 50,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756298929/printalma/1756298928489-T-Shirt_Premium_Noir.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 378.9581298828125,
                      "y": 236.7476168252855,
                      "width": 406.6666666666667,
                      "height": 476.6666302998888,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "positioning": "CENTER",
          "scale": 0.5411234048909667,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "One piece",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "tags": [],
          "isValidated": true,
          "validatedAt": "2025-08-27T12:53:24.057Z",
          "createdAt": "2025-08-27T10:18:39.097Z"
        },
        "designTransforms": [],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": 2,
              "y": -44.87754680897572,
              "scale": 0.5411234048909667,
              "rotation": 0,
              "constraints": {},
              "designWidth": 200,
              "designHeight": 200
            },
            "createdAt": "2025-08-29T10:59:50.228Z",
            "updatedAt": "2025-08-29T10:59:50.228Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Nicaise Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "dzd",
              "colorCode": "#000000",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756298929/printalma/1756298928489-T-Shirt_Premium_Noir.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756298929/printalma/1756298928489-T-Shirt_Premium_Noir.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          {
            "id": 106,
            "sizeName": "XS"
          },
          {
            "id": 107,
            "sizeName": "S"
          },
          {
            "id": 108,
            "sizeName": "M"
          },
          {
            "id": 109,
            "sizeName": "L"
          },
          {
            "id": 110,
            "sizeName": "XL"
          },
          {
            "id": 111,
            "sizeName": "XXL"
          },
          {
            "id": 112,
            "sizeName": "3XL"
          }
        ],
        "selectedColors": [
          {
            "id": 46,
            "name": "dzd",
            "colorCode": "#000000"
          }
        ],
        "designId": 9
      },
      {
        "id": 139,
        "vendorName": "dzazfda",
        "originalAdminName": "dzazfda",
        "description": "dddddddddddddddd",
        "price": 12999,
        "stock": 10,
        "status": "PUBLISHED",
        "createdAt": "2025-08-29T10:59:50.092Z",
        "updatedAt": "2025-08-29T11:10:51.341Z",
        "isDelete": false,
        "bestSeller": {
          "isBestSeller": false,
          "salesCount": 0,
          "totalRevenue": 0
        },
        "adminProduct": {
          "id": 26,
          "name": "dzazfda",
          "description": "dddddddddddddddd",
          "price": 12999,
          "colorVariations": [
            {
              "id": 47,
              "name": "dzd",
              "colorCode": "#000000",
              "images": [
                {
                  "id": 51,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756304078/printalma/1756304077705-Mug_bleu.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 363.9546769428942,
                      "y": 391.6013600945877,
                      "width": 406.172446847609,
                      "height": 422.5616311068304,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "positioning": "CENTER",
          "scale": 0.6473652247200262,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "One piece",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "tags": [],
          "isValidated": true,
          "validatedAt": "2025-08-27T12:53:24.057Z",
          "createdAt": "2025-08-27T10:18:39.097Z"
        },
        "designTransforms": [],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": 0,
              "y": 0,
              "scale": 0.6473652247200262,
              "rotation": 0,
              "constraints": {},
              "designWidth": 200,
              "designHeight": 200
            },
            "createdAt": "2025-08-29T10:59:50.110Z",
            "updatedAt": "2025-08-29T10:59:50.110Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Nicaise Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "dzd",
              "colorCode": "#000000",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756304078/printalma/1756304077705-Mug_bleu.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756304078/printalma/1756304077705-Mug_bleu.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          {
            "id": 113,
            "sizeName": "250ml"
          },
          {
            "id": 114,
            "sizeName": "300ml"
          },
          {
            "id": 115,
            "sizeName": "350ml"
          },
          {
            "id": 116,
            "sizeName": "400ml"
          },
          {
            "id": 117,
            "sizeName": "500ml"
          }
        ],
        "selectedColors": [
          {
            "id": 47,
            "name": "dzd",
            "colorCode": "#000000"
          }
        ],
        "designId": 9
      },
      {
        "id": 138,
        "vendorName": "jjedd",
        "originalAdminName": "jjedd",
        "description": "eeeeeeeeeeeeee",
        "price": 12000,
        "stock": 10,
        "status": "PENDING",
        "createdAt": "2025-08-29T10:59:49.903Z",
        "updatedAt": "2025-08-29T10:59:49.903Z",
        "isDelete": false,
        "bestSeller": {
          "isBestSeller": false,
          "salesCount": 0,
          "totalRevenue": 0
        },
        "adminProduct": {
          "id": 28,
          "name": "jjedd",
          "description": "eeeeeeeeeeeeee",
          "price": 12000,
          "colorVariations": [
            {
              "id": 48,
              "name": "ded",
              "colorCode": "#000000",
              "images": [
                {
                  "id": 52,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337350/printalma/1756337349188-Mockup_gourde_noir.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 448.6663603227719,
                      "y": 427.0920486729328,
                      "width": 296.3061292576821,
                      "height": 529.0338531180004,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "positioning": "CENTER",
          "scale": 0.560089165393337,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "One piece",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "tags": [],
          "isValidated": true,
          "validatedAt": "2025-08-27T12:53:24.057Z",
          "createdAt": "2025-08-27T10:18:39.097Z"
        },
        "designTransforms": [],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": -26.74289567343422,
              "y": -47.74756829058339,
              "scale": 0.560089165393337,
              "rotation": 0,
              "constraints": {},
              "designWidth": 200,
              "designHeight": 200
            },
            "createdAt": "2025-08-29T10:59:49.919Z",
            "updatedAt": "2025-08-29T10:59:49.919Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Nicaise Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "ded",
              "colorCode": "#000000",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337350/printalma/1756337349188-Mockup_gourde_noir.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337350/printalma/1756337349188-Mockup_gourde_noir.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          {
            "id": 118,
            "sizeName": "XS"
          },
          {
            "id": 119,
            "sizeName": "S"
          },
          {
            "id": 120,
            "sizeName": "M"
          },
          {
            "id": 121,
            "sizeName": "L"
          },
          {
            "id": 122,
            "sizeName": "XL"
          },
          {
            "id": 123,
            "sizeName": "XXL"
          },
          {
            "id": 124,
            "sizeName": "3XL"
          }
        ],
        "selectedColors": [
          {
            "id": 48,
            "name": "ded",
            "colorCode": "#000000"
          }
        ],
        "designId": 9
      },
      {
        "id": 137,
        "vendorName": "dezefz",
        "originalAdminName": "dezefz",
        "description": "eeeeeeeeee",
        "price": 129990,
        "stock": 10,
        "status": "PUBLISHED",
        "createdAt": "2025-08-29T10:59:49.715Z",
        "updatedAt": "2025-08-29T11:12:03.857Z",
        "isDelete": false,
        "bestSeller": {
          "isBestSeller": false,
          "salesCount": 0,
          "totalRevenue": 0
        },
        "adminProduct": {
          "id": 29,
          "name": "dezefz",
          "description": "eeeeeeeeee",
          "price": 129990,
          "colorVariations": [
            {
              "id": 49,
              "name": "dssd",
              "colorCode": "#ed1212",
              "images": [
                {
                  "id": 53,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337728/printalma/1756337727043-Mockup_gourde_rouge.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 458.6542073764016,
                      "y": 407.9910878468343,
                      "width": 259.684023394373,
                      "height": 598.9062488128308,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "positioning": "CENTER",
          "scale": 0.4335971179281001,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "One piece",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "tags": [],
          "isValidated": true,
          "validatedAt": "2025-08-27T12:53:24.057Z",
          "createdAt": "2025-08-27T10:18:39.097Z"
        },
        "designTransforms": [],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": -30.1779085112101,
              "y": -69.59896010243837,
              "scale": 0.4335971179281001,
              "rotation": 0,
              "constraints": {},
              "designWidth": 200,
              "designHeight": 200
            },
            "createdAt": "2025-08-29T10:59:49.735Z",
            "updatedAt": "2025-08-29T10:59:49.735Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Nicaise Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "dssd",
              "colorCode": "#ed1212",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337728/printalma/1756337727043-Mockup_gourde_rouge.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337728/printalma/1756337727043-Mockup_gourde_rouge.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          {
            "id": 125,
            "sizeName": "250ml"
          },
          {
            "id": 126,
            "sizeName": "300ml"
          },
          {
            "id": 127,
            "sizeName": "350ml"
          },
          {
            "id": 128,
            "sizeName": "400ml"
          },
          {
            "id": 129,
            "sizeName": "500ml"
          }
        ],
        "selectedColors": [
          {
            "id": 49,
            "name": "dssd",
            "colorCode": "#ed1212"
          }
        ],
        "designId": 9
      },
      {
        "id": 136,
        "vendorName": "dgrg",
        "originalAdminName": "dgrg",
        "description": "ddddddddd",
        "price": 12000,
        "stock": 10,
        "status": "PENDING",
        "createdAt": "2025-08-29T10:59:49.546Z",
        "updatedAt": "2025-08-29T11:32:45.974Z",
        "isDelete": false,
        "bestSeller": {
          "isBestSeller": false,
          "salesCount": 0,
          "totalRevenue": 0
        },
        "adminProduct": {
          "id": 30,
          "name": "dgrg",
          "description": "ddddddddd",
          "price": 12000,
          "colorVariations": [
            {
              "id": 50,
              "name": "fff",
              "colorCode": "#000000",
              "images": [
                {
                  "id": 54,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756338062/printalma/1756338061113-Mockup_gourde_noir.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 451.9956426739817,
                      "y": 379.1549456686621,
                      "width": 302.9646939601019,
                      "height": 612.2152765642269,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "positioning": "CENTER",
          "scale": 0.85,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "One piece",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "tags": [],
          "isValidated": true,
          "validatedAt": "2025-08-27T12:53:24.057Z",
          "createdAt": "2025-08-27T10:18:39.097Z"
        },
        "designTransforms": [],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": -1.323659752186181,
              "y": 6.840766094438479,
              "scale": 0.85,
              "rotation": 0,
              "constraints": {},
              "designWidth": 200,
              "designHeight": 200
            },
            "createdAt": "2025-08-29T10:59:49.561Z",
            "updatedAt": "2025-08-29T10:59:49.561Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Nicaise Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "fff",
              "colorCode": "#000000",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756338062/printalma/1756338061113-Mockup_gourde_noir.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756338062/printalma/1756338061113-Mockup_gourde_noir.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          {
            "id": 130,
            "sizeName": "XS"
          },
          {
            "id": 131,
            "sizeName": "S"
          },
          {
            "id": 132,
            "sizeName": "M"
          },
          {
            "id": 133,
            "sizeName": "L"
          },
          {
            "id": 134,
            "sizeName": "XL"
          },
          {
            "id": 135,
            "sizeName": "XXL"
          },
          {
            "id": 136,
            "sizeName": "3XL"
          }
        ],
        "selectedColors": [
          {
            "id": 50,
            "name": "fff",
            "colorCode": "#000000"
          }
        ],
        "designId": 9
      },
      {
        "id": 135,
        "vendorName": "deada",
        "originalAdminName": "deada",
        "description": "dddddddddddd",
        "price": 12000,
        "stock": 10,
        "status": "PENDING",
        "createdAt": "2025-08-29T10:59:49.359Z",
        "updatedAt": "2025-08-29T11:33:36.742Z",
        "isDelete": false,
        "bestSeller": {
          "isBestSeller": false,
          "salesCount": 0,
          "totalRevenue": 0
        },
        "adminProduct": {
          "id": 31,
          "name": "deada",
          "description": "dddddddddddd",
          "price": 12000,
          "colorVariations": [
            {
              "id": 51,
              "name": "rff",
              "colorCode": "#b48888",
              "images": [
                {
                  "id": 55,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756393199/printalma/1756393198299-Mockup_gourde_bleu.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 452.2914632161459,
                      "y": 396.7476046182553,
                      "width": 273.3333333333334,
                      "height": 563.3332903544141,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "positioning": "CENTER",
          "scale": 0.4660038206089953,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "One piece",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1756289898512",
          "tags": [],
          "isValidated": true,
          "validatedAt": "2025-08-27T12:53:24.057Z",
          "createdAt": "2025-08-27T10:18:39.097Z"
        },
        "designTransforms": [],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": -8.411762326558438,
              "y": -17.33643566743706,
              "scale": 0.4660038206089953,
              "rotation": 0,
              "constraints": {},
              "designWidth": 200,
              "designHeight": 200
            },
            "createdAt": "2025-08-29T10:59:49.426Z",
            "updatedAt": "2025-08-29T10:59:49.426Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Nicaise Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "rff",
              "colorCode": "#b48888",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756393199/printalma/1756393198299-Mockup_gourde_bleu.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756393199/printalma/1756393198299-Mockup_gourde_bleu.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          {
            "id": 137,
            "sizeName": "Unique"
          },
          {
            "id": 138,
            "sizeName": "Ajustable"
          },
          {
            "id": 139,
            "sizeName": "56cm"
          },
          {
            "id": 140,
            "sizeName": "58cm"
          },
          {
            "id": 141,
            "sizeName": "60cm"
          },
          {
            "id": 142,
            "sizeName": "62cm"
          }
        ],
        "selectedColors": [
          {
            "id": 51,
            "name": "rff",
            "colorCode": "#b48888"
          }
        ],
        "designId": 9
      }
    ],
    "pagination": {
      "total": 6,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    },
    "healthMetrics": {
      "totalProducts": 6,
      "healthyProducts": 6,
      "unhealthyProducts": 0,
      "overallHealthScore": 100,
      "architecture": "v2_preserved_admin"
    }
  },
  "architecture": "v2_preserved_admin"
}





Et pour les nouveaux arrivage dans  @NouveauteSection.tsx il utilise :

Curl

curl -X 'GET' \
  'http://localhost:3004/public/new-arrivals' \
  -H 'accept: */*'
Request URL
http://localhost:3004/public/new-arrivals



	
Response body
Download
{
  "success": true,
  "data": [
    {
      "id": 140,
      "name": "dzdez",
      "description": "dddddddddddddddd",
      "price": 12000,
      "salesCount": 0,
      "totalRevenue": 0,
      "bestSellerRank": 999,
      "averageRating": null,
      "viewsCount": 0,
      "designCloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
      "designWidth": 200,
      "designHeight": 200,
      "designFormat": null,
      "designScale": 0.5411234048909667,
      "designPositioning": "CENTER",
      "designPosition": {
        "x": 2,
        "y": -44.87754680897572,
        "scale": 0.5411234048909667,
        "rotation": 0,
        "designWidth": 200,
        "designHeight": 200
      },
      "baseProduct": {
        "id": 25,
        "name": "dzdez",
        "genre": "UNISEXE",
        "categories": [
          {
            "id": 1,
            "name": "Vêtements > T-shirts"
          }
        ],
        "colorVariations": [
          {
            "id": 46,
            "name": "dzd",
            "colorCode": "#000000",
            "images": [
              {
                "id": 50,
                "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756298929/printalma/1756298928489-T-Shirt_Premium_Noir.jpg",
                "view": "Front",
                "naturalWidth": 1200,
                "naturalHeight": 1200,
                "delimitations": [
                  {
                    "id": 49,
                    "name": null,
                    "x": 378.9581298828125,
                    "y": 236.7476168252855,
                    "width": 406.6666666666667,
                    "height": 476.6666302998888
                  }
                ]
              }
            ]
          }
        ]
      },
      "vendor": {
        "id": 2,
        "firstName": "Nicaise",
        "lastName": "Faly",
        "email": "pf.d@zig.univ.sn",
        "profilePhotoUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg",
        "businessName": "C'est carré"
      },
      "createdAt": "2025-08-29T10:59:50.208Z",
      "lastSaleDate": null
    },
    {
      "id": 139,
      "name": "dzazfda",
      "description": "dddddddddddddddd",
      "price": 12999,
      "salesCount": 0,
      "totalRevenue": 0,
      "bestSellerRank": 999,
      "averageRating": null,
      "viewsCount": 0,
      "designCloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
      "designWidth": 200,
      "designHeight": 200,
      "designFormat": null,
      "designScale": 0.6473652247200262,
      "designPositioning": "CENTER",
      "designPosition": {
        "x": 0,
        "y": 0,
        "scale": 0.6473652247200262,
        "rotation": 0,
        "designWidth": 200,
        "designHeight": 200
      },
      "baseProduct": {
        "id": 26,
        "name": "dzazfda",
        "genre": "UNISEXE",
        "categories": [
          {
            "id": 2,
            "name": "Objets > Mugs"
          }
        ],
        "colorVariations": [
          {
            "id": 47,
            "name": "dzd",
            "colorCode": "#000000",
            "images": [
              {
                "id": 51,
                "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756304078/printalma/1756304077705-Mug_bleu.jpg",
                "view": "Front",
                "naturalWidth": 1200,
                "naturalHeight": 1200,
                "delimitations": [
                  {
                    "id": 50,
                    "name": null,
                    "x": 363.9546769428942,
                    "y": 391.6013600945877,
                    "width": 406.172446847609,
                    "height": 422.5616311068304
                  }
                ]
              }
            ]
          }
        ]
      },
      "vendor": {
        "id": 2,
        "firstName": "Nicaise",
        "lastName": "Faly",
        "email": "pf.d@zig.univ.sn",
        "profilePhotoUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg",
        "businessName": "C'est carré"
      },
      "createdAt": "2025-08-29T10:59:50.092Z",
      "lastSaleDate": null
    },
    {
      "id": 137,
      "name": "dezefz",
      "description": "eeeeeeeeee",
      "price": 129990,
      "salesCount": 0,
      "totalRevenue": 0,
      "bestSellerRank": 999,
      "averageRating": null,
      "viewsCount": 0,
      "designCloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756289909/vendor-designs/vendor_2_design_1756289898512.png",
      "designWidth": 200,
      "designHeight": 200,
      "designFormat": null,
      "designScale": 0.4335971179281001,
      "designPositioning": "CENTER",
      "designPosition": {
        "x": -30.1779085112101,
        "y": -69.59896010243837,
        "scale": 0.4335971179281001,
        "rotation": 0,
        "designWidth": 200,
        "designHeight": 200
      },
      "baseProduct": {
        "id": 29,
        "name": "dezefz",
        "genre": "UNISEXE",
        "categories": [
          {
            "id": 2,
            "name": "Objets > Mugs"
          }
        ],
        "colorVariations": [
          {
            "id": 49,
            "name": "dssd",
            "colorCode": "#ed1212",
            "images": [
              {
                "id": 53,
                "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1756337728/printalma/1756337727043-Mockup_gourde_rouge.jpg",
                "view": "Front",
                "naturalWidth": 1200,
                "naturalHeight": 1200,
                "delimitations": [
                  {
                    "id": 52,
                    "name": null,
                    "x": 458.6542073764016,
                    "y": 407.9910878468343,
                    "width": 259.684023394373,
                    "height": 598.9062488128308
                  }
                ]
              }
            ]
          }
        ]
      },
      "vendor": {
        "id": 2,
        "firstName": "Nicaise",
        "lastName": "Faly",
        "email": "pf.d@zig.univ.sn",
        "profilePhotoUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1754575360/profile-photos/vendor_1754575360327_284437180.jpg",
        "businessName": "C'est carré"
      },
      "createdAt": "2025-08-29T10:59:49.715Z",
      "lastSaleDate": null
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "stats": {
    "totalBestSellers": 0,
    "categoriesCount": 0,
    "vendorsCount": 0
  }
}


Je ne comprends pas la difference. Pourquoi que /vendeur/products ca affiche bien le design dans le produit avec precision comme je l'ai défini et pas dans  @NouveauteSection.tsx  ce quoi leur diffirence. Corrige  @NouveauteSection.tsx  pour que ca affiche exactement le design dans le produit comme dans /vendeur/products
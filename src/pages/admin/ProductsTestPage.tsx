import React from 'react';
import { ProductListModern } from '../../components/admin/ProductListModern';
import { toast } from 'sonner';

// Vos données réelles depuis l'API
const mockProducts = [
  {
    "id": 272,
    "name": "Emerson Sweet",
    "price": 478,
    "stock": 67,
    "status": "DRAFT" as const,
    "description": "Laudantium quasi ni",
    "createdAt": "2025-06-19T17:40:12.391Z",
    "updatedAt": "2025-06-19T17:40:12.391Z",
    "categories": [
      {
        "id": 15,
        "name": "Sacs et Bagages > Tote bags",
        "description": null
      }
    ],
    "sizes": [
      {
        "id": 409,
        "productId": 272,
        "sizeName": "Moyen (35x40cm)"
      },
      {
        "id": 410,
        "productId": 272,
        "sizeName": "Grand (40x45cm)"
      }
    ],
    "colorVariations": [
      {
        "id": 315,
        "name": "kk",
        "colorCode": "#000000",
        "productId": 272,
        "images": [
          {
            "id": 298,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750354833/printalma/1750354810707-T-Shirt_Premium_Noir.jpg",
            "publicId": "printalma/1750354810707-T-Shirt_Premium_Noir",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 315,
            "delimitations": [
              {
                "id": 283,
                "x": 172.3741184721741,
                "y": 112.2142736120204,
                "width": 148.6111052058363,
                "height": 236.1111017288988,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 271,
    "name": "Jillian Payne",
    "price": 492,
    "stock": 64,
    "status": "PUBLISHED" as const,
    "description": "Sequi ut voluptates ",
    "createdAt": "2025-06-19T16:47:46.493Z",
    "updatedAt": "2025-06-19T16:47:46.493Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts",
        "description": null
      }
    ],
    "sizes": [
      {
        "id": 407,
        "productId": 271,
        "sizeName": "XS"
      },
      {
        "id": 408,
        "productId": 271,
        "sizeName": "S"
      }
    ],
    "colorVariations": [
      {
        "id": 313,
        "name": "n",
        "colorCode": "#000000",
        "productId": 271,
        "images": [
          {
            "id": 296,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750351686/printalma/1750351663440-T-Shirt_Premium_Blanc.jpg",
            "publicId": "printalma/1750351663440-T-Shirt_Premium_Blanc",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 313,
            "delimitations": [
              {
                "id": 281,
                "x": 165.1873986514119,
                "y": 116.1820036586212,
                "width": 159.7222158754315,
                "height": 226.388879893003,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      },
      {
        "id": 314,
        "name": "Papa",
        "colorCode": "#000000",
        "productId": 271,
        "images": [
          {
            "id": 297,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750351687/printalma/1750351665357-T-Shirt_Premium_Bleu.jpg",
            "publicId": "printalma/1750351665357-T-Shirt_Premium_Bleu",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 314,
            "delimitations": [
              {
                "id": 282,
                "x": 165.1873986514119,
                "y": 116.1820036586212,
                "width": 159.7222158754315,
                "height": 226.388879893003,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 270,
    "name": "Isabelle Gallegos",
    "price": 195,
    "stock": 59,
    "status": "DRAFT" as const,
    "description": "Eius enim unde sint ",
    "createdAt": "2025-06-18T16:53:02.041Z",
    "updatedAt": "2025-06-18T16:53:02.041Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts",
        "description": null
      }
    ],
    "sizes": [
      {
        "id": 405,
        "productId": 270,
        "sizeName": "L"
      },
      {
        "id": 406,
        "productId": 270,
        "sizeName": "M"
      }
    ],
    "colorVariations": [
      {
        "id": 310,
        "name": "ddd",
        "colorCode": "#000000",
        "productId": 270,
        "images": [
          {
            "id": 293,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750265599/printalma/1750265575695-T-Shirt_Premium_Noir.jpg",
            "publicId": "printalma/1750265575695-T-Shirt_Premium_Noir",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 310,
            "delimitations": [
              {
                "id": 278,
                "x": 162.0062934027778,
                "y": 112.6410590277778,
                "width": 166.6666666666667,
                "height": 272.2222222222222,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      },
      {
        "id": 311,
        "name": "Mbodji",
        "colorCode": "#fb2323",
        "productId": 270,
        "images": [
          {
            "id": 294,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750265600/printalma/1750265577489-T-Shirt_Premium_Rouge.jpg",
            "publicId": "printalma/1750265577489-T-Shirt_Premium_Rouge",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 311,
            "delimitations": [
              {
                "id": 279,
                "x": 162.0062934027778,
                "y": 112.6410590277778,
                "width": 166.6666666666667,
                "height": 272.2222222222222,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      },
      {
        "id": 312,
        "name": "Dolore",
        "colorCode": "#4627b4",
        "productId": 270,
        "images": [
          {
            "id": 295,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750265601/printalma/1750265578937-T-Shirt_Premium_Bleu.jpg",
            "publicId": "printalma/1750265578937-T-Shirt_Premium_Bleu",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 312,
            "delimitations": [
              {
                "id": 280,
                "x": 162.0062934027778,
                "y": 112.6410590277778,
                "width": 166.6666666666667,
                "height": 272.2222222222222,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 267,
    "name": "TShirt Standard",
    "price": 5000,
    "stock": 100,
    "status": "PUBLISHED" as const,
    "description": "Tshirt standard bon pour l'été",
    "createdAt": "2025-06-18T14:38:03.848Z",
    "updatedAt": "2025-06-18T14:38:03.848Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts",
        "description": null
      }
    ],
    "sizes": [
      {
        "id": 396,
        "productId": 267,
        "sizeName": "XS"
      },
      {
        "id": 397,
        "productId": 267,
        "sizeName": "S"
      },
      {
        "id": 398,
        "productId": 267,
        "sizeName": "L"
      },
      {
        "id": 399,
        "productId": 267,
        "sizeName": "M"
      },
      {
        "id": 400,
        "productId": 267,
        "sizeName": "XL"
      }
    ],
    "colorVariations": [
      {
        "id": 302,
        "name": "Blanc",
        "colorCode": "#f5f5f5",
        "productId": 267,
        "images": [
          {
            "id": 285,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750257506/printalma/1750257483861-T-shirt_Blanc.jpg",
            "publicId": "printalma/1750257483861-T-shirt_Blanc",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 302,
            "delimitations": [
              {
                "id": 268,
                "x": 168.9507378472222,
                "y": 84.20138888888891,
                "width": 160.2112676056338,
                "height": 276.8595041322313,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      },
      {
        "id": 303,
        "name": "Bleu",
        "colorCode": "#1475b8",
        "productId": 267,
        "images": [
          {
            "id": 286,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750257507/printalma/1750257485070-T-shirt_Bleu.jpg",
            "publicId": "printalma/1750257485070-T-shirt_Bleu",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 303,
            "delimitations": [
              {
                "id": 269,
                "x": 171.728515625,
                "y": 84.56488715277779,
                "width": 154.4921875,
                "height": 276.2731481481482,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      },
      {
        "id": 304,
        "name": "Noir",
        "colorCode": "#323031",
        "productId": 267,
        "images": [
          {
            "id": 287,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750257509/printalma/1750257486474-T-shirt_Noir.jpg",
            "publicId": "printalma/1750257486474-T-shirt_Noir",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 304,
            "delimitations": [
              {
                "id": 270,
                "x": 167.5618489583333,
                "y": 78.33116319444447,
                "width": 158.5537918871252,
                "height": 319.4444444444444,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      },
      {
        "id": 305,
        "name": "Rouge",
        "colorCode": "#b31717",
        "productId": 267,
        "images": [
          {
            "id": 288,
            "view": "Front",
            "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750257510/printalma/1750257487548-T-shirt_Rouge.jpg",
            "publicId": "printalma/1750257487548-T-shirt_Rouge",
            "naturalWidth": 1200,
            "naturalHeight": 1200,
            "colorVariationId": 305,
            "delimitations": [
              {
                "id": 271,
                "x": 168.9507378472222,
                "y": 89.11132812500003,
                "width": 165.5658436213992,
                "height": 298.8980716253443,
                "rotation": 0,
                "coordinateType": "PERCENTAGE" as const,
                "originalImageWidth": 1200,
                "originalImageHeight": 1200
              }
            ]
          }
        ]
      }
    ]
  }
];

export const ProductsTestPage: React.FC = () => {
  const handleEditProduct = (product: any) => {
    console.log('✏️ Modifier le produit:', product);
    toast.success(`Redirection vers l'édition de "${product.name}"`);
  };

  const handleViewProduct = (product: any) => {
    console.log('👁️ Voir le produit:', product);
    toast.success(`Affichage des détails de "${product.name}"`);
  };

  const handleDeleteProduct = async (id: number) => {
    console.log('🗑️ Supprimer le produit ID:', id);
    toast.success(`Produit ID ${id} supprimé`);
  };

  const handleRefresh = () => {
    console.log('🔄 Actualiser la liste');
    toast.info('Liste des produits actualisée');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🧪 Page de test - Interface admin moderne
          </h2>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            Cette page utilise vos vraies données API pour tester l'interface de gestion des produits avec sliders.
          </p>
        </div>

        <ProductListModern
          products={mockProducts}
          loading={false}
          onEditProduct={handleEditProduct}
          onViewProduct={handleViewProduct}
          onDeleteProduct={handleDeleteProduct}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}; 
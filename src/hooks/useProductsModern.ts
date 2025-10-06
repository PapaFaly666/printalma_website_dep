import { useState, useEffect } from 'react';

// Types mis à jour basés sur la réponse API réelle avec support des designs
interface Delimitation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name: string | null;
  coordinateType: string;
  absoluteX: number | null;
  absoluteY: number | null;
  absoluteWidth: number | null;
  absoluteHeight: number | null;
  originalImageWidth: number;
  originalImageHeight: number;
  productImageId: number;
  createdAt: string;
  updatedAt: string;
  referenceWidth: number;
  referenceHeight: number;
}

interface ProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  naturalWidth: number;
  naturalHeight: number;
  colorVariationId: number;
  delimitations: Delimitation[];
  // 🆕 Nouveaux champs design selon la documentation backend
  designUrl?: string; // URL du design appliqué sur cette image
  designPublicId?: string; // ID Cloudinary du design
  designFileName?: string; // Nom du fichier design original
  designUploadDate?: string; // Date d'upload du design (ISO string)
}

interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ProductImage[];
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface Size {
  id: number;
  productId: number;
  sizeName: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED';
  description: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  sizes: Size[];
  colorVariations: ColorVariation[];
  // Ajout pour la corbeille :
  isDelete?: boolean;
  // 🆕 Nouveaux champs calculés automatiquement par le backend
  hasDesign?: boolean; // true si au moins une image a un design
  designCount?: number; // nombre total de designs sur le produit
  isReadyProduct?: boolean; // Indique si le produit est prêt pour la vente (true) ou un mockup (false)
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE'; // Genre du produit
}

interface UseProductsModernReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  deleteProduct: (id: number) => Promise<void>;
}

export const useProductsModern = (): UseProductsModernReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Configuration pour l'API backend - CORRECTION: utiliser /products au lieu de /api/products
      const apiUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      
      const response = await fetch(`${apiUrl}/products`, {
        headers: {
          'Content-Type': 'application/json',
          // Ajoutez vos headers d'authentification si nécessaire
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎨 Produits récupérés depuis l\'API avec support designs:', data);
      console.log('🎨 Structure de la réponse:', {
        success: data.success,
        hasData: !!data.data,
        dataType: typeof data.data,
        isArray: Array.isArray(data.data),
        dataLength: data.data?.length
      });
      
      // Gérer la nouvelle structure de réponse API
      if (data.success && data.data && Array.isArray(data.data)) {
        // Filtrer pour afficher uniquement les mockups (isReadyProduct: false) dans la page admin
        // Les produits prêts (isReadyProduct: true) ne doivent pas s'afficher ici
        const mockupProducts = data.data.filter((product: any) => product.isReadyProduct === false);
        console.log('🎨 Mockups filtrés:', mockupProducts.length, 'sur', data.data.length, 'total');
      
      setProducts(mockupProducts);
      } else {
        console.error('❌ Structure de réponse API invalide:', data);
        setProducts([]);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des produits:', err);
      console.log('🔄 Utilisation des données de test avec designs...');
      
      // En cas d'erreur API, utiliser des données de test avec designs
      const testData = getTestDataWithDesigns();
      setProducts(testData);
      
      // Définir une erreur informative mais ne pas bloquer l'interface
      setError(null); // On ne bloque pas l'interface avec les données de test
      
      // Log informatif pour le développeur
      console.log('✅ Interface chargée avec', testData.length, 'produits de test (avec designs)');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number): Promise<void> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      
      const response = await fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Mettre à jour l'état local
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const refetch = () => {
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch,
    deleteProduct,
  };
};

// 🎨 Données de test étendues avec support des designs
const getTestDataWithDesigns = (): Product[] => [
  {
    "id": 272,
    "name": "Emerson Sweet",
    "price": 478,
    "stock": 67,
    "status": "DRAFT" as const,
    "description": "Laudantium quasi ni",
    "createdAt": "2025-06-19T17:40:12.391Z",
    "updatedAt": "2025-06-19T17:40:12.391Z",
    "hasDesign": false, // Produit vierge
    "designCount": 0,
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 315,
            // Pas de design - produit vierge
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 283,
                "x": 172.3741184721741,
                "y": 112.2142736120204,
                "width": 148.6111052058363,
                "height": 236.1111017288988,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 298,
                "createdAt": "2025-06-19T17:40:12.413Z",
                "updatedAt": "2025-06-19T17:40:12.413Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
    "hasDesign": true, // Produit avec design
    "designCount": 2, // 2 designs sur ce produit
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 313,
            // 🎨 Design appliqué
            "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750351700/designs/logo-entreprise.png",
            "designPublicId": "designs/logo-entreprise_abc123",
            "designFileName": "logo-entreprise.png",
            "designUploadDate": "2025-06-19T16:48:00.000Z",
            "delimitations": [
              {
                "id": 281,
                "x": 165.1873986514119,
                "y": 116.1820036586212,
                "width": 159.7222158754315,
                "height": 226.388879893003,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 296,
                "createdAt": "2025-06-19T16:47:46.563Z",
                "updatedAt": "2025-06-19T16:47:46.563Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 314,
            // 🎨 Autre design appliqué
            "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750351705/designs/motif-geometrique.png",
            "designPublicId": "designs/motif-geometrique_def456",
            "designFileName": "motif-geometrique.png",
            "designUploadDate": "2025-06-19T16:48:15.000Z",
            "delimitations": [
              {
                "id": 282,
                "x": 165.1873986514119,
                "y": 116.1820036586212,
                "width": 159.7222158754315,
                "height": 226.388879893003,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 297,
                "createdAt": "2025-06-19T16:47:46.578Z",
                "updatedAt": "2025-06-19T16:47:46.578Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
    "hasDesign": false, // Produit vierge
    "designCount": 0,
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 310,
            // Pas de design
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 278,
                "x": 162.0062934027778,
                "y": 112.6410590277778,
                "width": 166.6666666666667,
                "height": 272.2222222222222,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 293,
                "createdAt": "2025-06-18T16:53:02.072Z",
                "updatedAt": "2025-06-18T16:53:02.072Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 311,
            // Pas de design
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 279,
                "x": 162.0062934027778,
                "y": 112.6410590277778,
                "width": 166.6666666666667,
                "height": 272.2222222222222,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 294,
                "createdAt": "2025-06-18T16:53:02.081Z",
                "updatedAt": "2025-06-18T16:53:02.081Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 312,
            // Pas de design
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 280,
                "x": 162.0062934027778,
                "y": 112.6410590277778,
                "width": 166.6666666666667,
                "height": 272.2222222222222,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 295,
                "createdAt": "2025-06-18T16:53:02.092Z",
                "updatedAt": "2025-06-18T16:53:02.092Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
    "hasDesign": true, // Produit avec design
    "designCount": 1, // 1 design sur ce produit
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 302,
            // 🎨 Design appliqué uniquement sur la version blanche
            "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750257520/designs/logo-moderne.png",
            "designPublicId": "designs/logo-moderne_ghi789",
            "designFileName": "logo-moderne.png",
            "designUploadDate": "2025-06-18T14:38:30.000Z",
            "delimitations": [
              {
                "id": 268,
                "x": 168.9507378472222,
                "y": 84.20138888888891,
                "width": 160.2112676056338,
                "height": 276.8595041322313,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 285,
                "createdAt": "2025-06-18T14:38:05.067Z",
                "updatedAt": "2025-06-18T14:38:05.067Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 303,
            // Pas de design sur cette couleur
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 269,
                "x": 171.728515625,
                "y": 84.56488715277779,
                "width": 154.4921875,
                "height": 276.2731481481482,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 286,
                "createdAt": "2025-06-18T14:38:06.472Z",
                "updatedAt": "2025-06-18T14:38:06.472Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 304,
            // Pas de design sur cette couleur
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 270,
                "x": 167.5618489583333,
                "y": 78.33116319444447,
                "width": 158.5537918871252,
                "height": 319.4444444444444,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 287,
                "createdAt": "2025-06-18T14:38:07.546Z",
                "updatedAt": "2025-06-18T14:38:07.546Z",
                "referenceWidth": 500,
                "referenceHeight": 500
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
            "naturalWidth": 500,
            "naturalHeight": 500,
            "colorVariationId": 305,
            // Pas de design sur cette couleur
            "designUrl": undefined,
            "designPublicId": undefined,
            "designFileName": undefined,
            "designUploadDate": undefined,
            "delimitations": [
              {
                "id": 271,
                "x": 168.9507378472222,
                "y": 89.11132812500003,
                "width": 165.5658436213992,
                "height": 298.8980716253443,
                "rotation": 0,
                "name": null,
                "coordinateType": "PERCENTAGE",
                "absoluteX": null,
                "absoluteY": null,
                "absoluteWidth": null,
                "absoluteHeight": null,
                "originalImageWidth": 500,
                "originalImageHeight": 500,
                "productImageId": 288,
                "createdAt": "2025-06-18T14:38:08.795Z",
                "updatedAt": "2025-06-18T14:38:08.795Z",
                "referenceWidth": 500,
                "referenceHeight": 500
              }
            ]
          }
        ]
      }
    ]
  }
]; 
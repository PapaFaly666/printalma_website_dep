import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import Button from './ui/Button';
import { AspectRatio } from './ui/aspect-ratio';
import { Product } from '../schemas/product.schema';

interface RelatedProductsProps {
  currentProduct: Product;
  products: Product[];
  limit?: number;
}

export default function RelatedProducts({ currentProduct, products, limit = 4 }: RelatedProductsProps) {
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Vérifier que products existe et est un tableau
    if (!products || !Array.isArray(products) || !currentProduct) {
      setRelatedProducts([]);
      return;
    }

    // Filtrer les produits similaires (même catégorie, publiés, non supprimés)
    const related = products
      .filter(product => 
        product.id !== currentProduct.id && // Exclure le produit actuel
        product.categoryId === currentProduct.categoryId && // Même catégorie
        product.status === 'PUBLISHED' && // Publiés seulement
        !product.deletedAt // Non supprimés
      )
      .slice(0, limit); // Limiter le nombre
    
    setRelatedProducts(related);
  }, [currentProduct, products, limit]);

  // Formater le prix en FCFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Obtenir l'image du produit
  const getProductImage = (product: Product) => {
    if (product.colors && product.colors.length > 0 && product.colors[0].imageUrl) {
      return product.colors[0].imageUrl;
    }
    if (product.designImageUrl) return product.designImageUrl;
    if (product.views && product.views.length > 0) return product.views[0].imageUrl;
    if (product.imageUrl) return product.imageUrl;
    return '/placeholder-product.jpg';
  };

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Produits similaires
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Découvrez d'autres produits de la même catégorie
          </p>
        </div>
        
        {relatedProducts.length >= limit && (
          <Button
            variant="outline"
            size="xl"
            onClick={() => navigate(`/products?category=${currentProduct.category?.name}`)}
            className="hidden sm:flex items-center space-x-2 px-10 py-4 text-lg"
          >
            <span>Voir plus</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <Card
            key={product.id}
            className="group h-full overflow-hidden bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:shadow-xl"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Badge prix */}
              <Badge 
                className="absolute top-3 right-3 px-2 py-1 bg-white/95 backdrop-blur-sm text-gray-900 font-medium border-0 text-sm"
              >
                {formatPrice(product.price)}
              </Badge>

              {/* Overlay au hover */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product.id}`);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Voir détails
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-medium text-base text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                {product.name}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">
                {product.description}
              </p>

              {/* Couleurs disponibles */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center space-x-1 mb-2">
                  <span className="text-xs text-gray-500">Couleurs:</span>
                  <div className="flex space-x-1">
                    {product.colors.slice(0, 3).map((color) => (
                      <div
                        key={color.id}
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                        title={color.name}
                      />
                    ))}
                    {product.colors.length > 3 && (
                      <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Catégorie */}
              <Badge variant="outline" className="text-xs">
                {product.category?.name}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bouton voir plus sur mobile */}
      {relatedProducts.length >= limit && (
        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            size="xl"
            onClick={() => navigate(`/products?category=${currentProduct.category?.name}`)}
            className="w-full px-8 py-4 text-base"
          >
            <span>Voir plus de produits similaires</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </section>
  );
} 
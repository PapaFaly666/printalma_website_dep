import React, { useState } from 'react';
import { Product } from '../schemas/product.schema';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetClose
} from '../components/ui/sheet';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { X, Heart, ShoppingCart, Check } from 'lucide-react';
import { Separator } from '../components/ui/separator';

// Define the props for the ProductDetailDrawer component
interface ProductDetailDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({ product, isOpen, onClose }) => {
  const [selectedColor, setSelectedColor] = useState<number | null>(
    product?.colors && product.colors.length > 0 ? product.colors[0].id : null
  );
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Mettre à jour la couleur sélectionnée quand le produit change
  React.useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0].id);
    }
  }, [product]);

  if (!product) return null;

  const formatPrice = (price: number) => {
    // Formater en Francs CFA avec séparateur de milliers
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(price);
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => prev + 1);
    } else {
      setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    }
  };

  // Obtenir l'image principale du produit (image de la couleur sélectionnée ou première vue disponible)
  const getMainProductImage = () => {
    if (selectedColor) {
      // Trouver la couleur sélectionnée
      const activeColor = product.colors.find(color => color.id === selectedColor);
      
      // Si la couleur a une image, l'utiliser
      if (activeColor?.imageUrl && activeColor.imageUrl !== "") {
        return activeColor.imageUrl;
      }
    }
    
    // Sinon, utiliser l'image du design ou la première vue disponible
    if (product.design?.imageUrl) {
      return product.design.imageUrl;
    }
    
    if (product.views && product.views.length > 0 && product.views[0].imageUrl) {
      return product.views[0].imageUrl;
    }
    
    return "/api/placeholder/800/800";
  };

  const getColorDisplay = (color: any) => {
    // Si la couleur a une image URL valide, afficher l'image
    if (color.imageUrl && color.imageUrl !== "") {
      return (
        <div className="w-full h-full rounded-full overflow-hidden border border-gray-200">
          <img src={color.imageUrl} alt={color.name} className="w-full h-full object-cover" />
        </div>
      );
    } 
    // Sinon, afficher la couleur basée sur le code hex
    return (
      <div 
        className="w-full h-full rounded-full border border-gray-200"
        style={{ backgroundColor: color.hexCode || "#CCCCCC" }}
      ></div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent className="p-0 w-full sm:max-w-md md:max-w-lg border-none" side="right">
        <div className="flex flex-col h-full bg-white dark:bg-gray-950">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b dark:border-gray-800">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-lg font-medium">{product.name}</SheetTitle>
              <SheetClose className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </SheetClose>
            </div>
          </SheetHeader>
          
          {/* Main content */}
          <ScrollArea className="flex-1 px-6 py-6">
            {/* Product image */}
            <div className="mb-6 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <AspectRatio ratio={1} className="overflow-hidden">
                <img
                  src={getMainProductImage()}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </AspectRatio>
            </div>
            
            {/* Product info */}
            <div className="space-y-6">
              {/* Category and badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {product.category.name}
                </Badge>
                {product.status && (
                  <Badge className={product.status.toUpperCase() === "PUBLISHED" ? 
                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}>
                    {product.status.toUpperCase() === "PUBLISHED" ? "Publié" : "Brouillon"}
                  </Badge>
                )}
              </div>
              
              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.stock > 0 ? (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                    En stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                    Rupture de stock
                  </Badge>
                )}
              </div>
              
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300">
                {product.description || "Aucune description disponible."}
              </p>
              
              <Separator />
              
              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Couleur</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={`w-10 h-10 rounded-full relative flex items-center justify-center ${
                          selectedColor === color.id ? "ring-2 ring-offset-2 ring-black dark:ring-white" : ""
                        }`}
                        title={color.name}
                      >
                        {getColorDisplay(color)}
                        {selectedColor === color.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Taille</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`min-w-[3rem] h-10 px-3 border rounded-md flex items-center justify-center ${
                          selectedSize === size.id 
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {size.sizeName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity */}
              <div>
                <h3 className="text-sm font-medium mb-3">Quantité</h3>
                <div className="flex items-center">
                  <button 
                    onClick={() => handleQuantityChange(false)}
                    className="w-10 h-10 border border-gray-200 dark:border-gray-700 flex items-center justify-center rounded-l-md bg-gray-50 dark:bg-gray-800"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <div className="w-16 h-10 border-t border-b border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-900">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => handleQuantityChange(true)}
                    className="w-10 h-10 border border-gray-200 dark:border-gray-700 flex items-center justify-center rounded-r-md bg-gray-50 dark:bg-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Images supplémentaires (uniquement si disponibles) */}
              {product.views && product.views.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Images du produit</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {product.views.map((view, index) => (
                      view.imageUrl && (
                        <div key={view.id || index} className="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                          <AspectRatio ratio={1} className="overflow-hidden">
                            <img
                              src={view.imageUrl}
                              alt={view.viewType || `Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </AspectRatio>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Footer */}
          <div className="p-6 border-t dark:border-gray-800">
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ajouter au panier
              </Button>
              <Button variant="outline" className="p-2">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetailDrawer;
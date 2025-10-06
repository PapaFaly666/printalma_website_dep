import React, { useState, useEffect } from 'react';
import { 
  HeartIcon, ShoppingCart, Share2, Star, Check, ChevronRight,
  Truck, RotateCcw, ShieldCheck, Package, Eye, CircleUser 
} from 'lucide-react';
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "./ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// Types pour les vues et couleurs
interface ProductView {
  viewType: string;
  imageUrl: string;
  description?: string;
}

interface ProductColor {
  id: number;
  name: string;
  hexCode: string;
  imageUrl?: string;
  imagePublicId?: string | null;
}

interface ProductSize {
  id: number;
  name: string;
}

interface ProductDesign {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

interface Review {
  id: number;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  content: string;
}

// Données d'exemple
const exampleProduct = {
  id: 1,
  name: "T-Shirt Premium Collection",
  description: "Ce T-shirt premium offre un confort exceptionnel avec son tissu en coton organique de haute qualité. Parfait pour toutes les occasions, il associe style, durabilité et respect de l'environnement.",
  price: 25000,
  originalPrice: 30000,
  discount: 17,
  stock: 15,
  status: "PUBLISHED",
  category: { id: 1, name: "T-Shirt" },
  featured: true,
  rating: 4.8,
  reviewCount: 124,
  views: [
    { viewType: "FRONT", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { viewType: "BACK", imageUrl: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { viewType: "DETAIL", imageUrl: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { viewType: "MODEL", imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }
  ],
  colors: [
    { id: 1, name: "Noir", hexCode: "#000000", imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1747353495/colors/noir.png" },
    { id: 2, name: "Blanc", hexCode: "#FFFFFF", imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1747353495/colors/blanc.png" },
    { id: 3, name: "Bleu Marine", hexCode: "#0A1E3C", imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1747353495/colors/bleu-marine.png" },
    { id: 4, name: "Rouge", hexCode: "#DE3535", imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1747353495/colors/rouge.png" },
    { id: 5, name: "Vert Sapin", hexCode: "#146B3A", imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1747353495/colors/vert.png" }
  ],
  sizes: [
    { id: 1, name: "S" },
    { id: 2, name: "M" },
    { id: 3, name: "L" },
    { id: 4, name: "XL" },
    { id: 5, name: "XXL" }
  ],
  design: {
    id: 1,
    name: "Personnalisation Premium",
    description: "Design exclusif réalisé par notre équipe artistique, imprimé en sérigraphie haute qualité.",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  features: [
    "100% coton organique",
    "Coupe moderne et confortable",
    "Coutures renforcées",
    "Lavable en machine",
    "Certification écologique"
  ],
  reviews: [
    {
      id: 1,
      author: "Sophie Dubois",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      rating: 5,
      date: "12/03/2023",
      content: "Qualité exceptionnelle ! Le tissu est doux et ne s'est pas déformé après plusieurs lavages. Je recommande vivement ce produit."
    },
    {
      id: 2,
      author: "Marc Laurent",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      rating: 4,
      date: "02/02/2023",
      content: "Très bon produit, la taille correspond parfaitement. Un petit bémol sur la livraison qui a pris un jour de plus que prévu."
    },
    {
      id: 3,
      author: "Aminata Diallo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      rating: 5,
      date: "23/01/2023",
      content: "Design magnifique et matière très agréable à porter. J'ai déjà commandé un second exemplaire en couleur différente !"
    }
  ]
};

const ProductDetail: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState<number>(exampleProduct.colors[0].id);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Fonctions utilitaires
  const formatPrice = (price: number) => {
    return price.toLocaleString() + " CFA";
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  // Fonction pour récupérer l'image basée sur la couleur sélectionnée
  const getColorImage = (color: ProductColor) => {
    // Si la couleur a une URL d'image, l'utiliser
    if (color.imageUrl && color.imageUrl !== "") {
      return color.imageUrl;
    }
    // Sinon, utiliser l'image par défaut du produit
    return exampleProduct.views[0]?.imageUrl || "";
  };

  // Obtenir la couleur actuellement sélectionnée
  const activeColor = exampleProduct.colors.find(color => color.id === selectedColor);
  
  // Obtenir l'image principale à afficher
  const mainImage = activeColor?.imageUrl && activeColor.imageUrl !== ""
    ? activeColor.imageUrl
    : exampleProduct.views[0]?.imageUrl || "";

  // Debug
  console.log('activeColor:', activeColor);
  console.log('mainImage:', mainImage);

  // Mise à jour de l'affichage quand la couleur change
  useEffect(() => {
    if (activeColor?.imageUrl) {
      // Si une couleur est sélectionnée et qu'elle a une image, afficher cette image en premier
      setActiveImageIndex(0);
    }
  }, [selectedColor, activeColor]);
  
  // Images à afficher dans le carrousel (basées sur la couleur sélectionnée)
  const displayImages = activeColor?.imageUrl 
    ? [{ viewType: "COLOR", imageUrl: activeColor.imageUrl }, ...exampleProduct.views]
    : exampleProduct.views;

  // Handle color selection
  const handleColorSelect = (colorId: number) => {
    setSelectedColor(colorId);
    setActiveImageIndex(0); // Show the first image (which will be the color image if available)
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Section Galerie d'images */}
        <div className="lg:w-[55%] space-y-4">
          <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-2">
            <img 
              src={mainImage || 'https://via.placeholder.com/1200x1200?text=No+Image'} 
              alt={`Produit ${exampleProduct.name} - ${activeColor?.name || ""}`} 
              className="max-h-[1200px] max-w-full object-contain"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((view, index) => (
              <div 
                key={index}
                className={`relative cursor-pointer rounded-md overflow-hidden flex-shrink-0 w-20 h-20 border-2 ${
                  activeImageIndex === index 
                    ? "border-black dark:border-white" 
                    : "border-transparent"
                }`}
                onClick={() => setActiveImageIndex(index)}
              >
                <img 
                  src={view.imageUrl}
                  alt={`Miniature ${view.viewType}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                  <Badge variant="outline" className="bg-white/80 text-[10px]">
                    {view.viewType}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Section Informations produit */}
        <div className="lg:w-[45%] space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{exampleProduct.category.name}</Badge>
              {exampleProduct.stock < 10 && (
                <Badge className="bg-amber-500">Stock limité</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{exampleProduct.name}</h1>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {renderStars(exampleProduct.rating)}
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  ({exampleProduct.rating}) · {exampleProduct.reviewCount} avis
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(exampleProduct.price)}
            </span>
            {exampleProduct.originalPrice && (
              <>
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(exampleProduct.originalPrice)}
                </span>
                <Badge className="bg-green-500">-{exampleProduct.discount}%</Badge>
              </>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {exampleProduct.description}
          </p>
          
          <Separator />
          
          {/* Options de personnalisation */}
          <div className="space-y-4">
            {/* Couleurs */}
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Couleur</h3>
                <span className="text-sm text-gray-500">
                  {exampleProduct.colors.find(c => c.id === selectedColor)?.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {exampleProduct.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect(color.id)}
                    className={`relative w-10 h-10 rounded-full overflow-hidden focus:outline-none 
                      ${selectedColor === color.id 
                        ? "ring-2 ring-offset-2 ring-black dark:ring-white" 
                        : "hover:ring-1 hover:ring-offset-1 hover:ring-gray-300"
                      }`}
                    title={color.name}
                  >
                    {color.imageUrl ? (
                      <img src={color.imageUrl} alt={color.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: color.hexCode }}></div>
                    )}
                    {/* Petit check discret en bas à droite si sélectionné */}
                    {selectedColor === color.id && (
                      <span className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow">
                        <Check className="h-3 w-3 text-black" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tailles */}
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Taille</h3>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Guide des tailles
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {exampleProduct.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.name)}
                    className={`min-w-[3rem] h-10 px-3 border rounded-md flex items-center justify-center transition-all ${
                      selectedSize === size.name
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantité */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Quantité</h3>
              <div className="flex items-center">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-200 dark:border-gray-700 flex items-center justify-center rounded-l-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  -
                </button>
                <div className="w-16 h-10 border-t border-b border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                  {quantity}
                </div>
                <button 
                  onClick={() => setQuantity(Math.min(exampleProduct.stock, quantity + 1))}
                  className="w-10 h-10 border border-gray-200 dark:border-gray-700 flex items-center justify-center rounded-r-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  +
                </button>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                  {exampleProduct.stock} disponibles
                </span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 font-medium h-12"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ajouter au panier
            </Button>
            <Button variant="outline" className="flex-1 border-gray-200 dark:border-gray-700 h-12">
              <HeartIcon className="mr-2 h-5 w-5" />
              Ajouter aux favoris
            </Button>
          </div>
          
          {/* Avantages */}
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Livraison sous 3-5 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Retours sous 14 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Garantie qualité</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Emballage écologique</span>
            </div>
          </div>
          
          {/* Design personnalisé */}
          {exampleProduct.design && (
            <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
              <CardHeader className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg">Design personnalisé</CardTitle>
                <CardDescription>
                  Ce produit inclut un design exclusif
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <img 
                    src={exampleProduct.design.imageUrl} 
                    alt={exampleProduct.design.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {exampleProduct.design.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {exampleProduct.design.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Onglets d'informations détaillées */}
      <div className="mt-16">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none dark:border-gray-700 bg-transparent h-auto p-0 mb-6">
            <TabsTrigger 
              value="description" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:shadow-none py-3 text-base"
            >
              Description
            </TabsTrigger>
            <TabsTrigger 
              value="features" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:shadow-none py-3 text-base"
            >
              Caractéristiques
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:shadow-none py-3 text-base"
            >
              Avis ({exampleProduct.reviews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-0">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {exampleProduct.description}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                Notre T-shirt premium est fabriqué avec le plus grand soin dans nos ateliers partenaires. 
                Chaque couture est réalisée avec précision pour garantir une durabilité exceptionnelle tout en maintenant un confort optimal.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                Le tissu en coton organique est certifié pour son impact environnemental réduit et offre une sensation douce et agréable sur la peau.
                Sa coupe moderne assure un tombé élégant qui met en valeur votre silhouette.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Caractéristiques clés
                </h3>
                <ul className="space-y-3">
                  {exampleProduct.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Instructions d'entretien
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li>Lavage en machine à 30°C maximum</li>
                  <li>Ne pas utiliser d'eau de javel</li>
                  <li>Repassage à basse température</li>
                  <li>Ne pas sécher en machine</li>
                  <li>Ne pas nettoyer à sec</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-0">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-5xl font-bold text-gray-900 dark:text-white">{exampleProduct.rating}</h3>
                    <div className="flex justify-center my-2">
                      {renderStars(exampleProduct.rating)}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Basé sur {exampleProduct.reviewCount} avis
                    </p>
                    
                    <div className="mt-6">
                      <Button className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        Laisser un avis
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Avis récents
                  </h3>
                  
                  <div className="space-y-6">
                    {exampleProduct.reviews.map((review) => (
                      <div key={review.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarImage src={review.avatar} />
                              <AvatarFallback>
                                <CircleUser className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {review.author}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {review.date}
                              </div>
                            </div>
                          </div>
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          {review.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Produits suggérés */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vous pourriez aussi aimer</h2>
          <Button variant="ghost" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Voir plus <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="overflow-hidden border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
                <img 
                  src={`https://images.unsplash.com/photo-${1510000000 + item * 10000}?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`}
                  alt={`Produit suggéré ${item}`}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 right-2 bg-black text-white dark:bg-white dark:text-black">
                  Nouveau
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white">T-Shirt Collection {item}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">{(15000 + item * 1000).toLocaleString()} CFA</span>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs ml-1 text-gray-500">4.{item}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 
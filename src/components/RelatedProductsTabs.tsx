import { JSX, useState } from 'react';
import {
  ChevronRight,
  User,
  Users,
  Baby,
  ShoppingBag,
  Home,
  Sticker
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';

// Définir le type pour un produit
interface Product {
  id: number;
  title: string;
  price: string;
  image: string;
  durable: boolean;
}

// Définir le type pour une catégorie
interface Category {
  id: string;
  label: string;
  icon: JSX.Element;
}

const RelatedProductsTabs = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('hommes');

  // Simulation des produits pour chaque catégorie
  const products: Record<string, Product[]> = {
    hommes: [
      {
        id: 1,
        title: "Sweat à capuche unisexe",
        price: "39,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      },
      {
        id: 2,
        title: "T-shirt bio Unisexe",
        price: "29,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      },
      {
        id: 3,
        title: "T-shirt contrasté Homme",
        price: "28,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      },
      {
        id: 4,
        title: "Molleton bio Stanley/Stella",
        price: "47,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      },
      {
        id: 5,
        title: "Veste à capuche bio Stanley/Stella",
        price: "59,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      }
    ],
    femmes: [
      {
        id: 6,
        title: "T-shirt coupe femme",
        price: "28,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      },
      {
        id: 7,
        title: "Débardeur femme",
        price: "24,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      }
    ],
    enfants: [
      {
        id: 8,
        title: "T-shirt enfant",
        price: "19,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      }
    ],
    bebes: [
      {
        id: 9,
        title: "Body bébé",
        price: "18,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      }
    ],
    accessoires: [
      {
        id: 10,
        title: "Tote bag",
        price: "14,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      },
      {
        id: 11,
        title: "Casquette",
        price: "19,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      }
    ],
    maison: [
      {
        id: 12,
        title: "Housse de coussin",
        price: "16,99 €",
        image: "/api/placeholder/220/220",
        durable: true
      },
      {
        id: 13,
        title: "Mug",
        price: "14,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      }
    ],
    stickers: [
      {
        id: 14,
        title: "Sticker format A5",
        price: "4,99 €",
        image: "/api/placeholder/220/220",
        durable: false
      }
    ]
  };

  // Catégories avec leurs icônes et libellés
  const categories: Category[] = [
    { id: 'hommes', label: 'Hommes', icon: <User className="w-4 h-4" /> },
    { id: 'femmes', label: 'Femmes', icon: <User className="w-4 h-4" /> },
    { id: 'enfants', label: 'Enfants', icon: <Users className="w-4 h-4" /> },
    { id: 'bebes', label: 'Bébés', icon: <Baby className="w-4 h-4" /> },
    { id: 'accessoires', label: 'Accessoires', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'maison', label: 'Maison & décor', icon: <Home className="w-4 h-4" /> },
    { id: 'stickers', label: 'Stickers', icon: <Sticker className="w-4 h-4" /> }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900 text-center">
        Ce design est aussi disponible sur d'autres produits
      </h2>

      <Tabs
        defaultValue="hommes"
        onValueChange={setSelectedCategory}
        value={selectedCategory}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList className="flex h-12 bg-zinc-50 border-b border-zinc-200 rounded-none w-full">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 h-full data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-white rounded-none px-4"
              >
                {category.icon}
                <span>{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {Object.keys(products).map((categoryId) => (
          <TabsContent key={categoryId} value={categoryId} className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {products[categoryId].map((product: Product) => (
                <Card key={product.id} className="rounded-lg overflow-hidden border-zinc-200 bg-white hover:shadow-md transition-shadow group">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.durable && (
                      <Badge className="absolute top-2 left-2 bg-zinc-800 text-white font-medium">
                        Durable
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-zinc-900 line-clamp-2 mb-1 group-hover:underline">
                      {product.title}
                    </h3>
                    <p className="text-sm font-bold text-zinc-900">{product.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="text-zinc-900 hover:text-zinc-700 font-medium text-sm p-0 flex items-center">
          Voir tous les produits <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default RelatedProductsTabs;

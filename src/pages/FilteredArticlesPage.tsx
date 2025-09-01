import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Heart, Filter,
  Search, X, LayoutGrid, List, SlidersHorizontal,
  Settings2, Menu, ShoppingBag, Sparkles, Layers,
  Leaf, Palette, Clock, Globe, Tag, Banknote,
  ArrowUpDown, CircleUser, Bookmark
} from 'lucide-react';

interface Category {
  name: string;
  icon: React.ReactNode;
  slug: string;
}

interface Product {
  name: string;
  active: boolean;
}

interface Article {
  id: string; // Assurez-vous que l'id est de type string
  title: string;
  description: string;
  price: string;
  image: string;
  designImage?: string;
  tags?: string[];
  categorie: string;
}

// Article data would come from an API in a real app
import { article as articleData } from '../data/articleData';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent } from '../components/ui/accordion';
import { AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion';
import { Checkbox } from '../components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Input } from '../components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

const FilteredArticlesPage: React.FC = () => {
  // Convertir les id en string
  const articlesWithStringIds = articleData.map(item => ({
    ...item,
    id: String(item.id)
  }));

  // Hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter articles based on selected category and search term
  const filteredArticles = articlesWithStringIds
    .filter(item =>
      (!selectedCategory || item.categorie.toLowerCase() === selectedCategory.toLowerCase()) &&
      (!searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Toggle filter function
  const toggleFilter = (filterName: string): void => {
    setActiveFilters(prev =>
      prev.includes(filterName)
        ? prev.filter(f => f !== filterName)
        : [...prev, filterName]
    );
  };

  // Handle image hover
  const handleImageHover = (articleId: string, isEntering: boolean): void => {
    if (isEntering) {
      setHoveredArticleId(articleId);
    } else {
      setHoveredArticleId(null);
    }
  };

  // Get image source based on hover state
  const getImageSource = (article: Article): string => {
    if (hoveredArticleId === article.id && article.designImage) {
      return article.designImage;
    }
    return article.image;
  };

  // Format price function
  const formatPrice = (price: string): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(parseFloat(price.replace('XOF', '').replace('FCFA', '')));
  };

  // Select category
  const handleCategorySelect = (slug: string): void => {
    setSearchParams({ category: slug });
    setMobileSidebarOpen(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
    setSearchParams({});
  };

  // Modern data with Lucide icons
  const categories: Category[] = [
    { name: 'Hommes', icon: <CircleUser size={16} />, slug: 'hommes' },
    { name: 'Femmes', icon: <CircleUser size={16} />, slug: 'femmes' },
    { name: 'Enfants', icon: <CircleUser size={16} className="opacity-70" />, slug: 'enfants' },
    { name: 'Bébés', icon: <CircleUser size={16} className="opacity-50" />, slug: 'bebes' },
    { name: 'Accessoires', icon: <Tag size={16} />, slug: 'accessoires' },
    { name: 'Maison & décor', icon: <Globe size={16} />, slug: 'maison' },
    { name: 'Stickers', icon: <Bookmark size={16} />, slug: 'stickers' }
  ];

  const products: Product[] = [
    { name: 'T-shirts', active: true },
    { name: 'Sweat-shirts', active: false },
    { name: 'Casquettes et bonnets', active: false },
    { name: 'Sacs et sacs à dos', active: false },
    { name: 'Mugs et tasses', active: false }
  ];

  const filters = [
    { name: 'Durable', count: 18, icon: <Leaf size={14} /> },
    { name: 'Brodé', count: 24, icon: <Layers size={14} /> },
    { name: 'Limitée', count: 7, icon: <Sparkles size={14} /> },
    { name: 'Nouveauté', count: 12, icon: <Clock size={14} /> }
  ];

  // Components
  const FilterPill = ({ name, isActive = false, icon }: { name: string, isActive?: boolean, icon?: React.ReactNode }) => (
    <Button
      variant={isActive ? "secondary" : "outline"}
      size="sm"
      className={`rounded-full h-8 px-3 gap-1.5 ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}`}
      onClick={() => toggleFilter(name)}
    >
      {icon && <span className="opacity-75">{icon}</span>}
      {name}
    </Button>
  );

  // ArticleCardGrid with shadcn Card
  const ArticleCardGrid = ({ article }: { article: Article }) => (
    <Card className="overflow-hidden border-border/40">
      <div
        className="relative aspect-square bg-muted overflow-hidden"
        onMouseEnter={() => handleImageHover(article.id, true)}
        onMouseLeave={() => handleImageHover(article.id, false)}
      >
        <img
          src={getImageSource(article)}
          alt={article.title}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full h-8 w-8"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Tags */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {article.tags?.includes('Durable') && (
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 flex items-center gap-1">
              <Leaf size={12} />
              <span>Durable</span>
            </Badge>
          )}
          {article.tags?.includes('Brodé') && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-0 flex items-center gap-1">
              <Layers size={12} />
              <span>Brodé</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground">{article.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-3 line-clamp-2">{article.description}</p>
        <div className="mt-auto flex justify-between items-center">
          <p className="font-bold text-foreground">{formatPrice(article.price)}</p>
          <Button variant="secondary" size="icon" className="text-primary h-8 w-8">
            <ShoppingBag size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ArticleCardList with shadcn Card
  const ArticleCardList = ({ article }: { article: Article }) => (
    <Card className="overflow-hidden border-border/40">
      <div className="flex">
        {/* Image Container */}
        <div
          className="relative w-28 sm:w-36 md:w-44 bg-muted overflow-hidden flex-shrink-0"
          onMouseEnter={() => handleImageHover(article.id, true)}
          onMouseLeave={() => handleImageHover(article.id, false)}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={getImageSource(article)}
              alt={article.title}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
        </div>

        {/* Information */}
        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground">{article.title}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Heart size={16} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1 md:line-clamp-2">
            {article.description}
          </p>

          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="font-bold text-foreground">{formatPrice(article.price)}</p>

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {article.tags?.includes('Durable') && (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 flex items-center gap-1">
                    <Leaf size={12} />
                    <span>Durable</span>
                  </Badge>
                )}
                {article.tags?.includes('Brodé') && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-0 flex items-center gap-1">
                    <Layers size={12} />
                    <span>Brodé</span>
                  </Badge>
                )}
              </div>
              <Button variant="secondary" size="icon" className="text-primary h-8 w-8">
                <ShoppingBag size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  // Sidebar content - used for both desktop and mobile
  const SidebarContent = () => (
    <Accordion
      type="multiple"
      defaultValue={['categories', 'products']}
      className="w-full"
    >
      <AccordionItem value="categories">
        <AccordionTrigger className="py-2">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            <span>Catégories</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-2 space-y-1">
            {categories.map(cat => (
              <div
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`flex items-center space-x-2 py-2 px-3 rounded-md cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-muted'
                }`}
              >
                <span className="flex-shrink-0 text-foreground/70">{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="products">
        <AccordionTrigger className="py-2">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-primary" />
            <span>Produits</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-2 space-y-1">
            {products.map(prod => (
              <div
                key={prod.name}
                className={`py-2 px-3 rounded-md cursor-pointer text-sm ${
                  prod.active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-muted'
                }`}
              >
                {prod.name}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="filters">
        <AccordionTrigger className="py-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-primary" />
            <span>Filtres</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-2 space-y-1">
            {filters.map(filter => (
              <div key={filter.name} className="flex items-center py-1.5">
                <label className="flex items-center py-1 px-3 rounded-md cursor-pointer text-sm w-full hover:bg-muted">
                  <Checkbox
                    checked={activeFilters.includes(filter.name)}
                    onCheckedChange={() => toggleFilter(filter.name)}
                    className="mr-2"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{filter.icon}</span>
                    <span className="text-foreground/80">{filter.name}</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {filter.count}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="bg-background/50 min-h-screen w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b shadow-sm w-full">
        <div className="container mx-auto flex items-center justify-between px-4 h-16 max-w-full">
          <div className="flex items-center gap-4">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <Filter size={18} className="text-primary" />
                    <span>Filtres</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 overflow-y-auto">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag size={22} className="text-primary" />
              <span>T-shirts</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9 h-9 rounded-full bg-muted w-64 text-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <SlidersHorizontal size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Trier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Paramètres</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 flex max-w-full">
        {/* Desktop Sidebar */}
        <aside className="w-64 flex-shrink-0 pt-6 pr-6 hidden md:block">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-grow pt-6 pb-12 w-full">
          {/* Mobile search */}
          <div className="relative mb-4 md:hidden">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-9 rounded-full bg-muted w-full text-sm"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </Button>
            )}
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill name="Trier" icon={<ArrowUpDown size={14} />} />
              <FilterPill name="Tailles" icon={<Layers size={14} />} />
              <FilterPill name="Prix" icon={<Banknote size={14} />} />
              <FilterPill name="Couleurs" icon={<Palette size={14} />} />
              <FilterPill
                name="Durable"
                icon={<Leaf size={14} />}
                isActive={activeFilters.includes('Durable')}
              />
              <FilterPill
                name="Brodé"
                icon={<Layers size={14} />}
                isActive={activeFilters.includes('Brodé')}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm font-medium">Affichage:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                      aria-label="Vue en grille"
                    >
                      <LayoutGrid size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vue en grille</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                      aria-label="Vue en liste"
                    >
                      <List size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vue en liste</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Articles information */}
          <div className="flex justify-between items-center mb-5">
            <div className="text-sm text-muted-foreground font-medium">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
              {selectedCategory && ` dans ${categories.find(c => c.slug === selectedCategory)?.name.toLowerCase() || selectedCategory}`}
              {(activeFilters.length > 0 || searchTerm) && (
                <Button
                  variant="link"
                  className="h-auto p-0 ml-2 text-xs font-semibold text-primary"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>

          {/* Articles grid or list */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {filteredArticles.map(item => (
                <ArticleCardGrid key={item.id} article={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredArticles.map(item => (
                <ArticleCardList key={item.id} article={item} />
              ))}
            </div>
          )}

          {/* Message if no results */}
          {filteredArticles.length === 0 && (
            <Card className="p-8 text-center mt-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Aucun article trouvé</h3>
                <p className="text-muted-foreground mb-5">Essayez de modifier vos filtres ou votre recherche</p>
                <Button onClick={resetFilters}>
                  Réinitialiser tous les filtres
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Floating action button (mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Filter size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Filter size={18} className="text-primary" />
                <span>Filtres</span>
              </SheetTitle>
            </SheetHeader>
            <div className="p-4 overflow-y-auto">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default FilteredArticlesPage;

import { useEffect, useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  ArrowUpRight,
  Filter,
  Grid,
  List,
  X,
  Heart,
  Share2,
  Star,
  BadgeCheck,
  Sparkles,
  TrendingUp,
  Eye
} from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import featuredBrands from '../data/marqueData';
import Footer from '../components/Footer';

// Assurez-vous que le type Marque inclut la propriété 'category'
export interface Marque {
  trending: boolean;
  isNew: boolean;
  rating: string;
  followers: number;
  products: number;
  id: number;
  name: string;
  event: string;
  image: string;
  category?: string; // Ensure this property is included
  description?: string; // Ensure this property is included
}
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AllMarques() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isScrolled, setIsScrolled] = useState(false);
  const [favoriteMarques, setFavoriteMarques] = useState<number[]>([]);
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showQuickView, setShowQuickView] = useState<Marque | null>(null);

  const { ref: heroRef, inView: heroInView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  // Extract unique categories from brands data
  const categories = [...new Set(featuredBrands.map(brand => brand.category || 'Autre'))];

  // Popular brands - just for demo
  const popularBrands = featuredBrands.slice(0, 5);

  // Add trending status to some brands
  const enhancedBrands: Marque[] = featuredBrands.map((brand, index) => ({
    ...brand,
    trending: index % 5 === 0,
    isNew: index % 7 === 0,
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    followers: Math.floor(Math.random() * 10000),
    products: Math.floor(Math.random() * 50) + 5
  }));

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);

    // Add scroll listener for sticky header effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFavorite = (e: MouseEvent, id: number) => {
    e.stopPropagation();
    setFavoriteMarques(prev =>
      prev.includes(id)
        ? prev.filter(marqueId => marqueId !== id)
        : [...prev, id]
    );
  };

  const handleQuickView = (e: MouseEvent, marque: Marque) => {
    e.stopPropagation();
    setShowQuickView(marque);
  };

  const filteredBrands = enhancedBrands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          brand.event.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || brand.category === selectedCategory;
    const matchesTab = currentTab === 'all' ||
                      (currentTab === 'favorites' && favoriteMarques.includes(brand.id)) ||
                      (currentTab === 'trending' && brand.trending) ||
                      (currentTab === 'new' && brand.isNew);

    return matchesSearch && matchesCategory && matchesTab;
  }).sort((a, b) => {
    if (sortBy === 'featured') return 0;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return parseFloat(b.rating) - parseFloat(a.rating);
    if (sortBy === 'followers') return b.followers - a.followers;
    return 0;
  });

  const handleMarqueClick = (marque: Marque) => {
    navigate('/marque-details', { state: { marque } });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Animation variants for staggering cards
  const cardAnimationVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      {/* Fixed search bar that appears on scroll */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b transform transition-transform duration-300 py-3 px-4 shadow-sm",
          isScrolled ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une marque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? "bg-accent text-accent-foreground" : ""}
              >
                Toutes les catégories
              </DropdownMenuItem>
              {categories.map(category => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-accent text-accent-foreground" : ""}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs value={viewMode} onValueChange={setViewMode} className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="grid" className="px-3">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Scroll to top button */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-40 transition-all duration-300 transform",
          showScrollToTop ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        )}
      >
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full h-12 w-12 shadow-lg"
          onClick={scrollToTop}
        >
          <ChevronLeft className="h-5 w-5 rotate-90" />
        </Button>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">{showQuickView.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowQuickView(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={showQuickView.image}
                    alt={showQuickView.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {showQuickView.category || "Autre"}
                    </Badge>
                    {showQuickView.trending && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Tendance
                      </Badge>
                    )}
                    {showQuickView.isNew && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Nouveau
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground">
                    {showQuickView.event}
                  </p>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          parseFloat(showQuickView.rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : parseFloat(showQuickView.rating) >= star - 0.5
                            ? "fill-amber-400/50 text-amber-400"
                            : "fill-none text-muted-foreground"
                        )}
                      />
                    ))}
                    <span className="text-sm ml-1 font-medium">{showQuickView.rating}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Abonnés</p>
                      <p className="font-medium">{showQuickView.followers.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Produits</p>
                      <p className="font-medium">{showQuickView.products}</p>
                    </div>
                  </div>

                  <p className="text-sm mt-2">
                    {showQuickView.description || "Explorez l'univers créatif de cette marque exceptionnelle et découvrez des pièces uniques qui racontent une histoire."}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setShowQuickView(null);
                        handleMarqueClick(showQuickView);
                      }}
                    >
                      Voir la marque
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => toggleFavorite(e, showQuickView.id)}
                    >
                      <Heart className={cn(
                        "h-4 w-4",
                        favoriteMarques.includes(showQuickView.id) && "fill-red-500 text-red-500"
                      )} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section with Background */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-violet-800 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
        <div className="absolute inset-0">
          {/* Modern gradient blobs */}
          <div className="absolute top-0 -left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration:.6 }}
            className="flex flex-col gap-2 max-w-3xl"
          >
            <Button
              variant="ghost"
              size="sm"
              className="self-start mb-4 text-white hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .8, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
            >
              Découvrez Nos{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent">
                Marques d'Artistes
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .8, delay: 0.2 }}
              className="text-base md:text-lg text-white/80 mb-8"
            >
              Une collection exclusive de marques créatives qui allient innovation, qualité et originalité pour redéfinir l'art contemporain.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 w-full max-w-xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Rechercher une marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white h-12 rounded-lg"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg h-12">
                    {selectedCategory === 'all' ? 'Catégories' : selectedCategory}
                    <Filter className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                    Toutes les catégories
                  </DropdownMenuItem>
                  {categories.map(category => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: .8, delay: 0.5 }}
            className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl"
          >
            {[
              { label: "Marques", value: enhancedBrands.length },
              { label: "Catégories", value: categories.length },
              { label: "Artistes", value: "150+" },
              { label: "Produits", value: "5,000+" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-white/80">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Popular Brand Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: .8, delay: 0.6 }}
            className="mt-8 md:mt-12"
          >
            <p className="text-sm text-white/70 mb-3">Marques populaires:</p>
            <div className="flex flex-wrap gap-2">
              {popularBrands.map((brand) => (
                <Badge
                  key={brand.id}
                  variant="secondary"
                  className="bg-white/15 hover:bg-white/25 text-white border-none cursor-pointer pl-2 pr-3 py-1.5 rounded-full"
                  onClick={() => handleMarqueClick(brand)}
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 overflow-hidden mr-2">
                    <img src={brand.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  {brand.name}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 160">
            <path
              fill="currentColor"
              fillOpacity="1"
              d="M0,128L48,122.7C96,117,192,107,288,101.3C384,96,480,96,576,106.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              className="text-background"
            ></path>
          </svg>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Tabs and filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full md:w-auto">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="all" className="flex-1 md:flex-initial">
                  Tout
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex-1 md:flex-initial">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Tendance
                </TabsTrigger>
                <TabsTrigger value="new" className="flex-1 md:flex-initial">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Nouveautés
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex-1 md:flex-initial">
                  <Heart className="h-4 w-4 mr-1" />
                  Favoris
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortBy === 'featured' && 'En vedette'}
                    {sortBy === 'name' && 'Alphabétique'}
                    {sortBy === 'rating' && 'Mieux notés'}
                    {sortBy === 'followers' && 'Plus suivis'}
                    <ChevronLeft className="h-4 w-4 ml-1 rotate-270" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('featured')}>
                    En vedette
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    Alphabétique
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating')}>
                    Mieux notés
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('followers')}>
                    Plus suivis
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList>
                  <TabsTrigger value="grid" className="px-3">
                    <Grid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-3">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Active filters section */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="px-3 py-1">
              {filteredBrands.length} Marques
            </Badge>

            {searchTerm && (
              <Badge variant="secondary" className="px-3 py-1 gap-2 group">
                Recherche: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="px-3 py-1 gap-2">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(searchTerm || selectedCategory !== 'all' || currentTab !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setCurrentTab('all');
                }}
              >
                Réinitialiser tout
              </Button>
            )}
          </div>

          {/* Content Views */}
          <div className="mb-12">
            {/* Grid View */}
            {viewMode === 'grid' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredBrands.map((marque, i) => (
                  <motion.div
                    key={marque.id}
                    variants={cardAnimationVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card
                      className="overflow-hidden border border-border/40 shadow-sm transition-all duration-300 h-full group hover:shadow-lg hover:border-primary/40 hover:translate-y-[-4px]"
                    >
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        <img
                          src={marque.image}
                          alt={marque.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <div className="w-full flex justify-between items-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs font-medium"
                              onClick={(e) => handleQuickView(e, marque)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Aperçu
                            </Button>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => toggleFavorite(e, marque.id)}
                              >
                                <Heart className={cn(
                                  "h-3.5 w-3.5",
                                  favoriteMarques.includes(marque.id) && "fill-red-500 text-red-500"
                                )} />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {marque.trending && (
                            <Badge className="bg-amber-500 text-white border-none">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Tendance
                            </Badge>
                          )}
                          {marque.isNew && (
                            <Badge className="bg-emerald-500 text-white border-none">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Nouveau
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{marque.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {marque.category || "Autre"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {marque.event}
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                parseFloat(marque.rating) >= star
                                  ? "fill-amber-400 text-amber-400"
                                  : parseFloat(marque.rating) >= star - 0.5
                                  ? "fill-amber-400/50 text-amber-400"
                                  : "fill-none text-muted-foreground"
                              )}
                            />
                          ))}
                          <span className="text-sm ml-1 font-medium">{marque.rating}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                    <Eye className="h-4 w-4" />
                                    {marque.followers.toLocaleString()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Abonnés</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                    <BadgeCheck className="h-4 w-4" />
                                    {marque.products}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Produits</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-medium"
                            onClick={() => handleMarqueClick(marque)}
                          >
                            Voir plus
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {filteredBrands.map((marque, i) => (
                  <motion.div
                    key={marque.id}
                    variants={cardAnimationVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 border-b border-border/40 pb-6 last:border-b-0"
                  >
                    <div className="aspect-square w-24 h-24 overflow-hidden bg-muted rounded-lg">
                      <img
                        src={marque.image}
                        alt={marque.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{marque.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {marque.category || "Autre"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {marque.event}
                      </p>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              parseFloat(marque.rating) >= star
                                ? "fill-amber-400 text-amber-400"
                                : parseFloat(marque.rating) >= star - 0.5
                                ? "fill-amber-400/50 text-amber-400"
                                : "fill-none text-muted-foreground"
                            )}
                          />
                        ))}
                        <span className="text-sm ml-1 font-medium">{marque.rating}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                  <Eye className="h-4 w-4" />
                                  {marque.followers.toLocaleString()}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Abonnés</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                  <BadgeCheck className="h-4 w-4" />
                                  {marque.products}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Produits</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-medium"
                            onClick={() => handleMarqueClick(marque)}
                          >
                            Voir plus
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => toggleFavorite(e, marque.id)}
                          >
                            <Heart className={cn(
                              "h-3.5 w-3.5",
                              favoriteMarques.includes(marque.id) && "fill-red-500 text-red-500"
                            )} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

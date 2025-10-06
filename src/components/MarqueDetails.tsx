import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Instagram,
  Globe,
  Share2,
  Heart,
  ShoppingBag,
  ArrowUpRight,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Play,
  Eye,
  MapPin,
  Calendar,
  Sparkles,
  CircleUser,
  Award,
  MoreHorizontal
} from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator
} from '../components/ui/breadcrumb';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

import { article } from '../data/articleData';
import Footer from '../components/Footer';

interface Article {
  marque: string;
  collection: string;
  rating: string;
  reviewCount: number;
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  discount: number | null;
  id: number;
  title: string;
  description: string;
  image: string;
  categorie: string;
  couleurs?: CouleurImage[];
}

interface CouleurImage {
  src: string;
  alt: string;
}

interface Artist {
  id: string;
  name: string;
  image: string;
  category: string;
  followers: number;
  rating?: number;
}

export default function MarqueDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCollection, setActiveCollection] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const videoRef = useRef(null);

  const marque = location.state?.marque || {
    id: "m1",
    name: "Studio Moderne",
    image: "/placeholder-artist-1.jpg",
    event: "Exposition Permanente",
    category: "Art Contemporain",
    description: "Studio Moderne est un collectif d'artistes talentueux qui collabore avec notre plateforme pour offrir des créations uniques et originales. À travers leurs œuvres, vous découvrirez un univers artistique riche et inspirant qui reflète leur vision personnelle et leur style distinctif.",
    rating: 4.8,
    followers: 12453,
    founded: "2018",
    location: "Paris, France"
  };

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);

    // Add scroll listener for sticky header effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);

    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Mock collections for this marque
  const collections = [
    { id: 'all', name: 'Tous les produits', count: 24 },
    { id: 'collection1', name: 'Collection Printemps', count: 12 },
    { id: 'collection2', name: 'Collection Été', count: 8 },
    { id: 'exclusive', name: 'Éditions limitées', count: 4 }
  ];

  // Simulate related products
  const marqueArticles = (article as any[])
    .slice(0, 12)
    .map((item: any) => ({
      ...item,
      marque: marque.name,
      collection: ['collection1', 'collection2', 'exclusive'][Math.floor(Math.random() * 3)],
      rating: (3 + Math.random() * 2).toFixed(1),
      reviewCount: Math.floor(Math.random() * 100),
      inStock: Math.random() > 0.2,
      isFeatured: Math.random() > 0.7,
      isNew: Math.random() > 0.7,
      discount: Math.random() > 0.8 ? Math.floor(Math.random() * 30) + 10 : null
    })) as Article[];

  const filteredArticles = activeCollection === 'all'
    ? marqueArticles
    : marqueArticles.filter(item => item.collection === activeCollection);

  const handleArticleClick = (item: Article) => {
    navigate('/product-details', { state: { product: item } });
  };

  const handleArtistClick = (artist: Artist) => {
    navigate('/artist-details', { state: { artist } });
  };

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
  };

  // Mock gallery items
  const galleryItems = [
    { type: 'image', src: marque.image, alt: 'Galerie photo 1' },
    { type: 'image', src: '/placeholder-artist-2.jpg', alt: 'Galerie photo 2' },
    { type: 'video', src: '/video-placeholder.mp4', poster: '/placeholder-artist-3.jpg', alt: 'Vidéo de l\'atelier' },
    { type: 'image', src: '/placeholder-artist-1.jpg', alt: 'Galerie photo 3' },
    { type: 'image', src: '/placeholder-artist-2.jpg', alt: 'Galerie photo 4' },
    { type: 'image', src: '/placeholder-artist-3.jpg', alt: 'Galerie photo 5' }
  ];

  // Mock tags for this marque
  const tags = marque.category
    ? [marque.category, 'Art contemporain', 'Design', 'Illustration', 'Édition limitée', 'Artisanat']
    : ['Art contemporain', 'Design', 'Illustration', 'Édition limitée', 'Artisanat'];

  // Mock similar artists
  const similarArtists = Array.from({ length: 6 }).map((_, index) => ({
    id: `artist-${index}`,
    name: `Artiste ${index + 1}`,
    image: `/placeholder-artist-${(index % 3) + 1}.jpg`,
    category: ['Peinture', 'Sculpture', 'Photographie', 'Design', 'Illustration'][index % 5],
    followers: Math.floor(Math.random() * 10000) + 1000,
    rating: Math.floor(Math.random() * 5) + 1
  })) as Artist[];

  // Mock testimonials
  const testimonials = [
    {
      id: 1,
      name: "Marie Dupont",
      avatar: "/placeholder-user-1.jpg",
      comment: "J'adore les créations de ce studio. Chaque pièce est unique et apporte une touche spéciale à mon intérieur.",
      rating: 5,
      date: "Il y a 2 semaines"
    },
    {
      id: 2,
      name: "Thomas Laurent",
      avatar: "/placeholder-user-2.jpg",
      comment: "Design innovant et qualité exceptionnelle. Je recommande vivement !",
      rating: 5,
      date: "Il y a 1 mois"
    },
    {
      id: 3,
      name: "Julie Martin",
      avatar: "/placeholder-user-3.jpg",
      comment: "Un style reconnaissable et des œuvres qui ne laissent pas indifférent.",
      rating: 4,
      date: "Il y a 2 mois"
    }
  ];

  // Mock events
  const events = [
    {
      id: 1,
      title: "Exposition éphémère",
      date: "15-30 juin 2025",
      location: "Galerie Moderne, Paris",
      image: "/placeholder-event-1.jpg"
    },
    {
      id: 2,
      title: "Workshop créatif",
      date: "7 juillet 2025",
      location: "Studio de l'artiste, Lyon",
      image: "/placeholder-event-2.jpg"
    }
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded-md w-48 mb-8"></div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="rounded-lg bg-muted aspect-square mb-4"></div>
              </div>

              <div className="w-full md:w-2/3">
                <div className="h-8 bg-muted rounded-md w-64 mb-4"></div>
                <div className="h-4 bg-muted rounded-md w-48 mb-6"></div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-muted rounded-md w-full"></div>
                  <div className="h-4 bg-muted rounded-md w-full"></div>
                  <div className="h-4 bg-muted rounded-md w-3/4"></div>
                </div>
                <div className="flex gap-2 mb-6">
                  <div className="h-6 bg-muted rounded-full w-20"></div>
                  <div className="h-6 bg-muted rounded-full w-24"></div>
                  <div className="h-6 bg-muted rounded-full w-16"></div>
                </div>
              </div>
            </div>

            <div className="h-10 bg-muted rounded-md w-full mt-8"></div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-lg bg-muted aspect-square"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      {/* Hero Banner */}
      <div className="w-full h-40 md:h-64 relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-6">
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 rounded-full shadow-md"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-start">
            <h1 className="text-white text-2xl md:text-4xl font-bold">{marque.name}</h1>
            <p className="text-white text-sm md:text-lg mt-2">{marque.event}</p>
          </div>
        </div>
      </div>

      {/* Sticky header on scroll */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b transform transition-all duration-300 py-3 px-4 shadow-sm",
          isScrolled ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-6 w-6">
              <AvatarImage src={marque.image} alt={marque.name} />
              <AvatarFallback>{marque.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="font-medium truncate">{marque.name}</h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isFollowing ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full",
                isFollowing && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={handleFollowClick}
            >
              {isFollowing ? "Suivi" : "Suivre"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" /> Partager
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Heart className="h-4 w-4 mr-2" /> Ajouter aux favoris
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="h-4 w-4 mr-2" /> Contacter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <main className="flex-1 pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb navigation */}
          <Breadcrumb className="mb-6 hidden md:flex">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/all-marques">Marques</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="font-medium">{marque.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Artist Profile - Mobile */}
          <div className="block md:hidden mb-8">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden bg-muted aspect-square mb-4">
                <img
                  src={marque.image}
                  alt={marque.name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/50"
                  onClick={() => setShowGallery(true)}
                >
                  <ImageIcon className="h-4 w-4 text-white" />
                </Button>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{marque.name}</h1>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{marque.location || "Paris, France"}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-sm">{marque.rating || "4.8"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({marque.followers || "12K"}+ followers)</span>
                  </div>
                </div>

                <Button
                  className={cn(
                    "rounded-full",
                    isFollowing && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowClick}
                >
                  {isFollowing ? "Suivi" : "Suivre"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Fondé en</p>
                  <p className="font-medium">{marque.founded || "2018"}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Produits</p>
                  <p className="font-medium">{marqueArticles.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Followers</p>
                  <p className="font-medium">{marque.followers?.toLocaleString() || "12K+"}</p>
                </CardContent>
              </Card>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="mb-4 w-full">
                  À propos de l'artiste
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{marque.name}</SheetTitle>
                  <SheetDescription>{marque.event}</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-sm">
                    {marque.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Instagram size={16} />
                      Instagram
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Globe size={16} />
                      Site web
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex gap-2 mb-4 flex-wrap">
              {tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full">
                <Instagram size={14} />
                Instagram
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full">
                <Globe size={14} />
                Site web
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <a href={`mailto:contact@${marque.name.toLowerCase().replace(/\s/g, '')}.com`}>
                  Contact
                </a>
              </Button>
            </div>
          </div>

          {/* Artist Profile - Desktop */}
          <div className="hidden md:flex gap-8 mb-12">
            <div className="w-1/3">
              <div className="sticky top-24 space-y-6">
                <Dialog open={showGallery} onOpenChange={setShowGallery}>
                  <DialogTrigger asChild>
                    <div className="rounded-2xl overflow-hidden bg-muted aspect-square relative group cursor-pointer">
                      <img
                        src={marque.image}
                        alt={marque.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/80 backdrop-blur-sm rounded-full p-3">
                          <Eye className="h-6 w-6" />
                        </div>
                      </div>
                      <Badge className="absolute top-3 right-3 bg-black/50 text-white hover:bg-black/70">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Voir la galerie
                      </Badge>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0">
                    <DialogHeader className="p-4 pb-0">
                      <DialogTitle>Galerie {marque.name}</DialogTitle>
                      <DialogDescription>
                        Découvrez l'univers visuel de {marque.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="p-4">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {galleryItems.map((item, index) => (
                            <CarouselItem key={index}>
                              <div className="bg-muted rounded-lg overflow-hidden aspect-video relative">
                                {item.type === 'image' ? (
                                  <img
                                    src={item.src}
                                    alt={item.alt}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <>
                                    <video
                                      ref={videoRef}
                                      src={item.src}
                                      poster={item.poster}
                                      className="w-full h-full object-cover"
                                      controls
                                    />
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-center mt-2">{item.alt}</p>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </Carousel>

                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {galleryItems.map((item, index) => (
                          <div
                            key={index}
                            className="w-20 h-20 flex-shrink-0 rounded overflow-hidden"
                          >
                            {item.type === 'image' ? (
                              <img
                                src={item.src}
                                alt={`Miniature ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full relative">
                                <img
                                  src={item.poster}
                                  alt={`Miniature vidéo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Card className="overflow-hidden">
                  <div className="p-4 bg-muted/30">
                    <h3 className="font-medium">Statistiques</h3>
                  </div>
                  <CardContent className="p-4 grid gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avis</span>
                      <div className="flex items-center">
                        <div className="flex mr-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-3 w-3",
                                star <= Math.round(marque.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{marque.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Followers</span>
                      <span className="text-sm font-medium">{marque.followers?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Produits</span>
                      <span className="text-sm font-medium">{marqueArticles.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fondé en</span>
                      <span className="text-sm font-medium">{marque.founded}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lieu</span>
                      <span className="text-sm font-medium">{marque.location}</span>
                    </div>
                  </CardContent>
                </Card>

                {events.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="p-4 bg-muted/30">
                      <h3 className="font-medium">Événements à venir</h3>
                    </div>
                    <CardContent className="p-4 grid gap-4">
                      {events.map((event) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="w-2/3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Badge className="mb-2" variant="outline">{marque.category}</Badge>
                  <h1 className="text-3xl font-bold">{marque.name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{marque.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Fondé en {marque.founded}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{marque.rating}</span>
                    </div>
                    <div className="h-4 w-px bg-border"></div>
                    <span className="text-sm text-muted-foreground">{marque.followers?.toLocaleString()} followers</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full">
                    <Instagram size={14} />
                    Instagram
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full">
                    <Globe size={14} />
                    Site web
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <a href={`mailto:contact@${marque.name.toLowerCase().replace(/\s/g, '')}.com`}>
                      Contact
                    </a>
                  </Button>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">À propos</h2>
                <p className="text-sm mb-4">
                  {marque.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Témoignages</h2>
                <div className="space-y-6">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar>
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{testimonial.name}</h4>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= testimonial.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{testimonial.comment}</p>
                      <div className="text-xs text-muted-foreground">{testimonial.date}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Produits</h2>
                <Tabs value={activeCollection} onValueChange={setActiveCollection}>
                  <TabsList className="mb-4">
                    {collections.map((collection) => (
                      <TabsTrigger key={collection.id} value={collection.id}>
                        {collection.name} ({collection.count})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="all">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredArticles.map((item) => (
                        <Card
                          key={item.id}
                          className="overflow-hidden border border-border/40 shadow-sm transition-all duration-300 h-full group hover:shadow-lg hover:border-primary/40 hover:translate-y-[-4px]"
                          onClick={() => handleArticleClick(item)}
                        >
                          <div className="aspect-square overflow-hidden bg-muted relative">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                              <div className="w-full flex justify-between items-center">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs font-medium"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Aperçu
                                </Button>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                  >
                                    <Heart className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {item.isNew && (
                              <Badge className="absolute top-3 left-3 bg-emerald-500 text-white border-none">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Nouveau
                              </Badge>
                            )}
                            {item.discount && (
                              <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-none">
                                -{item.discount}%
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold">{item.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {item.categorie || "Autre"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= parseFloat(item.rating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-none text-muted-foreground"
                                  )}
                                />
                              ))}
                              <span className="text-sm ml-1 font-medium">{item.rating}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                  <Eye className="h-4 w-4" />
                                  {item.reviewCount}
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                  <ShoppingBag className="h-4 w-4" />
                                  {item.inStock ? "En stock" : "Rupture"}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-medium"
                              >
                                Voir plus
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Artistes similaires</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {similarArtists.map((artist) => (
                    <Card
                      key={artist.id}
                      className="overflow-hidden border border-border/40 shadow-sm transition-all duration-300 h-full group hover:shadow-lg hover:border-primary/40 hover:translate-y-[-4px]"
                      onClick={() => handleArtistClick(artist)}
                    >
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <div className="w-full flex justify-between items-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs font-medium"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Aperçu
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                              >
                                <Heart className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{artist.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {artist.category || "Autre"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <CircleUser className="h-4 w-4" />
                            {artist.followers.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Award className="h-4 w-4" />
                            {artist.rating}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, ChevronRight, Plus, Minus, Truck, Shield, Star } from 'lucide-react';
import { getRelatedProducts } from '../data/articleData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Avatar } from '../components/ui/avatar';
import { AvatarFallback } from '@radix-ui/react-avatar';
import RelatedProductsTabs from '../components/RelatedProductsTabs';

// Define the type for Article
interface Article {
    id: number;
    title: string;
    description: string;
    price: string;
    image: string;
    images?: string[];
    couleurs?: { couleur: string; image: string }[];
    categorie: string;
    meilleurVente?: boolean;
}

const DetailsProduct = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;
    const product = state?.product as Article | undefined;

    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState<Article[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    const simplifiedColors = [
        { name: 'noir', code: '#121212' },
        { name: 'blanc', code: '#FFFFFF' },
        { name: 'gris', code: '#6B7280' }
    ];

    const productColors = product?.couleurs || [];

    useEffect(() => {
        if (product) {
            if (productColors.length > 0) {
                setSelectedColor(productColors[0].couleur);
                setSelectedImage(0);
            } else {
                setSelectedColor(simplifiedColors[0].code);
            }
        }
    }, [product, productColors]);

    useEffect(() => {
        if (product) {
            const related = getRelatedProducts(product.id);
            setRelatedProducts(related);
        }
    }, [product]);

    if (!product) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-6">
                <p className="text-xl text-center text-gray-600 font-medium">Produit non trouvé</p>
            </div>
        );
    }

    const productImages = product.images || Array(5).fill(product.image);

    const incrementQuantity = () => setQuantity(prev => prev + 1);
    const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

    const getCurrentImage = () => {
        if (productColors.length > 0 && selectedColor) {
            const colorObj = productColors.find(c => c.couleur === selectedColor);
            if (colorObj) return colorObj.image;
        }
        return productImages[selectedImage];
    };

    const handleColorChange = (colorCode: string) => {
        setSelectedColor(colorCode);
        const colorObj = productColors.find(c => c.couleur === colorCode);
        if (colorObj && colorObj.image) {
            const imageIndex = productImages.findIndex(img => img === colorObj.image);
            if (imageIndex >= 0) {
                setSelectedImage(imageIndex);
            }
        }
    };

    const colorsToDisplay = productColors.length > 0
        ? productColors.map(c => ({
            code: c.couleur,
            name: c.couleur
          }))
        : simplifiedColors;

    const mainImageToDisplay = getCurrentImage();

    const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;

        const imageContainer = e.currentTarget;
        const { left, top, width, height } = imageContainer.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        setZoomPosition({ x, y });
    };

    const handleAddToCart = () => {
        navigate('/cart', {
            state: {
                product,
                quantity,
                selectedSize,
                selectedColor
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 bg-gray-50">
            <nav className="flex mb-8 text-sm text-gray-500 font-medium">
                <Link to="/" className="hover:text-gray-800 transition-colors">Accueil</Link>
                <ChevronRight size={16} className="mx-2" />
                <Link to={`/category/${product.categorie}`} className="hover:text-gray-800 transition-colors">{product.categorie}</Link>
                <ChevronRight size={16} className="mx-2" />
                <span className="text-gray-900">{product.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                        <div
                            className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in relative"
                            onMouseEnter={() => setIsZoomed(true)}
                            onMouseLeave={() => setIsZoomed(false)}
                            onMouseMove={handleImageZoom}
                        >
                            <div
                                className={`w-full h-full transition-all duration-200 ${isZoomed ? 'scale-150' : ''}`}
                                style={isZoomed ? {
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                                } : {}}
                            >
                                <img
                                    src={mainImageToDisplay}
                                    alt={product.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {isZoomed && (
                                <Badge variant="outline" className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-sm">
                                    Survolez pour zoomer
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {productImages.slice(0, 5).map((image, index) => (
                                <button
                                    key={index}
                                    className={`aspect-square border rounded-lg overflow-hidden transition-all ${
                                        mainImageToDisplay === image
                                            ? 'border-gray-800 ring-1 ring-gray-200'
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    onClick={() => {
                                        setSelectedImage(index);
                                        const colorWithThisImage = productColors.find(c => c.image === image);
                                        if (colorWithThisImage) {
                                            setSelectedColor(colorWithThisImage.couleur);
                                        }
                                    }}
                                >
                                    <img
                                        src={image}
                                        alt={`${product.title} view ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary">Éco-responsable</Badge>
                            {product.meilleurVente && (
                                <Badge variant="secondary">Meilleure vente</Badge>
                            )}
                        </div>

                        <CardTitle className="text-3xl font-bold text-gray-900">{product.title}</CardTitle>

                        <div className="flex items-center mt-2">
                            <div className="flex text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={16} fill="currentColor" className={star <= 4 ? "text-amber-500" : "text-gray-300"} />
                                ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">4.2 (4 avis)</span>
                            <Button variant="link" className="text-sm px-1 h-auto">
                                Lire les avis
                            </Button>
                        </div>

                        <CardDescription className="mt-3 text-gray-600">
                            {product.description}
                        </CardDescription>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6 space-y-6">
                        <div>
                            <div className="flex items-baseline">
                                <span className="text-3xl font-bold text-gray-900">{product.price}</span>
                                <span className="ml-2 text-sm text-gray-500">TVA incluse</span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                <Truck size={16} className="mr-1" />
                                <span>Livraison gratuite à partir de 50€</span>
                            </div>
                        </div>

                        {colorsToDisplay.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium">
                                        Couleur sélectionnée: <span className="font-semibold">{selectedColor}</span>
                                    </Label>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {colorsToDisplay.slice(0, 3).map((color) => (
                                        <TooltipProvider key={color.code}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${selectedColor === color.code ? 'border-gray-800 ring-1 ring-gray-200' : 'border-gray-200'}`}
                                                        style={{ backgroundColor: color.code }}
                                                        onClick={() => handleColorChange(color.code)}
                                                        aria-label={`Couleur ${color.name}`}
                                                    >
                                                        {selectedColor === color.code && (
                                                            <span className={`text-xs ${['#FFFFFF'].includes(color.code) ? 'text-gray-800' : 'text-white'}`}>✓</span>
                                                        )}
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    {color.name}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm font-medium">Taille</Label>
                                <Button variant="link" className="text-sm h-auto p-0">Guide des tailles</Button>
                            </div>
                            <RadioGroup
                                value={selectedSize}
                                onValueChange={setSelectedSize}
                                className="grid grid-cols-6 gap-2"
                            >
                                {sizes.map((size) => (
                                    <div key={size} className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value={size}
                                            id={`size-${size}`}
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor={`size-${size}`}
                                            className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-900 peer-data-[state=checked]:border-gray-900 peer-data-[state=checked]:bg-gray-900 peer-data-[state=checked]:text-white"
                                        >
                                            {size}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <div className="flex items-center border border-gray-300 rounded-lg w-36 overflow-hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-none"
                                    onClick={decrementQuantity}
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={16} />
                                </Button>
                                <span className="flex-1 text-center py-2 font-medium">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-none"
                                    onClick={incrementQuantity}
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>

                            <Button className="flex-1" size="lg" onClick={handleAddToCart}>
                                <ShoppingCart size={18} className="mr-2" />
                                <span>Ajouter au panier</span>
                            </Button>

                            <Button variant="outline" size="icon" className="h-12 w-12">
                                <Heart size={20} />
                            </Button>
                        </div>

                        <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-start">
                                    <div className="mt-1 text-gray-700">
                                        <Truck size={18} />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-semibold text-gray-900">Livraison rapide</p>
                                        <p className="text-sm text-gray-600">Expédition sous 24h, livraison 2-3 jours</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="mt-1 text-gray-700">
                                        <Shield size={18} />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-semibold text-gray-900">Garantie satisfaction</p>
                                        <p className="text-sm text-gray-600">Retour gratuit sous 30 jours</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>

                    <Separator />

                    <CardFooter className="py-4 flex items-center space-x-6">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800">
                            <Share2 size={16} className="mr-2" />
                            <span>Partager</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800">
                            <Heart size={16} className="mr-2" />
                            <span>Ajouter aux favoris</span>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Card className="mb-16">
                <Tabs defaultValue="description" onValueChange={setActiveTab} value={activeTab}>
                    <TabsList className="grid w-full grid-cols-3 h-auto border-b rounded-none p-0">
                        <TabsTrigger
                            value="description"
                            className="py-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900"
                        >
                            Description
                        </TabsTrigger>
                        <TabsTrigger
                            value="details"
                            className="py-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900"
                        >
                            Caractéristiques
                        </TabsTrigger>
                        <TabsTrigger
                            value="reviews"
                            className="py-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900"
                        >
                            Avis (4)
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="p-6">
                        <div className="prose max-w-none">
                            <p className="text-gray-600 leading-relaxed">{product.description}</p>
                            <p className="text-gray-600 leading-relaxed">Ce produit est conçu avec des matériaux de haute qualité et offre un confort exceptionnel. Il est idéal pour toutes les occasions et saisons.</p>
                            <p className="text-gray-600 leading-relaxed">Notre engagement envers l'environnement nous pousse à sélectionner exclusivement des matières premières éco-responsables et des processus de fabrication à faible impact écologique.</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="details" className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Matériaux et entretien</h3>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>100% coton bio certifié GOTS</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Grammage: 180g/m²</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Lavable en machine à 30°C</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Ne pas utiliser de sèche-linge</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Repasser à température moyenne</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Notre engagement</h3>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Fabriqué de manière éthique en Europe</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Empreinte carbone réduite</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>Emballage recyclable et compostable</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mt-2 mr-2"></span>
                                        <span>1% des ventes reversé à des associations environnementales</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="reviews" className="p-6">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Avis clients</h3>
                                <Button>
                                    Écrire un avis
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {[1, 2, 3].map((review) => (
                                    <div key={review} className="border-b border-gray-200 pb-6">
                                        <div className="flex justify-between mb-2">
                                            <div className="flex items-center">
                                                <Avatar>
                                                    <AvatarFallback className="bg-gray-100 text-gray-800">
                                                        {String.fromCharCode(64 + review)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">Client satisfait</p>
                                                    <div className="flex mt-1 text-amber-500">
                                                        {Array(5).fill(0).map((_, i) => (
                                                            <Star key={i} size={14} fill="currentColor" className={i < 4 ? "text-amber-500" : "text-gray-300"} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">Il y a {review * 2} semaines</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Très satisfait de mon achat ! La qualité est au rendez-vous, et la taille correspond parfaitement. Le style est moderne et élégant, exactement comme sur les photos.
                                        </p>
                                    </div>
                                ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>

                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Ce design est aussi disponible sur d'autres produits</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((item) => (
                                <Link
                                    to={`/product/${item.id}`}
                                    state={{ product: item }}
                                    key={item.id}
                                    className="group"
                                >
                                    <Card className="border-0 overflow-hidden shadow-sm">
                                        <div className="aspect-square bg-white overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <CardContent className="p-4">
                                            <Badge variant="secondary" className="mb-2">
                                                {item.meilleurVente ? 'Meilleure vente' : item.categorie}
                                            </Badge>
                                            <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm font-bold text-gray-900 mt-1">{item.price}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                        <RelatedProductsTabs/>
                    </div>
                </div>
            );
        };

        export default DetailsProduct;

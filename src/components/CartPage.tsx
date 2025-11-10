import { useState, useEffect, JSX } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Check,
  ChevronRight,
  CreditCard,
  Truck,
  Phone,
  UserCircle,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AlertDialog, AlertDialogDescription } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { newOrderService } from '../services/newOrderService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import { PaymentMethod } from '../types/order';
import type { Order } from '../types/order';
import { formatPriceInFRF } from '../utils/priceUtils';

const WAVE_LOGO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm9rYPURKIok7K0ZF22oqFgMbzIHgNCauVQA&s";
const ORANGE_MONEY_LOGO = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/60/d2/b7/60d2b73d-8519-04dc-4826-6184ca34f49a/AppIcon-0-0-1x_U007emarketing-0-5-0-85-220.png/1200x630wa.png";

interface Region {
  value: string;
  label: string;
}

interface DeliveryPricing {
  [key: string]: { price: number; time: string };
}

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
  selectedColorId?: number;
  selectedColorObject?: {
    id: number;
    name: string;
    hexCode?: string;
    imageUrl?: string;
  };
  selectedSize?: string | { id: number; name: string; };
  selectedColor?: string | { id: number; name: string; };
}

interface ShippingDetails {
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  phone: string;
  notes?: string;
}

const regions: Region[] = [
  { value: "dakar", label: "Dakar" },
  { value: "thies", label: "Thiès" },
  { value: "saint-louis", label: "Saint-Louis" },
  { value: "kaolack", label: "Kaolack" },
  { value: "ziguinchor", label: "Ziguinchor" },
  { value: "diourbel", label: "Diourbel" },
  { value: "tambacounda", label: "Tambacounda" },
];

const deliveryPricing: DeliveryPricing = {
  dakar: { price: 1500, time: "24h" },
  thies: { price: 2000, time: "48h" },
  "saint-louis": { price: 2500, time: "48-72h" },
  kaolack: { price: 2500, time: "48-72h" },
  ziguinchor: { price: 3000, time: "3-5 jours" },
  diourbel: { price: 2500, time: "48-72h" },
  tambacounda: { price: 3000, time: "3-5 jours" },
};

const CartPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems: globalCartItems, clearCart } = useCart();
  const { state } = location;
  const { product, quantity, selectedSize, selectedColor, buyNow, fromCart, allCartItems, selectedColorId, selectedColorObject } = state || {};

  // Initialiser les items du panier selon le contexte
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (fromCart && allCartItems && allCartItems.length > 0) {
      // Convertir les items du panier global vers le format CartPage
      return allCartItems.map((item: any) => {
        // Gestion plus sûre de size et color
        let finalSize: string | undefined = undefined;
        if (item.selectedSize) {
          if (typeof item.selectedSize === 'object' && item.selectedSize.name) {
            finalSize = item.selectedSize.name;
          } else if (typeof item.selectedSize === 'string') {
            finalSize = item.selectedSize;
          }
        }

        let finalColor: string | undefined = undefined;
        if (item.selectedColor) {
          if (typeof item.selectedColor === 'object' && item.selectedColor.name) {
            finalColor = item.selectedColor.name;
          } else if (typeof item.selectedColor === 'string') {
            finalColor = item.selectedColor;
          }
        }

        return {
          id: item.productId?.toString() || item.id?.toString(), // Plus robuste
          title: item.productName || item.name || item.title, // Plus robuste
          price: typeof item.unitPrice === 'number' ? formatPriceInFRF(item.unitPrice) : item.price, // Plus robuste
          image: item.productImage || item.image, // Plus robuste
          quantity: item.quantity,
          size: finalSize,
          color: finalColor,
          selectedColorId: item.selectedColorId,
          selectedColorObject: item.selectedColorObject,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        };
      });
    } else if (product) {
      // Achat direct depuis la page produit
      console.log('🛍️ Achat direct - Données du state:', {
        selectedColorId,
        selectedColorObject,
        selectedSize,
        selectedColor
      });
      
      // Utiliser selectedSize et selectedColor déstructurés du state
      const directSize = typeof selectedSize === 'object' && selectedSize !== null ? selectedSize.name : selectedSize;
      const directColor = typeof selectedColor === 'object' && selectedColor !== null ? selectedColor.name : selectedColor;

      return [{
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
        size: directSize, // Utiliser la valeur transformée venant de selectedSize du state
        color: directColor, // Utiliser la valeur transformée venant de selectedColor du state
        selectedColorId: selectedColorId, // Utiliser selectedColorId du state directement
        selectedColorObject: selectedColorObject ? {
          id: selectedColorObject.id,
          name: selectedColorObject.name,
          hexCode: selectedColorObject.hexCode,
          imageUrl: selectedColorObject.imageUrl,
        } : undefined,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
      }];
    } else {
      // Panier vide
      return [];
    }
  });
  const [step, setStep] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    firstName: '',
    lastName: '',
    street: '',
    apartment: '',
    city: '',
    region: 'dakar',
    postalCode: '',
    country: 'Sénégal',
    phone: '',
    notes: '',
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [otpConfirmation, setOtpConfirmation] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string>('');

  useEffect(() => {
    console.log("Cart items:", cartItems);
  }, [cartItems]);

  const handleQuantityChange = (index: number, change: number): void => {
    setCartItems(prev => {
      const updated = [...prev];
      const newQuantity = Math.max(1, updated[index].quantity + change);
      updated[index].quantity = newQuantity;
      return updated;
    });
  };

  const handleRemoveItem = (index: number): void => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const extractPrice = (priceString: string): number => {
    if (!priceString) return 0;
    return parseFloat(priceString.replace('CFA', '').replace(/\s+/g, '').replace(',', '.').trim());
  };

  const calculateSubtotal = (): number => {
    return cartItems.reduce((sum, item) => {
      const price = extractPrice(item.price);
      return sum + (price * item.quantity);
    }, 0);
  };

  const getShippingFee = (): number => {
    return deliveryPricing[shippingDetails.region]?.price || 0;
  };

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const shippingFee = getShippingFee();
    return (subtotal + shippingFee);
  };

  const formatPrice = (price: number): string => {
    return formatPriceInFRF(price);
  };

  const handleContinueToShipping = (): void => {
    if (cartItems.length === 0) return;
    console.log("Continuing to shipping step...");
    setStep(2);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(70|75|76|77|78|33)[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleContinueToPayment = (e: React.FormEvent): void => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!shippingDetails.firstName || shippingDetails.firstName.trim().length < 2) {
      newErrors.firstName = "Veuillez entrer un prénom valide (min. 2 caractères)";
    }
    if (!shippingDetails.lastName || shippingDetails.lastName.trim().length < 2) {
      newErrors.lastName = "Veuillez entrer un nom de famille valide (min. 2 caractères)";
    }
    if (!shippingDetails.street || shippingDetails.street.trim().length < 5) {
      newErrors.street = "Veuillez entrer une rue valide (min. 5 caractères)";
    }
    // apartment est optionnel
    if (!shippingDetails.city || shippingDetails.city.trim().length < 2) {
      newErrors.city = "Veuillez entrer une ville valide (min. 2 caractères)";
    }
    if (!shippingDetails.region) { // La région est requise
      newErrors.region = "Veuillez sélectionner une région";
    }
    // postalCode est optionnel
    if (!shippingDetails.country || shippingDetails.country.trim().length < 2) {
      newErrors.country = "Veuillez entrer un pays valide (min. 2 caractères)";
    }

    if (!shippingDetails.phone) {
      newErrors.phone = "Veuillez entrer un numéro de téléphone";
    } else if (!validatePhone(shippingDetails.phone)) {
      newErrors.phone = "Format invalide. Ex: 77 123 45 67";
    }
    // notes est optionnel

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Shipping details validated:", shippingDetails);
      setStep(3);
    } else {
      console.log("Validation errors:", newErrors);
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
    }
  };

  const handleOtpChange = (index: number, value: string): void => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '' && index < 3) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethod);
  };

  const handlePayment = async (): Promise<void> => {
    const newErrors: { [key: string]: string } = {};

    if (!mobileNumber) {
      newErrors.mobileNumber = "Veuillez entrer un numéro de téléphone";
    } else if (!validatePhone(mobileNumber)) {
      newErrors.mobileNumber = "Format invalide. Ex: 77 123 45 67";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsProcessing(true);
      setOrderError('');

      try {
        // Vérifier si l'utilisateur est connecté
        if (!user) {
          toast.error('Vous devez être connecté pour passer une commande');
          navigate('/login');
          return;
        }

        // Préparer les détails de livraison avec le numéro de paiement
        const orderShippingDetails = {
          ...shippingDetails,
          phone: mobileNumber // Utiliser le numéro de paiement
        };

        console.log('📦 Création de commande avec:', {
          cartItems,
          shippingDetails: orderShippingDetails,
          paymentMethod,
          user: user.email
        });

        // Ajouter un log détaillé des items du panier
        console.log('🛒 Items détaillés du panier:', cartItems.map((item, index) => ({
          index,
          item: {
            id: item.id,
            title: item.title,
            selectedColorId: item.selectedColorId,
            selectedColorObject: item.selectedColorObject,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            size: item.size,
            color: item.color
          }
        })));

        // Créer la commande via le service
        const order = await newOrderService.createOrderFromCart(
          cartItems,
          orderShippingDetails,
          paymentMethod
        );

        setCreatedOrder(order);
        toast.success(`Commande ${order.orderNumber} créée avec succès!`);

        // Simuler la confirmation OTP
        setTimeout(() => {
          setIsProcessing(false);
          setOtpConfirmation(true);
        }, 2000);

      } catch (error: any) {
        console.error('❌ Erreur lors de la création de commande:', error);
        setIsProcessing(false);
        
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Erreur lors de la création de la commande';
        
        setOrderError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const confirmOtp = (): void => {
    const otpCode = otp.join('');

    if (otpCode.length !== 4) {
      setErrors({ otp: "Veuillez entrer le code complet à 4 chiffres" });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setOtpConfirmation(false);
      setIsSuccess(true);

      // Afficher un message de succès avec les détails de la commande
      if (createdOrder) {
        toast.success(`Commande ${createdOrder.orderNumber} confirmée!`, {
          description: `Total: ${formatPriceInFRF(createdOrder.totalAmount)}`
        });
      }

      // Vider le panier global si la commande vient du panier
      if (fromCart) {
        clearCart();
      }

      // Rediriger vers la page de mes commandes après 3 secondes
      setTimeout(() => {
        if (user) {
          navigate('/my-orders');
        } else {
          resetCart();
        }
      }, 3000);
    }, 1500);
  };

  const resetCart = (): void => {
    setCartItems([]);
    setShippingDetails({
      firstName: '',
      lastName: '',
      street: '',
      apartment: '',
      city: '',
      region: 'dakar', // Valeur par défaut
      postalCode: '',
      country: 'Sénégal', // Valeur par défaut
      phone: '',
      notes: '',
    });
    setMobileNumber('');
    setPaymentMethod('wave');
    setStep(1);
    setOtp(['', '', '', '', '']);
    setIsSuccess(false);
    // setSelectedRegion('dakar'); // Déjà supprimé, c'est bien
  };

  const handleBackToCart = (): void => {
    setStep(1);
  };

  const handleBackToShipping = (): void => {
    setStep(2);
    setOtpConfirmation(false);
  };

  const getStepTitle = (): string => {
    switch (step) {
      case 1: return 'Votre panier';
      case 2: return 'Informations de livraison';
      case 3: return 'Paiement';
      default: return 'Votre panier';
    }
  };

  const getOrderSummary = (): JSX.Element => (
    <Card className="p-4 bg-gray-50">
      <div className="text-sm font-medium text-gray-700 mb-3">Récapitulatif de commande</div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Sous-total ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</span>
          <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Livraison ({regions.find(r => r.value === shippingDetails.region)?.label})</span>
          <span className="font-medium">{formatPrice(getShippingFee())}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Délai estimé</span>
          <span className="font-medium">{deliveryPricing[shippingDetails.region]?.time}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">{formatPrice(calculateTotal())}</span>
        </div>
      </div>
    </Card>
  );

  const renderCartStep = (): JSX.Element => (
    <>
      {cartItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
            <ShoppingCart size={64} />
          </div>
          <p className="text-gray-500 mb-4">Votre panier est vide</p>
          <Button onClick={() => navigate('/')}>Continuer mes achats</Button>
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
            {cartItems.map((item, index) => (
              <Card key={index} className="p-4 mb-4">
                <div className="flex flex-col sm:flex-row">
                  <div className="h-24 w-24 rounded-md border bg-gray-50 flex-shrink-0 mb-4 sm:mb-0">
                    <img
                      src={item.image || "/api/placeholder/80/80"}
                      alt={item.title}
                      className="h-full w-full object-cover object-center rounded-md"
                    />
                  </div>
                  <div className="ml-0 sm:ml-4 flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <div className="mt-1 flex text-xs text-gray-500">
                          {item.size && <Badge variant="outline" className="mr-2">Taille: {item.size}</Badge>}
                          {item.color && <Badge variant="outline" className="bg-gray-100">Couleur: {item.color}</Badge>}
                        </div>
                        <div className="mt-2">
                          <span className="font-medium">{item.price}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                        </Button>
                        <div className="flex items-center mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-l-md rounded-r-none"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <span className="font-bold">-</span>
                          </Button>
                          <div className="h-8 px-3 flex items-center justify-center border-t border-b">
                            {item.quantity}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-r-md rounded-l-none"
                            onClick={() => handleQuantityChange(index, 1)}
                          >
                            <span className="font-bold">+</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            <div className="p-4 border rounded-md bg-blue-50 border-blue-100">
              <div className="flex gap-2 items-center mb-2">
                <Truck size={16} className="text-blue-600" />
                <span className="font-medium">Options de livraison</span>
              </div>
              <div className="space-y-2">
                <Select
                  value={shippingDetails.region}
                  onValueChange={(value) => setShippingDetails({ ...shippingDetails, region: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez votre région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm flex justify-between mt-1">
                  <span>Frais de livraison:</span>
                  <span className="font-medium">{formatPrice(getShippingFee())}</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span>Délai estimé:</span>
                  <span className="font-medium">{deliveryPricing[shippingDetails.region]?.time}</span>
                </div>
              </div>
            </div>

            {getOrderSummary()}
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinueToShipping}
              disabled={cartItems.length === 0}
            >
              Valider la commande <ChevronRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Continuer mes achats
            </Button>
          </div>
        </>
      )}
    </>
  );

  const renderShippingStep = (): JSX.Element => (
    <form onSubmit={handleContinueToPayment}>
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="text-base font-medium mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Votre prénom"
                  value={shippingDetails.firstName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, firstName: e.target.value })}
                  className={`mt-1 ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Votre nom"
                  value={shippingDetails.lastName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, lastName: e.target.value })}
                  className={`mt-1 ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="phone">Téléphone (pour la livraison)</Label>
              <Input
                id="phone"
                placeholder="7X XXX XX XX"
                value={shippingDetails.phone}
                onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                className={`mt-1 ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-base font-medium mb-4">Adresse de livraison</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="street">Rue et numéro</Label>
                <Input
                  id="street"
                  placeholder="Ex: 123 Rue de la République"
                  value={shippingDetails.street}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, street: e.target.value })}
                  className={`mt-1 ${errors.street ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>

              <div>
                <Label htmlFor="apartment">Appartement, bâtiment, étage (optionnel)</Label>
                <Input
                  id="apartment"
                  placeholder="Ex: Appt 4B, Bâtiment C"
                  value={shippingDetails.apartment || ''}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, apartment: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Ex: Dakar"
                    value={shippingDetails.city}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                    className={`mt-1 ${errors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="region">Région</Label>
                  <Select
                    value={shippingDetails.region}
                    onValueChange={(value) => setShippingDetails({ ...shippingDetails, region: value })}
                  >
                    <SelectTrigger id="region" className={`w-full mt-1 ${errors.region ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Sélectionnez votre région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Code Postal (optionnel)</Label>
                  <Input
                    id="postalCode"
                    placeholder="Ex: 12345"
                    value={shippingDetails.postalCode || ''}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, postalCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    placeholder="Ex: Sénégal"
                    value={shippingDetails.country}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, country: e.target.value })}
                    className={`mt-1 ${errors.country ? 'border-red-500 focus:ring-red-500' : ''}`}
                    // disabled // On pourrait le désactiver si on ne veut que le Sénégal
                  />
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Instructions spéciales (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informations supplémentaires pour la livraison"
                  value={shippingDetails.notes || ''}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, notes: e.target.value })}
                  className="resize-none mt-1"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {getOrderSummary()}

          <AlertDialog>
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDialogDescription className="text-xs text-amber-800">
              Les délais de livraison sont estimés et peuvent varier en fonction de la disponibilité.
            </AlertDialogDescription>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-2 justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="md:w-1/4"
          onClick={handleBackToCart}
        >
          Retour
        </Button>
        <Button
          type="submit"
          size="lg"
          className="md:w-2/3"
        >
          Continuer vers le paiement <ChevronRight size={16} className="ml-2" />
        </Button>
      </div>
    </form>
  );

  const renderPaymentStep = (): JSX.Element => (
    <>
      {otpConfirmation ? (
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Phone className="text-blue-600" size={28} />
            </div>
            <h3 className="text-lg font-medium mb-2">Confirmez le code reçu</h3>
            <p className="text-gray-500 text-sm mb-1">
              Un code de confirmation a été envoyé au
            </p>
            <p className="font-medium">{paymentMethod === 'wave' ? 'Wave' : 'Orange Money'} {mobileNumber}</p>
          </div>

          <div className="mb-8">
            <Label htmlFor="otp-code" className="text-center block mb-4">Entrez le code à 4 chiffres</Label>
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map(index => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-lg"
                  maxLength={1}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              ))}
            </div>
            {errors.otp && <p className="text-red-500 text-xs text-center mt-2">{errors.otp}</p>}

            <p className="text-center text-sm mt-4">
              <Button variant="link" size="sm" className="text-blue-500 p-0">
                Je n'ai pas reçu de code
              </Button>
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2 justify-between">
            <Button
              variant="outline"
              className="md:w-1/3"
              onClick={() => setOtpConfirmation(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button
              className="md:w-2/3"
              onClick={confirmOtp}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Vérification...
                </span>
              ) : (
                <span className="flex items-center">
                  Confirmer le paiement <Check size={16} className="ml-2" />
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-4 mb-6">
              <h3 className="text-base font-medium mb-4">Choisissez votre méthode de paiement</h3>
              
              {/* Affichage des erreurs de commande */}
              {orderError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-800">{orderError}</span>
                  </div>
                </div>
              )}
              
              {/* Affichage des informations de commande créée */}
              {createdOrder && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Commande {createdOrder.orderNumber} créée</p>
                      <p>Total: {formatPriceInFRF(createdOrder.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Tabs defaultValue={paymentMethod} onValueChange={handlePaymentMethodChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="wave" className="flex items-center justify-center py-2">
                    <div className="w-8 h-8 mr-2 rounded-full bg-blue-100 flex items-center justify-center">
                      <img src={WAVE_LOGO} alt="Wave" className="w-6 h-6 rounded-full" />
                    </div>
                    Wave
                  </TabsTrigger>
                  <TabsTrigger value="orange" className="flex items-center justify-center py-2">
                    <div className="w-8 h-8 mr-2 rounded-full bg-orange-100 flex items-center justify-center">
                      <img src={ORANGE_MONEY_LOGO} alt="Orange Money" className="w-6 h-6 rounded-full" />
                    </div>
                    Orange Money
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wave" className="mt-4">
                  <Card className="p-4 border-blue-200 bg-blue-50">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <img src={WAVE_LOGO} alt="Wave" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-sm font-medium mb-1">Payer avec Wave</p>
                          <p className="text-xs text-gray-600">Sécurisé, rapide et sans frais supplémentaires</p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="wave-phone">Numéro Wave</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            <Phone size={18} className="text-blue-600" />
                          </span>
                          <Input
                            id="wave-phone"
                            placeholder="77 123 45 67"
                            className={`rounded-l-none ${errors.mobileNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                          />
                        </div>
                        {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
                      </div>

                      <div className="text-sm bg-blue-100 rounded-md p-3">
                        <p className="font-medium mb-2 text-blue-800">Comment ça marche:</p>
                        <ol className="list-decimal pl-5 space-y-1 text-blue-800">
                          <li>Entrez votre numéro Wave</li>
                          <li>Vous recevrez une notification sur votre téléphone</li>
                          <li>Confirmez le paiement avec votre code secret</li>
                        </ol>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="orange" className="mt-4">
                  <Card className="p-4 border-orange-200 bg-orange-50">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <img src={ORANGE_MONEY_LOGO} alt="Orange Money" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-sm font-medium mb-1">Payer avec Orange Money</p>
                          <p className="text-xs text-gray-600">Sécurisé, rapide et sans frais supplémentaires</p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="orange-phone">Numéro Orange Money</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            <Phone size={18} className="text-orange-600" />
                          </span>
                          <Input
                            id="orange-phone"
                            placeholder="77 123 45 67"
                            className={`rounded-l-none ${errors.mobileNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                          />
                        </div>
                        {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
                      </div>

                      <div className="text-sm bg-orange-100 rounded-md p-3">
                        <p className="font-medium mb-2 text-orange-800">Comment ça marche:</p>
                        <ol className="list-decimal pl-5 space-y-1 text-orange-800">
                          <li>Entrez votre numéro Orange Money</li>
                          <li>Vous recevrez une notification sur votre téléphone</li>
                          <li>Confirmez le paiement avec votre code secret</li>
                        </ol>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="p-4">
              <h3 className="text-base font-medium mb-4">Récapitulatif de commande</h3>
              {getOrderSummary()}
            </Card>
          </div>

          <div className="space-y-4">
            <AlertDialog>
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDialogDescription className="text-xs text-amber-800">
                Votre paiement est sécurisé. Aucune information bancaire n'est stockée.
              </AlertDialogDescription>
            </AlertDialog>

            <Button
              size="lg"
              className="w-full"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Traitement en cours...
                </span>
              ) : (
                <span className="flex items-center">
                  Payer maintenant <CreditCard size={16} className="ml-2" />
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleBackToShipping}
              disabled={isProcessing}
            >
              Retour à la livraison
            </Button>
          </div>
        </div>
      )}
    </>
  );

  const renderSuccessStep = (): JSX.Element => (
    <div className="py-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="text-green-600" size={32} />
      </div>
      <h3 className="text-xl font-medium mb-2">Commande validée avec succès!</h3>
      <p className="text-gray-500 mb-6">Nous avons reçu votre paiement et votre commande est en cours de traitement.</p>
      <p className="text-gray-500 mb-6">Un email de confirmation a été envoyé à votre adresse.</p>
      <Button onClick={() => navigate('/')} size="lg">
        Fermer
      </Button>
    </div>
  );

  const renderStepIndicator = (): JSX.Element => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          1
        </div>
        <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          2
        </div>
        <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          3
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      {!isSuccess && (
        <div className="mb-6">
          <h1 className="flex items-center text-2xl">
            {step === 1 && <ShoppingCart className="mr-2" size={24} />}
            {step === 2 && <Truck className="mr-2" size={24} />}
            {step === 3 && <CreditCard className="mr-2" size={24} />}
            {getStepTitle()}
          </h1>
        </div>
      )}

      {!isSuccess && step > 1 && renderStepIndicator()}

      {isSuccess ? renderSuccessStep() : (
        <>
          {step === 1 && renderCartStep()}
          {step === 2 && renderShippingStep()}
          {step === 3 && renderPaymentStep()}
        </>
      )}
    </div>
  );
};

export default CartPage;
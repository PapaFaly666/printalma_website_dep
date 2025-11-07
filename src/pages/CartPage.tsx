import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingCart,
  Package,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/priceUtils';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  // Calculer les totaux
  const subtotal = getTotalPrice();
  const shipping = subtotal > 50000 ? 0 : 1500; // Livraison gratuite au-delà de 50 000 FCFA
  const total = subtotal + shipping;

  // Si le panier est vide
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Votre panier est vide
                </h2>
                <p className="text-slate-600 mb-8">
                  Découvrez nos produits et ajoutez-en à votre panier pour commencer vos achats
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 shadow-lg"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Découvrir les produits
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Mon Panier</h1>
                  <p className="text-slate-300 text-sm mt-1">
                    {items.length} article{items.length > 1 ? 's' : ''} dans votre panier
                  </p>
                </div>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={clearCart}
                className="gap-2 border-white/30 text-white hover:bg-white/20"
              >
                <Trash2 className="h-4 w-4" />
                Vider le panier
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles du panier */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden border-2 hover:border-slate-300 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Image du produit */}
                    <div className="relative flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-md group-hover:shadow-xl transition-shadow">
                        <img
                          src={item.imageUrl || '/api/placeholder/200/200'}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      {item.designUrl && (
                        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Personnalisé
                        </Badge>
                      )}
                    </div>

                    {/* Détails du produit */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.color && (
                              <Badge variant="outline" className="text-xs">
                                <div
                                  className="w-3 h-3 rounded-full mr-1 border border-slate-300"
                                  style={{ backgroundColor: item.colorCode || '#000' }}
                                />
                                {item.color}
                              </Badge>
                            )}
                            {item.size && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                Taille: {item.size}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Prix et quantité */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="h-10 w-10 p-0 rounded-none hover:bg-slate-100"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="w-12 h-10 flex items-center justify-center bg-slate-50 border-x-2 border-slate-200">
                              <span className="font-semibold text-slate-900">{item.quantity}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-10 w-10 p-0 rounded-none hover:bg-slate-100"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-slate-500 mt-1">
                              {formatPrice(item.price)} / unité
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Récapitulatif de commande */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Récapitulatif</h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total</span>
                      <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Livraison</span>
                      <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
                      </span>
                    </div>
                    {subtotal < 50000 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                          <strong>Astuce:</strong> Ajoutez {formatPrice(50000 - subtotal)} pour bénéficier de la livraison gratuite!
                        </p>
                      </div>
                    )}
                    <Separator className="my-4" />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/order-form')}
                    className="w-full gap-2 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 shadow-lg h-14 text-lg font-bold"
                  >
                    Passer la commande
                    <ArrowRight className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="w-full mt-3 gap-2"
                  >
                    Continuer mes achats
                  </Button>

                  {/* Garanties */}
                  <div className="mt-6 space-y-3 pt-6 border-t">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Livraison sécurisée</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Paiement 100% sécurisé</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>Service client 24/7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

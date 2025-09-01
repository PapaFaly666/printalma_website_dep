import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import newOrderService from '../../services/newOrderService';
import { Order, OrderItemDto, ProductInOrderDto, ShippingAddressObjectDto, UserInOrderDto, ProductViewDto } from '../../types/order';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Package, User, MapPin, Phone, Mail, Calendar, Hash, CreditCard, Printer, Edit, Info, Image as ImageIcon, Palette, Ruler, ShoppingCart } from 'lucide-react';
import { getStatusColor, getStatusIcon, formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrderDetails = async () => {
        setLoading(true);
        try {
          const numericOrderId = parseInt(orderId, 10);
          if (isNaN(numericOrderId)) {
            setError('ID de commande invalide.');
            setLoading(false);
            return;
          }
          const fetchedOrder = await newOrderService.getOrderById(numericOrderId);
          setOrder(fetchedOrder);
          setError(null);
        } catch (err) {
          const errorMessage = newOrderService.handleError(err, 'chargement détail commande');
          setError(errorMessage);
          setOrder(null);
        }
        setLoading(false);
      };
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement des détails de la commande...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Commande non trouvée</AlertTitle>
          <AlertDescription>Impossible de trouver les détails pour cette commande.</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  // Rendu principal de la page
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */} 
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button asChild variant="outline" size="sm" className="self-start sm:self-center">
            <Link to="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux commandes</Link>
          </Button>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-900">Commande #{order.orderNumber}</h1>
            <p className="text-sm text-slate-500">
              Créée le {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <Button variant="default" size="sm" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 self-end sm:self-center">
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </div>

        {/* Contenu Principal en Grille */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de Gauche: Infos Commande & Client */} 
          <div className="lg:col-span-2 space-y-6">
            {/* Statut et Montant */} 
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Statut Actuel</CardTitle>
                <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </div>
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900 mb-1">{formatCurrency(order.totalAmount)}</div>
                <p className="text-xs text-slate-500">
                  {order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''} commandé{order.orderItems.length > 1 ? 's' : ''}
                </p>
                {order.validator && (
                  <p className="text-xs text-slate-500 mt-2">
                    Validée par: {order.validator.firstName} {order.validator.lastName} (ID: {order.validator.id})
                    {order.validatedAt && ` le ${new Date(order.validatedAt).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Détails Client */} 
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><User className="mr-2 h-5 w-5" /> Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    {order.user.photo_profil && <AvatarImage src={order.user.photo_profil} alt={`${order.user.firstName} ${order.user.lastName}`} />}
                    <AvatarFallback className="bg-slate-200 text-slate-700">
                      {order.user.firstName?.[0]?.toUpperCase()}{order.user.lastName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">{order.user.firstName} {order.user.lastName}</p>
                    <p className="text-sm text-slate-500">ID Client: {order.user.id}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">{order.user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">{order.phoneNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs">{order.user.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes de Commande */} 
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes de la commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne de Droite: Adresse Livraison */} 
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><MapPin className="mr-2 h-5 w-5"/> Adresse de Livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.shippingAddress.name && <p className="font-semibold text-slate-800">{order.shippingAddress.name}</p>}
                <p className="text-slate-700">{order.shippingAddress.street}</p>
                {order.shippingAddress.apartment && <p className="text-slate-700">{order.shippingAddress.apartment}</p>}
                <p className="text-slate-700">{order.shippingAddress.city}, {order.shippingAddress.region}</p>
                {order.shippingAddress.postalCode && <p className="text-slate-700">{order.shippingAddress.postalCode}</p>}
                <p className="text-slate-700">{order.shippingAddress.country}</p>
                <Separator className="my-3" />
                <p className="text-xs text-slate-500 italic whitespace-pre-line bg-slate-50 p-2 rounded">
                  Formatée: <br />{order.shippingAddress.fullFormatted}
                </p>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Sous-total ({order.orderItems.length} articles)</span>
                        {/* Calculer sous-total si non dispo, sinon afficher total */} 
                        <span className="font-medium text-slate-800">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    {/* Ajouter frais de port et taxes si dispo et pertinent */} 
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span className="text-slate-800">Total</span>
                        <span className="text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                </CardContent>
            </Card>

          </div>
        </div>

        {/* Section Articles Commandés */} 
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><ShoppingCart className="mr-3 h-6 w-6" /> Articles Commandés ({order.orderItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-200">
              {order.orderItems.map((item, index) => (
                <div key={item.id || index} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Colonne Images Produit */} 
                  <div className="md:col-span-3">
                    {item.product?.designImageUrl ? (
                        <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img 
                                src={item.product.designImageUrl}
                                alt={item.product.designName || item.product.name || 'Design produit'}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                        </div>
                    ) : (
                      <div className="aspect-square w-full rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>

                  {/* Colonne Détails Produit */} 
                  <div className="md:col-span-6">
                    <h3 className="text-lg font-semibold text-slate-800 hover:text-blue-600">
                      <Link to={`/products/${item.product?.id}`}>{item.product?.name || 'Nom du produit inconnu'}</Link>
                    </h3>
                    {item.product?.categoryName && (
                        <p className="text-xs text-slate-500 mb-1">Catégorie: {item.product.categoryName}</p>
                    )}
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {item.product?.description || 'Pas de description disponible.'}
                    </p>
                    
                    {item.product?.designName && (
                        <div className="text-xs text-slate-500 mb-2 p-2 bg-slate-50 rounded">
                            <span className="font-medium">Design:</span> {item.product.designName}
                            {item.product.designDescription && <span className="italic"> - {item.product.designDescription}</span>}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-3">
                      {item.size && (
                        <div className="flex items-center">
                          <Ruler className="h-4 w-4 mr-1.5 text-slate-500" /> 
                          Taille: <span className="font-medium ml-1">{item.size}</span>
                        </div>
                      )}
                      {(item.color || item.product?.orderedColorName) && (
                        <div className="flex items-center">
                          <Palette className="h-4 w-4 mr-1.5 text-slate-500" /> 
                          Couleur: <span className="font-medium ml-1">{item.color || item.product?.orderedColorName}</span>
                          
                          {/* Debug log removed for production */}

                          {item.product?.orderedColorImageUrl ? (
                            <img 
                              src={item.product.orderedColorImageUrl}
                              alt={`Couleur ${item.product.orderedColorName}`}
                              title={`Couleur: ${item.product.orderedColorName}`}
                              className="w-5 h-5 rounded-sm border border-slate-300 ml-2 object-cover"
                            />
                          ) : item.product?.orderedColorHexCode ? (
                            <span 
                              title={`Couleur: ${item.product.orderedColorName} (${item.product.orderedColorHexCode})`}
                              className="w-5 h-5 rounded-sm border border-slate-300 ml-2 inline-block"
                              style={{ backgroundColor: item.product.orderedColorHexCode }}
                            ></span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Colonne Prix et Quantité */} 
                  <div className="md:col-span-3 text-left md:text-right">
                    <p className="text-lg font-semibold text-slate-800">{formatCurrency(item.unitPrice)}</p>
                    <p className="text-sm text-slate-500">Quantité: {item.quantity}</p>
                    <p className="text-xl font-bold text-slate-900 mt-2">
                      {formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailPage; 
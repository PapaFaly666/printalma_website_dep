import React from 'react';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../common/OrderStatusBadge';
import { ColorDisplay } from '../common/ColorDisplay';

interface OrderDetailsProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetails = ({ order, onClose }: OrderDetailsProps) => {
  if (!order) return null;

  // 🔍 DEBUG: Logs pour analyser la structure des données
  console.log('🔍 OrderDetails - Commande complète:', order);
  console.log('🔍 OrderDetails - orderItems:', order.orderItems);
  
  if (order.orderItems && order.orderItems.length > 0) {
    order.orderItems.forEach((item, index) => {
      console.log(`🔍 Item ${index}:`, item);
      console.log(`🔍 Item ${index} - product:`, item.product);
      console.log(`🔍 Item ${index} - color info:`, {
        color: item.color,
        orderedColorName: item.product?.orderedColorName,
        orderedColorHexCode: item.product?.orderedColorHexCode,
        orderedColorImageUrl: item.product?.orderedColorImageUrl
      });
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Détails de la commande #{order.orderNumber}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Informations de la commande</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro:</span>
                  <span className="font-medium">#{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Créée le:</span>
                  <span>{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                </div>
                {order.confirmedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmée le:</span>
                    <span>{new Date(order.confirmedAt).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expédiée le:</span>
                    <span>{new Date(order.shippedAt).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Livrée le:</span>
                    <span>{new Date(order.deliveredAt).toLocaleString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Informations client</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">{order.user.firstName} {order.user.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{order.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone:</span>
                  <span>{order.shippingAddress.phone || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Articles commandés */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Articles commandés</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.product?.designImageUrl && (
                            <img 
                              src={item.product.designImageUrl} 
                              alt={item.product?.name}
                              className="w-12 h-12 object-cover rounded mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name}
                            </div>
                            {item.size && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                  Taille: {item.size}
                                </span>
                              </div>
                            )}
                            {(item.color || item.product?.orderedColorName) && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <ColorDisplay 
                                  colorName={item.product?.orderedColorName || item.color}
                                  colorHexCode={item.product?.orderedColorHexCode}
                                  colorImageUrl={item.product?.orderedColorImageUrl}
                                  size="lg"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unitPrice.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(item.unitPrice * item.quantity).toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Résumé financier</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total:</span>
                  <span>{order.subtotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA (18%):</span>
                  <span>{order.taxAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison:</span>
                  <span>{order.shippingAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{order.totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Paiement</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Méthode:</span>
                  <span>{order.paymentMethod || 'Non spécifiée'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Adresse de livraison</h3>
              <div className="text-sm">
                <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>{order.shippingAddress.city} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Tél: {order.shippingAddress.phone}</p>}
              </div>
            </div>

            {order.billingAddress && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Adresse de facturation</h3>
                <div className="text-sm">
                  <p className="font-medium">{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                  <p>{order.billingAddress.address}</p>
                  {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                  <p>{order.billingAddress.city} {order.billingAddress.postalCode}</p>
                  <p>{order.billingAddress.country}</p>
                  {order.billingAddress.phone && <p>Tél: {order.billingAddress.phone}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
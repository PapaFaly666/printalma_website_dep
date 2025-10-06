import React, { useState, useEffect } from 'react';
import { Order, OrderFilters, OrderResponse } from '../types/order';
import { newOrderService } from '../services/newOrderService';
import { OrderStatusBadge } from '../components/common/OrderStatusBadge';
import { ColorDisplay } from '../components/common/ColorDisplay';
import { useAuth } from '../contexts/AuthContext';

export const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
    status: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('🔍 Chargement des commandes utilisateur...');
      
      // Utiliser le vrai service backend
      const response = await newOrderService.getMyOrders(filters.page, filters.limit, filters.status);
      setOrders(response.orders);
      setPagination(response.pagination);
      
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setOrders([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const viewOrderDetails = async (orderId: number) => {
    try {
      const order = await newOrderService.getOrderById(orderId);
      setSelectedOrder(order);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des détails');
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      await newOrderService.cancelOrder(orderId);
      alert('Commande annulée avec succès');
      fetchOrders();
    } catch (error: any) {
      const errorMessage = newOrderService.handleError(error, 'l\'annulation');
      alert(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h2>
          <p className="text-gray-600">Veuillez vous connecter pour voir vos commandes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Mes Commandes
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* Filtres */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        status: e.target.value as any || undefined, 
                        page: 1 
                      })}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="PENDING">En attente</option>
                      <option value="CONFIRMED">Confirmée</option>
                      <option value="PROCESSING">En traitement</option>
                      <option value="SHIPPED">Expédiée</option>
                      <option value="DELIVERED">Livrée</option>
                      <option value="CANCELLED">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Liste des commandes */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-8 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
                        <p className="text-gray-500 mb-6">
                          Vous n'avez pas encore passé de commande. Vos commandes apparaîtront ici une fois créées.
                        </p>
                        <button 
                          onClick={() => window.location.href = '/products'}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Découvrir nos produits
                        </button>
                      </div>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="order-card bg-white shadow rounded-lg p-6">
                        <div className="order-header flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="order-details grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-medium">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-medium">{order.totalAmount.toLocaleString()} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Articles</p>
                            <p className="font-medium">{order.orderItems.length}</p>
                          </div>
                        </div>
                        <div className="order-actions flex gap-2">
                          <button 
                            onClick={() => viewOrderDetails(order.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            Voir détails
                          </button>
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => cancelOrder(order.id)}
                              className="btn-cancel bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination flex justify-center items-center gap-4 mt-8">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <span className="text-gray-600">
                    Page {pagination.page} sur {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal des détails de commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Commande #{selectedOrder.orderNumber}</h2>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="order-summary mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-gray-600">Statut:</span>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Créée le:</p>
                    <p>{new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  {selectedOrder.confirmedAt && (
                    <div>
                      <p className="text-gray-600">Confirmée le:</p>
                      <p>{new Date(selectedOrder.confirmedAt).toLocaleString('fr-FR')}</p>
                    </div>
                  )}
                  {selectedOrder.shippedAt && (
                    <div>
                      <p className="text-gray-600">Expédiée le:</p>
                      <p>{new Date(selectedOrder.shippedAt).toLocaleString('fr-FR')}</p>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div>
                      <p className="text-gray-600">Livrée le:</p>
                      <p>{new Date(selectedOrder.deliveredAt).toLocaleString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-items mb-6">
                <h3 className="text-lg font-semibold mb-4">Articles commandés</h3>
                <div className="space-y-4">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="order-item flex gap-4 p-4 border border-gray-200 rounded-lg">
                      {item.product?.designImageUrl && (
                        <img 
                          src={item.product.designImageUrl} 
                          alt={item.product?.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="item-details flex-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                        {item.size && (
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Taille: {item.size}
                            </span>
                          </div>
                        )}
                        {(item.color || item.product?.orderedColorName) && (
                          <div className="flex items-center mt-1">
                            <ColorDisplay 
                              colorName={item.product?.orderedColorName || item.color}
                              colorHexCode={item.product?.orderedColorHexCode}
                              colorImageUrl={item.product?.orderedColorImageUrl}
                              size="lg"
                            />
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-1">Prix unitaire: {item.unitPrice.toLocaleString()} FCFA</p>
                        <p className="font-medium">Total: {(item.unitPrice * item.quantity).toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-summary-totals mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold text-lg">{selectedOrder.totalAmount.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shipping-address">
                <h3 className="text-lg font-semibold mb-4">Adresse de livraison</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>{selectedOrder.shippingAddress.name || 'Nom non renseigné'}</p>
                  <p>{selectedOrder.shippingAddress.street}</p>
                  {selectedOrder.shippingAddress.apartment && <p>{selectedOrder.shippingAddress.apartment}</p>}
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.region}</p>
                  {selectedOrder.shippingAddress.postalCode && <p>{selectedOrder.shippingAddress.postalCode}</p>}
                  <p>{selectedOrder.shippingAddress.country}</p>
                  {selectedOrder.phoneNumber && <p>Tél: {selectedOrder.phoneNumber}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
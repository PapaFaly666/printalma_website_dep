import React, { useState, useEffect } from 'react';
import { Order, AdminOrderFilters, OrderResponse } from '../../types/order';
import { orderService } from '../../services/orderService';
import { OrderStatusBadge } from '../common/OrderStatusBadge';
import { useAuth } from '../../contexts/AuthContext';

interface OrderListProps {
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: number;
}

export const OrderList = ({ onSelectOrder, selectedOrderId }: OrderListProps) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AdminOrderFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // @ts-ignore - Temporaire pour compatibilité avec l'intégration PayTech
      const response = await orderService.getAllOrders(filters);
      setOrders(response.orders || []);
      setPagination({
        page: response.page || 1,
        limit: (response as any).limit || filters.limit || 10,
        total: response.total || 0,
        totalPages: response.totalPages || 1,
        hasNext: (response.page || 1) < (response.totalPages || 1),
        hasPrevious: (response.page || 1) > 1
      });
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setOrders([]);
      setPagination({});
      alert('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(
        orderId, 
        newStatus as any, 
        `Statut mis à jour vers ${newStatus} par l'admin`
      );

      // Mettre à jour la liste
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));
      
      alert('Statut mis à jour avec succès');
    } catch (error: any) {
      const errorMessage = orderService.handleError(error, 'la mise à jour');
      alert(errorMessage);
    }
  };

  return (
    <div className="admin-orders">
      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email client
            </label>
            <input
              type="email"
              value={filters.userEmail || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                userEmail: e.target.value || undefined, 
                page: 1 
              })}
              placeholder="client@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de commande
            </label>
            <input
              type="text"
              value={filters.orderNumber || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                orderNumber: e.target.value || undefined, 
                page: 1 
              })}
              placeholder="CMD-20250101-0001"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                startDate: e.target.value || undefined, 
                page: 1 
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                endDate: e.target.value || undefined, 
                page: 1 
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
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
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="orders-table overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!orders || orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucune commande trouvée
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedOrderId === order.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onSelectOrder(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.user?.firstName} {order.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.totalAmount?.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="PENDING">En attente</option>
                          <option value="CONFIRMED">Confirmée</option>
                          <option value="PROCESSING">En traitement</option>
                          <option value="SHIPPED">Expédiée</option>
                          <option value="DELIVERED">Livrée</option>
                          <option value="CANCELLED">Annulée</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}à{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}sur{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
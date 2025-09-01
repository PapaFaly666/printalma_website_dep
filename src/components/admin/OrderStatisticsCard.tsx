import { OrderStatistics } from '../../types/order';

interface OrderStatisticsCardProps {
  statistics: OrderStatistics;
  isLoading?: boolean;
}

export const OrderStatisticsCard = ({ statistics, isLoading = false }: OrderStatisticsCardProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Tableau de Bord - Commandes</h2>
      
      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Total Commandes</h3>
          <p className="stat-number text-2xl font-bold text-blue-900">{statistics.totalOrders}</p>
        </div>
        
        <div className="stat-card bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">Chiffre d'Affaires</h3>
          <p className="stat-number text-2xl font-bold text-green-900">
            {statistics.revenue.total.toLocaleString()} FCFA
          </p>
        </div>
        
        <div className="stat-card bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Aujourd'hui</h3>
          <p className="stat-number text-2xl font-bold text-purple-900">{statistics.ordersCount.today}</p>
        </div>
        
        <div className="stat-card bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-800 mb-2">Cette semaine</h3>
          <p className="stat-number text-2xl font-bold text-orange-900">{statistics.ordersCount.week}</p>
        </div>
      </div>

      <div className="status-breakdown">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par statut</h3>
        <div className="status-stats grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-sm text-yellow-800 font-medium">En attente</div>
            <div className="text-xl font-bold text-yellow-900">{statistics.ordersByStatus.pending}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-sm text-blue-800 font-medium">Confirmées</div>
            <div className="text-xl font-bold text-blue-900">{statistics.ordersByStatus.confirmed}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-sm text-purple-800 font-medium">En traitement</div>
            <div className="text-xl font-bold text-purple-900">{statistics.ordersByStatus.processing}</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-center">
            <div className="text-sm text-indigo-800 font-medium">Expédiées</div>
            <div className="text-xl font-bold text-indigo-900">{statistics.ordersByStatus.shipped}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-800 font-medium">Livrées</div>
            <div className="text-xl font-bold text-green-900">{statistics.ordersByStatus.delivered}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-sm text-red-800 font-medium">Annulées</div>
            <div className="text-xl font-bold text-red-900">{statistics.ordersByStatus.cancelled}</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
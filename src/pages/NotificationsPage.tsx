import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { BackendNotification } from '../services/notificationService';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    refresh 
  } = useNotifications();
  const navigate = useNavigate();

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (type: BackendNotification['type']): string => {
    const icons = {
      'order_new': '🆕',
      'order_updated': '📝',
      'system': '⚙️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type] || '📢';
  };

  const getTypeColor = (type: BackendNotification['type']): string => {
    const colors = {
      'order_new': 'bg-emerald-500',
      'order_updated': 'bg-blue-500',
      'system': 'bg-purple-500',
      'success': 'bg-green-500',
      'warning': 'bg-amber-500',
      'error': 'bg-red-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount || 0) + ' FCFA';
  };

  const handleNotificationClick = async (notification: BackendNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigation automatique vers la commande
    if (notification.metadata?.orderId) {
      navigate(`/admin/orders`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle notification'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Non lues</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.isRead).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            Chargement des notifications...
          </div>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-500 text-center">
              Vous n'avez aucune notification pour le moment.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`
                cursor-pointer transition-all duration-200 hover:shadow-md
                ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Icône */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl
                    ${getTypeColor(notification.type)}
                  `}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`
                        text-lg font-medium leading-6
                        ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}
                      `}>
                        {notification.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 leading-6">
                      {notification.message}
                    </p>

                    {/* Métadonnées */}
                    {notification.metadata && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {notification.metadata.orderNumber && (
                            <div>
                              <span className="font-medium text-gray-700">Commande: </span>
                              <span className="text-gray-600">{notification.metadata.orderNumber}</span>
                            </div>
                          )}
                          {notification.metadata.customer && (
                            <div>
                              <span className="font-medium text-gray-700">Client: </span>
                              <span className="text-gray-600">{notification.metadata.customer}</span>
                            </div>
                          )}
                          {notification.metadata.amount && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Montant: </span>
                              <span className="font-semibold text-emerald-600">
                                {formatAmount(notification.metadata.amount)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Marquer comme lu
                        </Button>
                      )}

                      {notification.metadata?.orderId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders`);
                          }}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Voir commande
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 
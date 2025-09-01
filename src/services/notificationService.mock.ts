// Service mock pour tester les notifications sans backend
import { BackendNotification } from './notificationService';

// Mock data avec la nouvelle structure API
const mockNotifications: BackendNotification[] = [
  {
    id: 1,
    userId: 1,
    type: 'ORDER_NEW',
    title: 'Nouvelle commande reçue',
    message: 'Jean Dupont a passé une commande de 2 articles : T-shirt Design Unique, Hoodie Premium',
    isRead: false,
    metadata: {
      orderId: 123,
      orderNumber: 'CMD20241127001',
      amount: 89.99,
      customer: 'Jean Dupont',
      itemsCount: 2
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    user: {
      id: 2,
      firstName: 'Admin',
      lastName: 'Principal'
    }
  },
  {
    id: 2,
    userId: 1,
    type: 'ORDER_UPDATED',
    title: 'Commande mise à jour',
    message: 'Statut de la commande CMD20241127002 modifié de "En attente" vers "Confirmée"',
    isRead: true,
    metadata: {
      orderId: 124,
      orderNumber: 'CMD20241127002',
      amount: 45.50,
      customer: 'Marie Martin',
      oldStatus: 'PENDING',
      newStatus: 'CONFIRMED'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    user: {
      id: 2,
      firstName: 'Admin',
      lastName: 'Principal'
    }
  },
  {
    id: 3,
    userId: 1,
    type: 'SUCCESS',
    title: 'Paiement confirmé',
    message: 'Le paiement de 125.00 FCFA a été traité avec succès',
    isRead: false,
    metadata: {
      orderId: 125,
      orderNumber: 'CMD20241127003',
      amount: 125.00,
      customer: 'Pierre Martin'
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    expiresAt: null,
    user: {
      id: 2,
      firstName: 'Admin',
      lastName: 'Principal'
    }
  }
];

class MockNotificationService {
  /**
   * Récupérer toutes les notifications (mock)
   */
  async getNotifications(limit = 50, includeRead = true): Promise<{
    notifications: BackendNotification[];
    unreadCount: number;
    metadata: any;
  }> {
    console.log('🎭 Mock Service: getNotifications appelé', { limit, includeRead });
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredNotifications = mockNotifications;
    
    if (!includeRead) {
      filteredNotifications = mockNotifications.filter(n => !n.isRead);
    }
    
    const limitedNotifications = filteredNotifications.slice(0, limit);
    const unreadCount = mockNotifications.filter(n => !n.isRead).length;
    
    return {
      notifications: limitedNotifications,
      unreadCount,
      metadata: {
        limit,
        includeRead,
        total: filteredNotifications.length
      }
    };
  }

  /**
   * Obtenir le nombre de notifications non lues (mock)
   */
  async getUnreadCount(): Promise<number> {
    console.log('🎭 Mock Service: getUnreadCount appelé');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const unreadCount = mockNotifications.filter(n => !n.isRead).length;
    return unreadCount;
  }

  /**
   * Marquer une notification comme lue (mock)
   */
  async markAsRead(notificationId: number): Promise<boolean> {
    console.log('🎭 Mock Service: markAsRead appelé', { notificationId });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
      return true;
    }
    
    return false;
  }

  /**
   * Marquer toutes les notifications comme lues (mock)
   */
  async markAllAsRead(): Promise<{ success: boolean; updatedCount?: number }> {
    console.log('🎭 Mock Service: markAllAsRead appelé');
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const unreadNotifications = mockNotifications.filter(n => !n.isRead);
    
    unreadNotifications.forEach(notification => {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
    });
    
    return {
      success: true,
      updatedCount: unreadNotifications.length
    };
  }

  /**
   * Supprimer une notification (mock)
   */
  async deleteNotification(notificationId: number): Promise<boolean> {
    console.log('🎭 Mock Service: deleteNotification appelé', { notificationId });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      mockNotifications.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Nettoyage admin (mock)
   */
  async cleanExpiredNotifications(): Promise<{ success: boolean; deletedCount?: number }> {
    console.log('🎭 Mock Service: cleanExpiredNotifications appelé');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simuler la suppression de quelques notifications expirées
    return {
      success: true,
      deletedCount: 2
    };
  }

  /**
   * Ajouter une notification mock pour les tests
   */
  addMockNotification(notification: Partial<BackendNotification>): void {
    const newNotification: BackendNotification = {
      id: Date.now(),
      userId: 1,
      type: 'SYSTEM',
      title: 'Notification Test',
      message: 'Ceci est une notification de test',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      ...notification
    };
    
    mockNotifications.unshift(newNotification);
    console.log('🎭 Mock notification ajoutée:', newNotification);
  }

  /**
   * Simuler une nouvelle commande
   */
  simulateNewOrder(): void {
    this.addMockNotification({
      type: 'ORDER_NEW',
      title: 'Nouvelle commande reçue',
      message: `Client Test a passé une commande de ${Math.floor(Math.random() * 5) + 1} articles`,
      metadata: {
        orderId: Date.now(),
        orderNumber: `CMD${Date.now()}`,
        amount: Math.floor(Math.random() * 200) + 50,
        customer: 'Client Test',
        itemsCount: Math.floor(Math.random() * 5) + 1
      }
    });
  }
}

// Singleton pour usage global
const mockNotificationService = new MockNotificationService();

// Ajouter quelques méthodes utilitaires au service mock
(mockNotificationService as any).simulateNewOrderEvery = (seconds: number) => {
  setInterval(() => {
    mockNotificationService.simulateNewOrder();
  }, seconds * 1000);
};

export default mockNotificationService; 
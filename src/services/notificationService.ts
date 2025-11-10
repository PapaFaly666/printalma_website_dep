// Service pour gérer les notifications côté frontend avec l'API backend
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Fonction pour obtenir le token d'authentification JWT depuis les cookies
const getAuthToken = () => {
  // Essayer d'abord le localStorage (fallback), puis chercher dans les cookies
  const token = localStorage.getItem('auth_token') ||
                sessionStorage.getItem('auth_token') ||
                getCookie('auth_token');
  console.log('🔑 [notificationService] Token recherché:', !!token);
  return token;
};

// Fonction pour extraire un cookie spécifique
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

// Interface pour les notifications backend selon la nouvelle API
export interface BackendNotification {
  id: number;
  userId: number;
  type: 'ORDER_NEW' | 'ORDER_UPDATED' | 'SYSTEM' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    orderId?: number;
    orderNumber?: string;
    amount?: number;
    customer?: string;
    itemsCount?: number;
    oldStatus?: string;
    newStatus?: string;
    action?: string;
    resourceId?: number;
    details?: string;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

// Interface pour la réponse API selon la nouvelle documentation
interface NotificationsResponse {
  success: boolean;
  data: BackendNotification[];
  unreadCount: number;
  metadata: {
    limit: number;
    includeRead: boolean;
    total: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
  deletedCount?: number;
  error?: string;
  statusCode?: number;
}

class NotificationService {
  // Base URL selon la nouvelle documentation - utilise la configuration centralisée
  private baseUrl = `${API_CONFIG.BASE_URL}/notifications`;

  // Configuration Axios avec token JWT + cookies pour compatibilité
  private getRequestConfig() {
    const token = getAuthToken();

    const config: any = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true // ⭐ Important pour envoyer les cookies HttpOnly
    };

    // Ajouter le header Authorization si un token est disponible (backup)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 [notificationService] Authorization header ajouté');
    } else {
      console.warn('⚠️ [notificationService] Aucun token JWT trouvé - utilisation des cookies uniquement');
    }

    console.log('🔧 [notificationService] Config requête:', {
      url: this.baseUrl,
      withCredentials: config.withCredentials,
      hasAuthHeader: !!config.headers.Authorization
    });

    return config;
  }

  /**
   * Récupérer toutes les notifications de l'utilisateur connecté
   * @param limit Nombre maximum de notifications (défaut: 50)
   * @param includeRead Inclure les notifications lues (défaut: true)
   */
  async getNotifications(limit = 50, includeRead = true): Promise<{
    notifications: BackendNotification[];
    unreadCount: number;
    metadata: any;
  }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        includeRead: includeRead.toString()
      });
      
      const response = await axios.get<NotificationsResponse>(
        `${this.baseUrl}?${params}`, 
        this.getRequestConfig()
      );
      
      if (!response.data.success) {
        throw new Error('API returned success: false');
      }
      
      return {
        notifications: response.data.data,
        unreadCount: response.data.unreadCount,
        metadata: response.data.metadata
      };
    } catch (error: any) {
      console.error('Erreur lors du chargement des notifications:', error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        console.warn('Non authentifié - redirection vers login');
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.warn('Accès refusé - droits insuffisants');
      }
      
      throw error;
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get<UnreadCountResponse>(
        `${this.baseUrl}/unread-count`, 
        this.getRequestConfig()
      );
      
      if (!response.data.success) {
        throw new Error('API returned success: false');
      }
      
      return response.data.unreadCount || 0;
    } catch (error: any) {
      console.error('Erreur lors du comptage des non lues:', error);
      
      if (error.response?.status === 401) {
        console.warn('Non authentifié pour compter les notifications');
      }
      
      return 0; // Retourner 0 en cas d'erreur pour éviter les crashes
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse>(
        `${this.baseUrl}/${notificationId}/mark-read`, 
        {},
        this.getRequestConfig()
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec du marquage comme lu');
      }
      
      return true;
    } catch (error: any) {
      console.error('Erreur lors du marquage comme lu:', error);
      
      if (error.response?.status === 404) {
        console.warn('Notification non trouvée:', notificationId);
      }
      
      return false;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<{ success: boolean; updatedCount?: number }> {
    try {
      const response = await axios.post<ApiResponse>(
        `${this.baseUrl}/mark-all-read`, 
        {},
        this.getRequestConfig()
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec du marquage global');
      }
      
      return {
        success: true,
        updatedCount: response.data.updatedCount
      };
    } catch (error: any) {
      console.error('Erreur lors du marquage global:', error);
      return { success: false };
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const response = await axios.delete<ApiResponse>(
        `${this.baseUrl}/${notificationId}`, 
        this.getRequestConfig()
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec de la suppression');
      }
      
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      
      if (error.response?.status === 404) {
        console.warn('Notification non trouvée pour suppression:', notificationId);
      }
      
      return false;
    }
  }

  /**
   * Nettoyage admin des notifications expirées (ADMIN/SUPERADMIN uniquement)
   */
  async cleanExpiredNotifications(): Promise<{ success: boolean; deletedCount?: number }> {
    try {
      const response = await axios.post<ApiResponse>(
        `${this.baseUrl}/admin/clean-expired`, 
        {},
        this.getRequestConfig()
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec du nettoyage');
      }
      
      return {
        success: true,
        deletedCount: response.data.deletedCount
      };
    } catch (error: any) {
      console.error('Erreur lors du nettoyage admin:', error);
      
      if (error.response?.status === 403) {
        console.warn('Droits admin requis pour le nettoyage');
      }
      
      return { success: false };
    }
  }

  /**
   * Convertir une notification backend vers le format frontend
   */
  convertToFrontendFormat(backendNotification: BackendNotification) {
    return {
      id: backendNotification.id.toString(),
      type: backendNotification.type,
      title: backendNotification.title,
      message: backendNotification.message,
      timestamp: new Date(backendNotification.createdAt),
      read: backendNotification.isRead,
      metadata: backendNotification.metadata,
      action: backendNotification.metadata?.orderId ? {
        label: 'Voir détails',
        onClick: () => {
          // Cette fonction sera définie lors de l'utilisation
          console.log('Action sur notification:', backendNotification.metadata?.orderId);
        }
      } : undefined
    };
  }

  /**
   * Formatage de la devise (utilitaire)
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount || 0) + ' FCFA';
  }

  /**
   * Obtenir l'icône selon le type de notification
   */
  getNotificationIcon(type: BackendNotification['type']): string {
    const icons = {
      'ORDER_NEW': '🛒',
      'ORDER_UPDATED': '📝',
      'SYSTEM': '⚡',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌'
    };
    return icons[type] || '📢';
  }

  /**
   * Obtenir la couleur selon le type de notification
   */
  getNotificationColor(type: BackendNotification['type']): string {
    const colors = {
      'ORDER_NEW': 'emerald',
      'ORDER_UPDATED': 'blue',
      'SYSTEM': 'purple',
      'SUCCESS': 'green',
      'WARNING': 'amber',
      'ERROR': 'red'
    };
    return colors[type] || 'slate';
  }

  /**
   * Vérifier si une notification est récente (moins de 5 minutes)
   */
  isRecent(notification: BackendNotification): boolean {
    const notificationTime = new Date(notification.createdAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - notificationTime) / (1000 * 60);
    return diffMinutes < 5;
  }

  /**
   * Vérifier si une notification est expirée
   */
  isExpired(notification: BackendNotification): boolean {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  }

  /**
   * Formater le temps relatif (ex: "il y a 5 minutes")
   */
  getRelativeTime(notification: BackendNotification): string {
    const now = new Date();
    const notificationTime = new Date(notification.createdAt);
    const diffMs = now.getTime() - notificationTime.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return notificationTime.toLocaleDateString('fr-FR');
  }

  /**
   * Polling pour vérifier les nouvelles notifications
   */
  startPolling(callback: (count: number) => void, intervalMs = 30000): () => void {
    const interval = setInterval(async () => {
      try {
        const count = await this.getUnreadCount();
        callback(count);
      } catch (error) {
        console.error('Erreur lors du polling des notifications:', error);
      }
    }, intervalMs);

    // Retourner une fonction pour arrêter le polling
    return () => clearInterval(interval);
  }
}

// Singleton pour utilisation globale
const notificationService = new NotificationService();
export default notificationService; 
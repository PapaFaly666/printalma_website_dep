import { io } from 'socket.io-client';

class AnalyticsService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.socket = null;
    this.listeners = {};
  }

  // ==========================================
  // GESTION DU CACHE
  // ==========================================

  getCacheKey(endpoint, params = {}) {
    return `${endpoint}-${JSON.stringify(params)}`;
  }

  getCachedData(cacheKey) {
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }
    return null;
  }

  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    console.log('📊 Cache analytics vidé');
  }

  // ==========================================
  // MÉTHODES API
  // ==========================================

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 401:
          throw new Error('Session expirée - Veuillez vous reconnecter');
        case 403:
          throw new Error('Accès refusé - Droits administrateur requis');
        case 404:
          throw new Error('Endpoint statistiques non trouvé');
        case 500:
          throw new Error('Erreur serveur lors du calcul des statistiques');
        default:
          throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    }
    
    const result = await response.json();
    return result.data || result;
  }

  async apiCall(endpoint, options = {}) {
    try {
      console.log(`📊 Analytics API Call: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include', // ⭐ ESSENTIEL pour l'auth admin
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await this.handleResponse(response);
      console.log(`✅ Analytics Success: ${endpoint}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Analytics Error ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // 1. STATISTIQUES GÉNÉRALES (Dashboard Principal)
  // ==========================================

  /**
   * Récupérer les statistiques générales du dashboard
   * GET /orders/admin/statistics
   */
  async getStatistics(period = '30d', options = {}) {
    const params = { period, ...options };
    const cacheKey = this.getCacheKey('stats', params);
    
    // Vérifier le cache
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('📊 Stats récupérées du cache');
      return cached;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const data = await this.apiCall(`/orders/admin/statistics?${searchParams}`);
    
    // Mettre en cache
    this.setCachedData(cacheKey, data);
    
    return data;
  }

  // ==========================================
  // 2. STATISTIQUES DE REVENUS DÉTAILLÉES
  // ==========================================

  /**
   * Récupérer les statistiques de revenus détaillées
   * GET /orders/admin/revenue-stats
   */
  async getRevenueStats(options = {}) {
    const cacheKey = this.getCacheKey('revenue-stats', options);
    
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('💰 Stats revenus récupérées du cache');
      return cached;
    }

    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const data = await this.apiCall(`/orders/admin/revenue-stats?${params}`);
    
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ==========================================
  // 3. STATISTIQUES CLIENTS
  // ==========================================

  /**
   * Récupérer les statistiques clients
   * GET /orders/admin/customer-stats
   */
  async getCustomerStats(options = {}) {
    const cacheKey = this.getCacheKey('customer-stats', options);
    
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('👥 Stats clients récupérées du cache');
      return cached;
    }

    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const data = await this.apiCall(`/orders/admin/customer-stats?${params}`);
    
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ==========================================
  // 4. STATISTIQUES PRODUITS
  // ==========================================

  /**
   * Récupérer les statistiques produits
   * GET /orders/admin/product-stats
   */
  async getProductStats(options = {}) {
    const cacheKey = this.getCacheKey('product-stats', options);
    
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('📦 Stats produits récupérées du cache');
      return cached;
    }

    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const data = await this.apiCall(`/orders/admin/product-stats?${params}`);
    
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ==========================================
  // 5. RAPPORTS PERSONNALISÉS
  // ==========================================

  /**
   * Générer un rapport personnalisé
   * POST /orders/admin/custom-report
   */
  async generateCustomReport(config) {
    console.log('📋 Génération rapport personnalisé:', config);
    
    const data = await this.apiCall('/orders/admin/custom-report', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    return data;
  }

  /**
   * Télécharger un rapport généré
   */
  async downloadReport(reportId, format = 'pdf') {
    const response = await fetch(`${this.baseURL}/downloads/reports/${reportId}.${format}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur téléchargement rapport: ${response.status}`);
    }

    return response.blob();
  }

  // ==========================================
  // 6. TEMPS RÉEL (WebSocket)
  // ==========================================

  /**
   * Connecter le WebSocket pour les statistiques temps réel
   */
  connectRealTime() {
    if (this.socket && this.socket.connected) {
      console.log('📊 WebSocket analytics déjà connecté');
      return this.socket;
    }

    console.log('🔌 Connexion WebSocket analytics...');
    
    this.socket = io(`${this.baseURL}/analytics`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupRealtimeListeners();
    return this.socket;
  }

  setupRealtimeListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket analytics connecté');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket analytics déconnecté');
    });

    // Nouvelles commandes en temps réel
    this.socket.on('orderCreated', (data) => {
      console.log('🆕 Nouvelle commande temps réel:', data);
      this.clearCache(); // Invalider le cache
      if (this.listeners.onNewOrder) {
        this.listeners.onNewOrder(data);
      }
    });

    // Mise à jour des revenus
    this.socket.on('revenueUpdate', (data) => {
      console.log('💰 Revenus mis à jour temps réel:', data);
      if (this.listeners.onRevenueUpdate) {
        this.listeners.onRevenueUpdate(data);
      }
    });

    // Visiteurs en ligne
    this.socket.on('visitorsUpdate', (data) => {
      console.log('👥 Visiteurs mis à jour:', data);
      if (this.listeners.onVisitorsUpdate) {
        this.listeners.onVisitorsUpdate(data);
      }
    });

    // Changement de statut commande
    this.socket.on('orderStatusChanged', (data) => {
      console.log('📝 Statut commande changé:', data);
      this.clearCache(); // Invalider le cache
      if (this.listeners.onOrderStatusChanged) {
        this.listeners.onOrderStatusChanged(data);
      }
    });
  }

  /**
   * Enregistrer des callbacks pour les événements temps réel
   */
  onNewOrder(callback) {
    this.listeners.onNewOrder = callback;
  }

  onRevenueUpdate(callback) {
    this.listeners.onRevenueUpdate = callback;
  }

  onVisitorsUpdate(callback) {
    this.listeners.onVisitorsUpdate = callback;
  }

  onOrderStatusChanged(callback) {
    this.listeners.onOrderStatusChanged = callback;
  }

  /**
   * Déconnecter le WebSocket
   */
  disconnectRealTime() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket analytics déconnecté');
    }
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Formater les montants en euros
   */
  formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  }

  /**
   * Formater les nombres avec séparateurs
   */
  formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number || 0);
  }

  /**
   * Formater les dates
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
  }

  /**
   * Calculer le pourcentage de changement
   */
  calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Obtenir l'icône de tendance
   */
  getTrendIcon(growthRate) {
    if (growthRate > 0) return '📈';
    if (growthRate < 0) return '📉';
    return '➡️';
  }

  /**
   * Obtenir la classe CSS de tendance
   */
  getTrendClass(growthRate) {
    if (growthRate > 0) return 'positive';
    if (growthRate < 0) return 'negative';
    return 'neutral';
  }

  // ==========================================
  // TESTS ET DEBUG
  // ==========================================

  /**
   * Tester la connectivité aux statistiques
   */
  async testConnection() {
    try {
      const stats = await this.getStatistics('7d');
      console.log('✅ Test analytics réussi:', stats);
      return true;
    } catch (error) {
      console.error('❌ Test analytics échoué:', error);
      return false;
    }
  }

  /**
   * Obtenir des informations de debug
   */
  getDebugInfo() {
    return {
      baseURL: this.baseURL,
      cacheSize: this.cache.size,
      socketConnected: this.socket?.connected || false,
      listeners: Object.keys(this.listeners)
    };
  }
}

// Export du service singleton
export const analyticsService = new AnalyticsService();
export default analyticsService; 
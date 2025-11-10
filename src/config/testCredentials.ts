/**
 * Configuration des identifiants de test pour PrintAlma
 * Basé sur la documentation de test complète
 */

export const TEST_CREDENTIALS = {
  // Identifiants valides selon la documentation
  VALID_ADMIN: {
    email: 'testadmin@printalma.com',
    password: 'password123',
    role: 'SUPERADMIN',
    description: 'Admin super utilisateur pour tests complets'
  },

  // Autres identifiants de test (à créer si nécessaire)
  TEST_VENDOR: {
    email: 'vendor@test.com',
    password: 'password123',
    role: 'VENDEUR',
    description: 'Vendeur de test'
  },

  TEST_CUSTOMER: {
    email: 'customer@test.com',
    password: 'password123',
    role: 'CLIENT',
    description: 'Client de test'
  }
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/auth/profile'
};

export const TEST_CONFIG = {
  // URL de base de l'API selon la documentation
  BASE_URL: 'http://localhost:3004',

  // Configuration pour les requêtes de test
  REQUEST_CONFIG: {
    credentials: 'include' as const,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  // Délais d'attente pour les tests
  TIMEOUTS: {
    LOGIN: 5000,
    NOTIFICATIONS: 3000,
    POLLING: 30000
  }
};

/**
 * Fonctions utilitaires pour les tests
 */
export const TestHelpers = {
  /**
   * Effectuer une requête de login de test
   */
  async testLogin(credentials = TEST_CREDENTIALS.VALID_ADMIN) {
    console.log('🧪 [TestHelpers] Test login avec:', credentials.email);

    try {
      const response = await fetch(`${TEST_CONFIG.BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        ...TEST_CONFIG.REQUEST_CONFIG,
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data = await response.json();
      console.log('📡 [TestHelpers] Réponse login:', {
        status: response.status,
        success: response.ok,
        data
      });

      return {
        success: response.ok,
        status: response.status,
        data,
        credentials
      };
    } catch (error) {
      console.error('❌ [TestHelpers] Erreur login:', error);
      return {
        success: false,
        error: error.message,
        credentials
      };
    }
  },

  /**
   * Tester l'accès aux notifications
   */
  async testNotifications() {
    console.log('🧪 [TestHelpers] Test notifications');

    try {
      const response = await fetch(`${TEST_CONFIG.BASE_URL}${API_ENDPOINTS.NOTIFICATIONS}?limit=10&includeRead=true`, {
        method: 'GET',
        ...TEST_CONFIG.REQUEST_CONFIG
      });

      const data = await response.json();
      console.log('📡 [TestHelpers] Réponse notifications:', {
        status: response.status,
        success: response.ok,
        data
      });

      return {
        success: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      console.error('❌ [TestHelpers] Erreur notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Vérifier les cookies dans le navigateur
   */
  checkCookies() {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    console.log('🍪 [TestHelpers] Cookies actuels:', cookies);
    return cookies;
  },

  /**
   * Suite de test complète
   */
  async runFullTestSuite() {
    console.log('🚀 [TestHelpers] Lancement suite de tests complète');

    const results = {
      login: await this.testLogin(),
      cookies: this.checkCookies(),
      notifications: await this.testNotifications()
    };

    console.log('📊 [TestHelpers] Résultats complets:', results);
    return results;
  }
};

export default TestHelpers;
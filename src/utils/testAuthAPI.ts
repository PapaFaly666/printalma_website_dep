/**
 * Utilitaire de test pour l'API d'authentification et notifications
 * Basé sur la documentation complète fournie
 */

import { TEST_CREDENTIALS, TestHelpers } from '../config/testCredentials';

export class AuthAPITester {
  private baseUrl = 'http://localhost:3004';

  /**
   * Test complet de l'API selon la documentation
   */
  async runCompleteAPITest() {
    console.log('🚀 Lancement du test complet API PrintAlma...');

    const results = {
      login: await this.testLoginEndpoint(),
      notifications: await this.testNotificationsEndpoint(),
      cookies: this.checkCookies(),
      summary: {
        success: true,
        timestamp: new Date().toISOString(),
        testsRun: 3
      }
    };

    // Calculer le succès global
    results.summary.success = results.login.success && results.notifications.success;

    console.log('📊 Résultats du test API:', results);
    return results;
  }

  /**
   * Test du endpoint de login
   */
  private async testLoginEndpoint() {
    console.log('🧪 Test endpoint /auth/login...');

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: TEST_CREDENTIALS.VALID_ADMIN.email,
          password: TEST_CREDENTIALS.VALID_ADMIN.password
        })
      });

      const data = await response.json();

      const result = {
        success: response.ok,
        status: response.status,
        data,
        hasUser: !!data.user,
        userRole: data.user?.role,
        userEmail: data.user?.email
      };

      console.log('✅ Login test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Login test failed:', error);
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  /**
   * Test du endpoint des notifications
   */
  private async testNotificationsEndpoint() {
    console.log('🧪 Test endpoint /notifications...');

    try {
      const response = await fetch(`${this.baseUrl}/notifications?limit=10&includeRead=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include' // Important: envoyer les cookies HttpOnly
      });

      const data = await response.json();

      const result = {
        success: response.ok,
        status: response.status,
        data,
        hasNotifications: Array.isArray(data.data),
        notificationCount: data.data?.length || 0,
        unreadCount: data.unreadCount || 0,
        successField: data.success
      };

      console.log('✅ Notifications test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Notifications test failed:', error);
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  /**
   * Vérification des cookies
   */
  private checkCookies() {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const result = {
      hasCookies: Object.keys(cookies).length > 0,
      hasAuthToken: !!cookies.auth_token,
      cookies
    };

    console.log('🍪 Cookies check result:', result);
    return result;
  }

  /**
   * Test depuis la console du navigateur
   */
  static async runInBrowser() {
    console.log('🌐 Lancement du test depuis le navigateur...');

    const tester = new AuthAPITester();
    const results = await tester.runCompleteAPITest();

    // Afficher un résumé dans la console
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    📊 RÉSULTATS DU TEST                       ║
╠══════════════════════════════════════════════════════════════╣
║ Login: ${results.login.success ? '✅ SUCCÈS' : '❌ ÉCHEC'} (${results.login.status})
║ Notifications: ${results.notifications.success ? '✅ SUCCÈS' : '❌ ÉCHEC'} (${results.notifications.status})
║ Cookies: ${results.cookies.hasAuthToken ? '✅ PRÉSENTS' : '❌ ABSENTS'}
║ Global: ${results.summary.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}
╚══════════════════════════════════════════════════════════════╝

${results.notifications && 'data' in results.notifications && results.notifications.data && 'data' in results.notifications.data && results.notifications.data.data?.[0] ? `Dernière notification: ${results.notifications.data.data[0].title}` : 'Aucune notification'}
    `);

    return results;
  }
}

// Export pour utilisation globale
(window as any).AuthAPITester = AuthAPITester;
(window as any).runAuthTest = () => AuthAPITester.runInBrowser();

export default AuthAPITester;
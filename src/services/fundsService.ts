import { API_CONFIG } from '../config/api';
import { 
  VendorBalance, 
  WithdrawalRequest, 
  WithdrawalRequestCreate,
  PaymentMethod 
} from '../types/funds';

class FundsService {
  private getAuthHeader() {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * 💰 VENDEUR - Obtenir son solde et ses gains
   */
  async getMyBalance(): Promise<VendorBalance> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/balance`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur getMyBalance:', error);
      // Retourner des données par défaut en cas d'erreur
      return {
        id: 1,
        vendorId: 1,
        totalEarnings: 0,
        availableBalance: 0,
        pendingWithdrawals: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 📝 VENDEUR - Créer une demande de retrait
   */
  async createWithdrawalRequest(request: WithdrawalRequestCreate): Promise<WithdrawalRequest> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/withdrawal-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeader(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur createWithdrawalRequest:', error);
      throw error;
    }
  }

  /**
   * 📋 VENDEUR - Obtenir ses demandes de retrait
   */
  async getMyWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/withdrawal-requests`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur getMyWithdrawalRequests:', error);
      return [];
    }
  }

  /**
   * ❌ VENDEUR - Annuler une demande de retrait
   */
  async cancelWithdrawalRequest(requestId: number): Promise<WithdrawalRequest> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/withdrawal-requests/${requestId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur cancelWithdrawalRequest:', error);
      throw error;
    }
  }

  /**
   * 🔧 ADMIN - Obtenir toutes les demandes de retrait
   */
  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/withdrawal-requests`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur getAllWithdrawalRequests:', error);
      return [];
    }
  }

  /**
   * ✅ ADMIN - Approuver une demande de retrait
   */
  async approveWithdrawalRequest(requestId: number, notes?: string): Promise<WithdrawalRequest> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/withdrawal-requests/${requestId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur approveWithdrawalRequest:', error);
      throw error;
    }
  }

  /**
   * ❌ ADMIN - Rejeter une demande de retrait
   */
  async rejectWithdrawalRequest(requestId: number, notes: string): Promise<WithdrawalRequest> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/withdrawal-requests/${requestId}/reject`, {
        method: 'PATCH',
        credentials: 'include',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Erreur rejectWithdrawalRequest:', error);
      throw error;
    }
  }

  /**
   * 💰 Utilitaire - Formater les montants en FCFA
   */
  formatCFA(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * 📱 Utilitaire - Valider un numéro de téléphone sénégalais
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Format acceptés: +221XXXXXXXX, 221XXXXXXXX, 77XXXXXXX, 78XXXXXXX, 70XXXXXXX, 76XXXXXXX
    const phoneRegex = /^(\+?221)?(7[0-8])\d{7}$/;
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  /**
   * 🏦 Utilitaire - Valider un IBAN
   */
  validateIBAN(iban: string): boolean {
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z\d]{4}\d{7}([A-Z\d]?){0,16}$/;
    const cleanIban = iban.replace(/[\s-]/g, '').toUpperCase();
    return ibanRegex.test(cleanIban);
  }

  /**
   * 🔍 Utilitaire - Obtenir les informations d'une méthode de paiement
   */
  getPaymentMethodInfo(method: PaymentMethod) {
    const methods = {
      WAVE: {
        name: 'Wave',
        icon: '📱',
        color: 'text-blue-600 bg-blue-50',
        description: 'Transfert mobile Wave'
      },
      ORANGE_MONEY: {
        name: 'Orange Money',
        icon: '🟠',
        color: 'text-orange-600 bg-orange-50',
        description: 'Transfert mobile Orange Money'
      },
      BANK_TRANSFER: {
        name: 'Virement bancaire',
        icon: '🏦',
        color: 'text-gray-600 bg-gray-50',
        description: 'Virement IBAN'
      }
    };
    return methods[method];
  }
}

export const fundsService = new FundsService();
export default fundsService;
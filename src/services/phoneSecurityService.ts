/**
 * Service de gestion de la sécurité des numéros de téléphone
 * Phase 1: OTP + Email + Période de sécurité 48h
 */

import { API_CONFIG } from '../config/api';

export interface PhoneNumberWithSecurity {
  id: number;
  number: string;
  countryCode: string;
  isPrimary: boolean;

  // Sécurité
  isVerified: boolean;
  verifiedAt?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  securityHoldUntil?: string; // Date jusqu'à laquelle le numéro est en période de sécurité

  // Métadonnées
  addedAt: string;
  canBeUsedForWithdrawal: boolean;
}

export interface OTPResponse {
  success: boolean;
  otpId: string;
  expiresAt: number;
  message: string;
}

export interface OTPVerificationResponse {
  success: boolean;
  phoneNumber: PhoneNumberWithSecurity;
  message: string;
}

class PhoneSecurityService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Envoie un code OTP au numéro de téléphone
   */
  async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vendor/phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi du code OTP');
      }

      return data;
    } catch (error: any) {
      console.error('Erreur sendOTP:', error);
      throw error;
    }
  }

  /**
   * Vérifie le code OTP
   */
  async verifyOTP(otpId: string, code: string): Promise<OTPVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vendor/phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ otpId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Code invalide');
      }

      return data;
    } catch (error: any) {
      console.error('Erreur verifyOTP:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les numéros avec leur statut de sécurité
   */
  async getPhoneNumbersWithSecurity(): Promise<PhoneNumberWithSecurity[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vendor/phone/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des numéros');
      }

      return data.phoneNumbers || [];
    } catch (error: any) {
      console.error('Erreur getPhoneNumbersWithSecurity:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un numéro peut être utilisé pour un retrait
   */
  canUseForWithdrawal(phone: PhoneNumberWithSecurity): {
    canUse: boolean;
    reason?: string;
    remainingTime?: number;
  } {
    // Vérifier que le numéro est vérifié
    if (!phone.isVerified) {
      return {
        canUse: false,
        reason: 'Le numéro n\'est pas encore vérifié',
      };
    }

    // Vérifier le statut
    if (phone.status !== 'ACTIVE') {
      return {
        canUse: false,
        reason: `Le numéro est en statut ${phone.status}`,
      };
    }

    // Vérifier la période de sécurité
    if (phone.securityHoldUntil) {
      const holdUntil = new Date(phone.securityHoldUntil);
      const now = new Date();

      if (holdUntil > now) {
        const remainingMs = holdUntil.getTime() - now.getTime();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

        return {
          canUse: false,
          reason: 'Numéro en période de sécurité',
          remainingTime: remainingHours,
        };
      }
    }

    return { canUse: true };
  }

  /**
   * Formate le temps restant en format lisible
   */
  formatRemainingTime(hours: number): string {
    if (hours < 1) {
      return 'Moins d\'une heure';
    }
    if (hours < 24) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    const days = Math.ceil(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  /**
   * Vérifie si un numéro Sénégalais est valide
   */
  isValidSenegalPhone(phoneNumber: string): boolean {
    // Format: +221 XX XXX XX XX ou 77/78/70/76 XXX XX XX
    const cleanNumber = phoneNumber.replace(/\s/g, '');

    // Avec code pays
    if (cleanNumber.startsWith('+221')) {
      const number = cleanNumber.substring(4);
      return /^(77|78|70|76)\d{7}$/.test(number);
    }

    // Sans code pays
    return /^(77|78|70|76)\d{7}$/.test(cleanNumber);
  }

  /**
   * Formate un numéro de téléphone sénégalais
   */
  formatSenegalPhone(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\s/g, '').replace('+221', '');

    if (cleanNumber.length === 9) {
      return `+221 ${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 5)} ${cleanNumber.substring(5, 7)} ${cleanNumber.substring(7, 9)}`;
    }

    return phoneNumber;
  }
}

export const phoneSecurityService = new PhoneSecurityService();
export default phoneSecurityService;

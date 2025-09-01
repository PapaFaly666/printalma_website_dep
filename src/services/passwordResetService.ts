import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import type { 
  ForgotPasswordRequest, 
  ForgotPasswordResponse,
  VerifyResetTokenRequest,
  VerifyResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CleanupResetTokensResponse
} from '../types/auth';

class PasswordResetService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include', // ⭐ OBLIGATOIRE - cookies httpOnly automatiques
      headers: {
        ...API_CONFIG.HEADERS,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Erreur de communication avec le serveur'
      }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }

    return response.json();
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return this.request<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email } as ForgotPasswordRequest)
    });
  }

  /**
   * Vérifier la validité d'un token de réinitialisation
   */
  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
    return this.request<VerifyResetTokenResponse>(API_ENDPOINTS.AUTH.VERIFY_RESET_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ token } as VerifyResetTokenRequest)
    });
  }

  /**
   * Réinitialiser le mot de passe avec un token valide
   */
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ 
        token, 
        newPassword, 
        confirmPassword 
      } as ResetPasswordRequest)
    });
  }

  /**
   * Admin: Nettoyer les tokens expirés
   */
  async cleanupExpiredTokens(): Promise<CleanupResetTokensResponse> {
    return this.request<CleanupResetTokensResponse>(API_ENDPOINTS.ADMIN.CLEANUP_RESET_TOKENS, {
      method: 'POST'
    });
  }
}

export default new PasswordResetService(); 
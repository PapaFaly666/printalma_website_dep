import { useState } from 'react';
import passwordResetService from '../services/passwordResetService';
import type { 
  ForgotPasswordResponse, 
  VerifyResetTokenResponse, 
  ResetPasswordResponse,
  CleanupResetTokensResponse 
} from '../types/auth';

interface UsePasswordResetState {
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string;
}

interface UsePasswordResetReturn extends UsePasswordResetState {
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse | null>;
  verifyToken: (token: string) => Promise<VerifyResetTokenResponse | null>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<ResetPasswordResponse | null>;
  cleanupExpiredTokens: () => Promise<CleanupResetTokensResponse | null>;
  clearError: () => void;
  clearSuccess: () => void;
  clearAll: () => void;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [state, setState] = useState<UsePasswordResetState>({
    loading: false,
    error: null,
    success: false,
    message: ''
  });

  const updateState = (updates: Partial<UsePasswordResetState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const clearSuccess = () => {
    updateState({ success: false, message: '' });
  };

  const clearAll = () => {
    setState({
      loading: false,
      error: null,
      success: false,
      message: ''
    });
  };

  const forgotPassword = async (email: string): Promise<ForgotPasswordResponse | null> => {
    updateState({ loading: true, error: null, success: false });

    try {
      const result = await passwordResetService.forgotPassword(email);
      updateState({ 
        loading: false, 
        success: true, 
        message: result.message 
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      return null;
    }
  };

  const verifyToken = async (token: string): Promise<VerifyResetTokenResponse | null> => {
    updateState({ loading: true, error: null, success: false });

    try {
      const result = await passwordResetService.verifyResetToken(token);
      updateState({ loading: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token invalide';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      return null;
    }
  };

  const resetPassword = async (
    token: string, 
    newPassword: string, 
    confirmPassword: string
  ): Promise<ResetPasswordResponse | null> => {
    updateState({ loading: true, error: null, success: false });

    try {
      const result = await passwordResetService.resetPassword(token, newPassword, confirmPassword);
      updateState({ 
        loading: false, 
        success: true, 
        message: result.message 
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      return null;
    }
  };

  const cleanupExpiredTokens = async (): Promise<CleanupResetTokensResponse | null> => {
    updateState({ loading: true, error: null, success: false });

    try {
      const result = await passwordResetService.cleanupExpiredTokens();
      updateState({ 
        loading: false, 
        success: true, 
        message: `${result.deletedCount} tokens expirés supprimés` 
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du nettoyage';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      return null;
    }
  };

  return {
    ...state,
    forgotPassword,
    verifyToken,
    resetPassword,
    cleanupExpiredTokens,
    clearError,
    clearSuccess,
    clearAll
  };
}; 
import axios from 'axios';
import { PostValidationAction, ValidationChoice } from '../types/vendorProduct';

const api = axios.create({
  baseURL: 'https://printalma-back-dep.onrender.com',
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  console.log('🚀 Validation API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Validation API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Validation API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class VendorValidationService {
  
  /**
   * Définir le choix de publication après validation
   */
  static async setPostValidationAction(productId: number, action: PostValidationAction) {
    const { data } = await api.put(`/vendor-product-validation/post-validation-action/${productId}`, {
      action,
      postValidationAction: action
    });
    return data;
  }

  /**
   * Publier manuellement un produit validé en brouillon
   */
  static async publishValidatedProduct(productId: number) {
    const { data } = await api.post(`/vendor-product-validation/publish/${productId}`);
    return data;
  }

  /**
   * Obtenir les choix disponibles avec labels
   */
  static getValidationChoices(): ValidationChoice[] {
    return [
      {
        action: PostValidationAction.AUTO_PUBLISH,
        label: 'Publication automatique',
        description: 'Le produit sera publié immédiatement après validation par l\'admin',
        icon: '🚀'
      },
      {
        action: PostValidationAction.TO_DRAFT,
        label: 'Mise en brouillon',
        description: 'Le produit sera mis en brouillon après validation. Vous pourrez le publier quand vous voulez',
        icon: '📝'
      }
    ];
  }

  /**
   * Obtenir les produits en attente de validation
   */
  static async getPendingProducts() {
    const { data } = await api.get('/vendor-product-validation/pending');
    return data;
  }

  /**
   * Valider un produit (côté admin)
   */
  static async validateProduct(productId: number, approved: boolean, rejectionReason?: string) {
    const { data } = await api.post(`/vendor-product-validation/validate/${productId}`, {
      approved,
      rejectionReason
    });
    return data;
  }

  /**
   * Soumettre un produit pour validation avec l'action choisie
   */
  static async submitForValidation(productId: number, postValidationAction: PostValidationAction) {
    const { data } = await api.post(`/vendor-product-validation/submit/${productId}`, {
      postValidationAction
    });
    return data;
  }
} 
 
import React from 'react';
import { VendorProduct as CascadeVendorProduct, PostValidationAction } from '../../types/cascadeValidation';
import { VendorProduct as LegacyVendorProduct } from '../../types/vendorProduct';

interface ProductStatusBadgeProps {
  product: CascadeVendorProduct | LegacyVendorProduct;
}

// Type guard pour vérifier si c'est un produit cascade validation
const isCascadeVendorProduct = (product: any): product is CascadeVendorProduct => {
  return product.hasOwnProperty('postValidationAction') && product.hasOwnProperty('isValidated');
};

// Type guard pour vérifier si c'est un produit avec workflow existant
const isWorkflowVendorProduct = (product: any): boolean => {
  return product.hasOwnProperty('workflow') || product.hasOwnProperty('pendingAutoPublish');
};

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ product }) => {
  const getStatusInfo = () => {
    // Debug : afficher les propriétés du produit
    console.log('🔍 ProductStatusBadge - Produit:', {
      id: product.id,
      status: product.status,
      isValidated: (product as any).isValidated,
      workflow: (product as any).workflow,
      pendingAutoPublish: (product as any).pendingAutoPublish,
      readyToPublish: (product as any).readyToPublish,
      postValidationAction: (product as any).postValidationAction,
      isCascade: isCascadeVendorProduct(product),
      isWorkflow: isWorkflowVendorProduct(product)
    });

    // Système avec workflow existant (AUTO-PUBLISH, MANUAL-PUBLISH)
    if (isWorkflowVendorProduct(product)) {
      const workflow = (product as any).workflow;
      const pendingAutoPublish = (product as any).pendingAutoPublish;
      const readyToPublish = (product as any).readyToPublish;
      const isValidated = (product as any).isValidated;

      if (product.status === 'PUBLISHED') {
        return { 
          text: 'Publié', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400', 
          icon: '✅' 
        };
      }
      
      if (product.status === 'PENDING') {
        if (isValidated) {
          // Design validé - doit déclencher l'action selon le workflow
          if (workflow === 'AUTO-PUBLISH' || pendingAutoPublish) {
            return { 
              text: 'Publié automatiquement', 
              color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400', 
              icon: '🚀' 
            };
          } else {
            return { 
              text: 'Validé - Prêt à publier', 
              color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-400', 
              icon: '📝' 
            };
          }
        }
        
        // En attente de validation
        const actionText = workflow === 'AUTO-PUBLISH' || pendingAutoPublish
          ? 'Publication automatique'
          : 'Publication manuelle';
        return { 
          text: `En attente - ${actionText}`, 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-400', 
          icon: '⏳' 
        };
      }
      
      if (product.status === 'DRAFT') {
        if (isValidated || readyToPublish) {
          return { 
            text: 'Validé - Prêt à publier', 
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-400', 
            icon: '📝' 
          };
        } else {
          return { 
            text: 'Brouillon', 
            color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-400', 
            icon: '📄' 
          };
        }
      }
    }

    // Nouveau système de cascade validation
    else if (isCascadeVendorProduct(product)) {
      if (product.status === 'PUBLISHED') {
        return { 
          text: 'Publié', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400', 
          icon: '✅' 
        };
      }
      
      if (product.status === 'PENDING') {
        // Si le design est validé, on change le statut selon l'action
        if (product.isValidated) {
          if (product.postValidationAction === PostValidationAction.AUTO_PUBLISH) {
            return { 
              text: 'Publié automatiquement', 
              color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400', 
              icon: '🚀' 
            };
          } else {
            return { 
              text: 'Validé - Prêt à publier', 
              color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-400', 
              icon: '📝' 
            };
          }
        }
        
        // En attente de validation
        const actionText = product.postValidationAction === PostValidationAction.AUTO_PUBLISH
          ? 'Publication automatique'
          : 'Brouillon après validation';
        return { 
          text: `En attente - ${actionText}`, 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-400', 
          icon: '⏳' 
        };
      }
      
      if (product.status === 'DRAFT') {
        if (product.isValidated) {
          return { 
            text: 'Validé - Prêt à publier', 
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-400', 
            icon: '📝' 
          };
        } else {
          return { 
            text: 'Brouillon', 
            color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-400', 
            icon: '📄' 
          };
        }
      }
      
      if (product.rejectionReason) {
        return { 
          text: 'Rejeté', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-400', 
          icon: '❌' 
        };
      }
    }
    
    // Ancien système (legacy) - logique améliorée
    else {
      // Vérifier si le produit a été validé par l'admin (champ isValidated dans les données legacy)
      const isValidated = (product as any).isValidated || false;
      
      if (product.status === 'PUBLISHED') {
        return { 
          text: 'Publié', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400', 
          icon: '✅' 
        };
      }
      
      if (product.status === 'PENDING') {
        if (isValidated) {
          // Design validé mais produit encore en PENDING - problème de cascade
          return { 
            text: 'Validé - Erreur cascade', 
            color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-400', 
            icon: '⚠️' 
          };
        }
        return { 
          text: 'En attente', 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-400', 
          icon: '⏳' 
        };
      }
      
      if (product.status === 'DRAFT') {
        if (isValidated) {
          // Design validé et produit en DRAFT - prêt à publier
          return { 
            text: 'Validé - Prêt à publier', 
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-400', 
            icon: '📝' 
          };
        }
        return { 
          text: 'Brouillon', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-400', 
          icon: '📝' 
        };
      }
    }
    
    return { 
      text: 'Inconnu', 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-400', 
      icon: '❓' 
    };
  };

  const { text, color, icon } = getStatusInfo();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${color}`}>
      <span>{icon}</span>
      {text}
    </span>
  );
}; 
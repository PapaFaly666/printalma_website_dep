import React from 'react';
import { Badge } from '../ui/badge';
import { PostValidationAction } from '../../types/cascadeValidation';

interface ProductStatusBadgeProps {
  product: any; // Compatible avec les structures existantes
  className?: string;
}

export const ProductStatusBadgeIntegrated: React.FC<ProductStatusBadgeProps> = ({ 
  product, 
  className = "" 
}) => {
  // Détection du système utilisé - prioriser le système workflow existant
  const hasWorkflowSystem = product.workflow !== undefined;
  const hasCascadeSystem = product.postValidationAction !== undefined && !hasWorkflowSystem;
  
  console.log('🏷️ Badge Debug:', {
    id: product.id,
    name: product.name,
    status: product.status,
    workflow: product.workflow,
    postValidationAction: product.postValidationAction,
    isValidated: product.isValidated,
    pendingAutoPublish: product.pendingAutoPublish,
    readyToPublish: product.readyToPublish,
    hasWorkflowSystem,
    hasCascadeSystem
  });
  
  // Système workflow existant (prioritaire)
  if (hasWorkflowSystem) {
    if (product.status === 'PUBLISHED') {
      return (
        <Badge variant="default" className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
          ✅ Publié
        </Badge>
      );
    }
    
    // Produit en attente avec auto-publication configurée
    if (product.status === 'PENDING' && product.workflow === 'AUTO-PUBLISH') {
      return (
        <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
          ⏳ En attente - Auto-publication
        </Badge>
      );
    }
    
    // Produit en attente avec publication manuelle
    if (product.status === 'PENDING' && product.workflow === 'MANUAL-PUBLISH') {
      return (
        <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
          ⏳ En attente - Publication manuelle
        </Badge>
      );
    }
    
    // Produit en attente (statut général)
    if (product.status === 'PENDING') {
      return (
        <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
          ⏳ En attente de validation
        </Badge>
      );
    }
    
    // Produit validé et prêt à publier (système workflow)
    if (product.readyToPublish && product.workflow === 'MANUAL-PUBLISH') {
      return (
        <Badge variant="outline" className={`bg-blue-100 text-blue-800 border-blue-200 ${className}`}>
          🎯 Prêt à publier
        </Badge>
      );
    }
    
    // Auto-publication en attente
    if (product.pendingAutoPublish) {
      return (
        <Badge variant="secondary" className={`bg-orange-100 text-orange-800 border-orange-200 ${className}`}>
          🔄 Publication automatique en attente
        </Badge>
      );
    }
    
    // Brouillon avec workflow auto-publication
    if (product.status === 'DRAFT' && product.workflow === 'AUTO-PUBLISH') {
      return (
        <Badge variant="outline" className={`bg-purple-100 text-purple-800 border-purple-200 ${className}`}>
          📝 Brouillon - Auto-publication configurée
        </Badge>
      );
    }
    
    // Brouillon avec workflow publication manuelle
    if (product.status === 'DRAFT' && product.workflow === 'MANUAL-PUBLISH') {
      return (
        <Badge variant="outline" className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
          📝 Brouillon - Publication manuelle
        </Badge>
      );
    }
    
    // Brouillon général
    if (product.status === 'DRAFT') {
      return (
        <Badge variant="outline" className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
          📝 Brouillon
        </Badge>
      );
    }
  }
  
  // Système cascade validation V3 (nouveau)
  if (hasCascadeSystem) {
    if (product.status === 'PUBLISHED') {
      return (
        <Badge variant="default" className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
          ✅ Publié
        </Badge>
      );
    }
    
    if (product.status === 'DRAFT' && product.isValidated) {
      return (
        <Badge variant="outline" className={`bg-blue-100 text-blue-800 border-blue-200 ${className}`}>
          🎯 Validé - Prêt à publier
        </Badge>
      );
    }
    
    if (product.status === 'PENDING') {
      // ✅ Utilisation de l'enum PostValidationAction
      const actionText = product.postValidationAction === PostValidationAction.AUTO_PUBLISH
        ? 'Publication automatique'
        : 'Publication manuelle';
      return (
        <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
          ⏳ En attente - {actionText}
        </Badge>
      );
    }
    
    if (product.status === 'DRAFT') {
      return (
        <Badge variant="outline" className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
          📝 Brouillon
        </Badge>
      );
    }
  }
  
  // Système legacy - fallback
  if (product.status === 'PUBLISHED') {
    return (
      <Badge variant="default" className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
        ✅ Publié
      </Badge>
    );
  }
  
  if (product.status === 'PENDING') {
    return (
      <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
        ⏳ En attente
      </Badge>
    );
  }
  
  if (product.status === 'DRAFT') {
    return (
      <Badge variant="outline" className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
        📝 Brouillon
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
      ❓ Statut inconnu
    </Badge>
  );
}; 
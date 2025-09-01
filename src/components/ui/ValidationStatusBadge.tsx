import React from 'react';
import { Check, Clock, X, AlertTriangle, Eye } from 'lucide-react';
import { VendorProductStatus, DesignStatus } from '../../types/validation';

interface ValidationStatusBadgeProps {
  status: VendorProductStatus | DesignStatus | string;
  type?: 'design' | 'vendorProduct';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const ValidationStatusBadge: React.FC<ValidationStatusBadgeProps> = ({
  status,
  type = 'vendorProduct',
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const getStatusConfig = () => {
    const normalizedStatus = status.toString().toUpperCase();
    
    switch (normalizedStatus) {
      case 'VALIDATED':
        return {
          label: 'Validé',
          bgColor: 'bg-green-100 dark:bg-green-900',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-200 dark:border-green-700',
          icon: Check
        };
      
      case 'PENDING':
      case 'PENDING_VALIDATION':
        return {
          label: 'En attente',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-200 dark:border-yellow-700',
          icon: Clock
        };
      
      case 'DRAFT':
        return {
          label: 'Brouillon',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-200 dark:border-gray-600',
          icon: Eye
        };
      
      case 'REJECTED':
        return {
          label: 'Rejeté',
          bgColor: 'bg-red-100 dark:bg-red-900',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-200 dark:border-red-700',
          icon: X
        };
      
      case 'PUBLISHED':
        return {
          label: 'Publié',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-700',
          icon: Check
        };
      
      default:
        return {
          label: status.toString(),
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-200 dark:border-gray-600',
          icon: AlertTriangle
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {showIcon && <Icon className={`${getIconSize()} mr-1`} />}
      {config.label}
    </span>
  );
};

// Composant spécialisé pour les designs
export const DesignValidationBadge: React.FC<{
  status: DesignStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}> = ({ status, size = 'md', showIcon = true, className = '' }) => {
  return (
    <ValidationStatusBadge
      status={status}
      type="design"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
};

// Composant spécialisé pour les produits vendeurs
export const VendorProductValidationBadge: React.FC<{
  status: VendorProductStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}> = ({ status, size = 'md', showIcon = true, className = '' }) => {
  return (
    <ValidationStatusBadge
      status={status}
      type="vendorProduct"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
};

// Badge combiné pour afficher le statut du design ET du produit
export const CombinedValidationBadge: React.FC<{
  designStatus: DesignStatus | string;
  productStatus: VendorProductStatus | string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}> = ({ 
  designStatus, 
  productStatus, 
  size = 'md', 
  layout = 'horizontal',
  className = '' 
}) => {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <div 
      className={`
        flex ${isHorizontal ? 'flex-row space-x-2' : 'flex-col space-y-1'} 
        ${className}
      `}
    >
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Design</span>
        <DesignValidationBadge 
          status={designStatus} 
          size={size} 
          showIcon={true} 
        />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Produit</span>
        <VendorProductValidationBadge 
          status={productStatus} 
          size={size} 
          showIcon={true} 
        />
      </div>
    </div>
  );
};

// Tooltip informatif pour expliquer les statuts
export const ValidationStatusTooltip: React.FC<{
  status: VendorProductStatus | DesignStatus | string;
  type?: 'design' | 'vendorProduct';
}> = ({ status, type = 'vendorProduct' }) => {
  const getTooltipText = () => {
    const normalizedStatus = status.toString().toUpperCase();
    
    if (type === 'design') {
      switch (normalizedStatus) {
        case 'VALIDATED':
          return 'Ce design a été validé par un administrateur. Tous les produits associés sont maintenant en statut VALIDATED.';
        case 'PENDING':
        case 'PENDING_VALIDATION':
          return 'Ce design est en attente de validation par un administrateur. Les produits associés sont en statut PENDING.';
        case 'DRAFT':
          return 'Ce design est en brouillon ou a été rejeté. Les produits associés sont en statut DRAFT.';
        case 'REJECTED':
          return 'Ce design a été rejeté par un administrateur. Les produits associés sont repassés en statut DRAFT.';
        default:
          return 'Statut de validation inconnu.';
      }
    } else {
      switch (normalizedStatus) {
        case 'VALIDATED':
          return 'Ce produit a été automatiquement validé car le design associé a été approuvé par un administrateur.';
        case 'PENDING':
          return 'Ce produit est en attente car le design associé n\'a pas encore été validé par un administrateur.';
        case 'DRAFT':
          return 'Ce produit est en brouillon, soit car il n\'a pas de design associé, soit car le design a été rejeté.';
        case 'PUBLISHED':
          return 'Ce produit est publié et disponible pour les clients.';
        default:
          return 'Statut de validation inconnu.';
      }
    }
  };

  return (
    <div className="max-w-xs p-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg">
      {getTooltipText()}
    </div>
  );
}; 
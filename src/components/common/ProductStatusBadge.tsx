import { Badge } from '../ui/badge';
import React from 'react';

interface ProductStatusBadgeProps {
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  /**
   * Champ conservé pour compatibilité mais non utilisé désormais.
   * Le statut fait foi pour l'UI.
   */
  isValidated?: boolean;
  submittedForValidationAt?: string | null;
  rejectionReason?: string | null;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status, rejectionReason }) => {
  // Mapping officiel (cf. Guide Frontend – Statuts VendorProduct)
  const map = {
    PUBLISHED: {
      label: '✅ Publié',
      className: 'badge-status-published',
    },
    PENDING: {
      label: '⏳ En attente',
      className: 'badge-status-pending',
    },
    DRAFT: {
      label: rejectionReason ? '❌ Rejeté' : '📝 Brouillon',
      className: rejectionReason ? 'badge-status-rejected' : 'badge-status-draft',
    },
  } as const;

  const info = map[status as keyof typeof map] ?? map.DRAFT;

  return (
    <Badge className={info.className} title={rejectionReason ?? undefined}>
      {info.label}
    </Badge>
  );
}; 
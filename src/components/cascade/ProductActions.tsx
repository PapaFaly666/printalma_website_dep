// Actions contextuelles pour les produits selon leur statut

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Rocket, Eye, Trash2 } from 'lucide-react';
import { VendorProduct, PostValidationAction } from '@/types/cascadeValidation';
import CascadeValidationService from '@/services/cascadeValidationService';
import ValidationActionSelector from './ValidationActionSelector';
import { toast } from 'sonner';

interface ProductActionsProps {
  product: VendorProduct;
  onActionChange?: (productId: number, action: PostValidationAction) => void;
  onPublish?: (productId: number) => void;
  onDelete?: (productId: number) => void;
  onEdit?: (productId: number) => void;
  loading?: boolean;
}

export function ProductActions({
  product,
  onActionChange,
  onPublish,
  onDelete,
  onEdit,
  loading = false
}: ProductActionsProps) {
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState(product.postValidationAction);

  const canModify = CascadeValidationService.canModifyProduct(product);
  const canPublish = CascadeValidationService.canPublishManually(product);

  const handleActionChange = async () => {
    if (currentAction !== product.postValidationAction && onActionChange) {
      await onActionChange(product.id, currentAction);
      setShowActionDialog(false);
      toast.success('Action post-validation mise à jour');
    }
  };

  const handlePublish = async () => {
    if (onPublish) {
      await onPublish(product.id);
    }
  };

  // Bouton principal selon le statut
  const renderPrimaryAction = () => {
    if (canPublish) {
      return (
        <Button 
          onClick={handlePublish}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Publier maintenant
        </Button>
      );
    }

    if (canModify) {
      return (
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={loading}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'action post-validation</DialogTitle>
              <DialogDescription>
                Vous pouvez modifier ce qui se passera quand l'admin validera votre design
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <ValidationActionSelector
                selectedAction={currentAction}
                onActionChange={setCurrentAction}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowActionDialog(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleActionChange}
                disabled={currentAction === product.postValidationAction}
              >
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center gap-2">
      {renderPrimaryAction()}
      
      {/* Menu d'actions secondaires */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => onEdit?.(product.id)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier le produit
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Eye className="w-4 h-4 mr-2" />
            Voir les détails
          </DropdownMenuItem>
          
          {/* Actions selon le statut */}
          {canModify && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowActionDialog(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier action post-validation
              </DropdownMenuItem>
            </>
          )}
          
          {canPublish && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePublish}>
                <Rocket className="w-4 h-4 mr-2" />
                Publier maintenant
              </DropdownMenuItem>
            </>
          )}
          
          {/* Actions de suppression */}
          {product.status === 'DRAFT' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(product.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ProductActions; 
 
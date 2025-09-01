import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ValidationActionSelector } from './ValidationActionSelector';
import { PostValidationAction, CreateProductPayload } from '../../types/cascadeValidation';
import { CascadeValidationService } from '../../services/cascadeValidationService';
import { toast } from 'sonner';
import { Rocket, FileText, Loader2 } from 'lucide-react';

interface SellDesignWithCascadeProps {
  designUrl: string;
  productStructure: any;
  onProductCreated?: (productId: number) => void;
  onCancel?: () => void;
}

export const SellDesignWithCascade: React.FC<SellDesignWithCascadeProps> = ({
  designUrl,
  productStructure,
  onProductCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorPrice: 0,
    postValidationAction: PostValidationAction.AUTO_PUBLISH
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.vendorName.trim()) {
      toast.error('Veuillez saisir un nom pour le produit');
      return;
    }

    if (formData.vendorPrice <= 0) {
      toast.error('Veuillez saisir un prix valide');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateProductPayload = {
        vendorName: formData.vendorName,
        vendorPrice: formData.vendorPrice,
        designCloudinaryUrl: designUrl,
        postValidationAction: formData.postValidationAction,
        productStructure: productStructure
      };

      console.log('🛍️ Création produit avec cascade validation:', payload);
      
      const result = await CascadeValidationService.createProductWithAction(payload);
      
      toast.success('Produit créé avec succès !');
      console.log('✅ Produit créé:', result);
      
      onProductCreated?.((result as any).productId || result.data?.id);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionDescription = () => {
    if (formData.postValidationAction === PostValidationAction.AUTO_PUBLISH) {
      return {
        icon: '🚀',
        text: 'Votre produit sera publié automatiquement dès que l\'admin validera votre design.',
        color: 'text-green-600'
      };
    } else {
      return {
        icon: '📝',
        text: 'Votre produit sera mis en brouillon après validation. Vous pourrez le publier manuellement.',
        color: 'text-blue-600'
      };
    }
  };

  const actionInfo = getActionDescription();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Créer un produit avec votre design
        </CardTitle>
        <CardDescription>
          Configurez votre produit et choisissez l'action après validation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informations du produit */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="vendorName">Nom du produit</Label>
            <Input
              id="vendorName"
              placeholder="Ex: Mon T-shirt personnalisé"
              value={formData.vendorName}
              onChange={(e) => handleInputChange('vendorName', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="vendorPrice">Prix (€)</Label>
            <Input
              id="vendorPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="25.00"
              value={formData.vendorPrice || ''}
              onChange={(e) => handleInputChange('vendorPrice', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Sélecteur d'action post-validation */}
        <ValidationActionSelector
          selectedAction={formData.postValidationAction}
          onActionChange={(action) => handleInputChange('postValidationAction', action)}
          disabled={isSubmitting}
        />

        {/* Aperçu de l'action */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{actionInfo.icon}</span>
            <div>
              <p className="font-medium text-sm mb-1">Action sélectionnée</p>
              <p className={`text-sm ${actionInfo.color}`}>
                {actionInfo.text}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Créer le produit
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 
 
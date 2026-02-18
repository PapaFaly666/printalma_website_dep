import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ProductFormData, ProductFormErrors } from '../../types/product';
import { ProductPriceManager } from '../admin/ProductPriceManager';

interface ProductFormFieldsProps {
  formData: ProductFormData;
  errors: ProductFormErrors;
  onUpdate: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  formData,
  errors,
  onUpdate
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-900">
            Informations principales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Nom du produit */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nom du produit *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              placeholder="Entrez le nom du produit"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={4}
              className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Prix globaux - optionnel pour toutes les tailles */}
          <div className="space-y-3 p-4 bg-[rgb(20,104,154)]/5 rounded-lg border border-[rgb(20,104,154)]/30">
            <div className="flex items-center space-x-2">
              <Switch
                id="useGlobalPricing"
                checked={formData.useGlobalPricing ?? false}
                onCheckedChange={(checked) => onUpdate('useGlobalPricing', checked)}
              />
              <Label htmlFor="useGlobalPricing" className="text-sm font-semibold cursor-pointer">
                🏷️ Mêmes prix pour toutes les tailles
              </Label>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              Cochez cette case si toutes les tailles ont les mêmes prix de revient et de vente suggéré
            </p>

            {formData.useGlobalPricing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ml-6"
              >
                {/* Prix de revient global */}
                <div className="space-y-2">
                  <Label htmlFor="globalCostPrice" className="text-sm font-medium">
                    💰 Prix de revient global (FCFA)
                  </Label>
                  <Input
                    id="globalCostPrice"
                    type="number"
                    value={formData.globalCostPrice || ''}
                    onChange={(e) => onUpdate('globalCostPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Coût de production"
                    min="0"
                    step="100"
                    className="font-semibold"
                  />
                </div>

                {/* Prix de vente suggéré global */}
                <div className="space-y-2">
                  <Label htmlFor="globalSuggestedPrice" className="text-sm font-medium">
                    💡 Prix de vente suggéré global (FCFA)
                  </Label>
                  <Input
                    id="globalSuggestedPrice"
                    type="number"
                    value={formData.globalSuggestedPrice || ''}
                    onChange={(e) => onUpdate('globalSuggestedPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Prix recommandé"
                    min="0"
                    step="100"
                    className="font-semibold border-green-500"
                    required
                  />
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Autre */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-900">
            Autres informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Genre cible */}
          <div className="space-y-2">
            <Label htmlFor="genre" className="text-sm font-medium">
              Genre cible
            </Label>
            <Select
              value={formData.genre || ''}
              onValueChange={(value) => onUpdate('genre', value as 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU')}
            >
              <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez le genre cible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOMME">Homme</SelectItem>
                <SelectItem value="FEMME">Femme</SelectItem>
                <SelectItem value="BEBE">Bébé</SelectItem>
                <SelectItem value="UNISEXE">Unisexe</SelectItem>
                <SelectItem value="AUTOCOLLANT">Autocollant</SelectItem>
                <SelectItem value="TABLEAU">Tableau</SelectItem>
              </SelectContent>
            </Select>
            {errors.genre && (
              <p className="text-sm text-red-500">{errors.genre}</p>
            )}
          </div>

          {/* Gestion du stock - masqué si AUTOCOLLANT ou TABLEAU */}
          {formData.genre !== 'AUTOCOLLANT' && formData.genre !== 'TABLEAU' && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Switch
                id="requiresStock"
                checked={formData.requiresStock ?? true}
                onCheckedChange={(checked) => onUpdate('requiresStock', checked)}
              />
              <Label htmlFor="requiresStock" className="text-sm font-medium cursor-pointer">
                Ce produit nécessite une gestion de stock
              </Label>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}; 
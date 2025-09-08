import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ProductFormData, ProductFormErrors } from '../../types/product';

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Informations principales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Prix suggéré (pré-remplit le prix) */}
          <div className="space-y-2">
            <Label htmlFor="suggested-price" className="text-sm font-medium">
              Prix suggéré (FCFA)
            </Label>
            <Input
              id="suggested-price"
              type="number"
              placeholder="Ex: 6500"
              min="0"
              step="100"
              onChange={(e) => onUpdate('price', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-gray-500">Ce champ remplit automatiquement le prix ci-dessous.</p>
          </div>

          {/* Prix et Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Prix (FCFA) *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => onUpdate('price', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="100"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock" className="text-sm font-medium">
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => onUpdate('stock', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock && (
                <p className="text-sm text-red-500">{errors.stock}</p>
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statut de publication</Label>
            <div className="flex items-center space-x-3">
              <span className={formData.status === 'draft' ? 'text-gray-600' : 'text-gray-400'}>
                Brouillon
              </span>
              <Switch
                checked={formData.status === 'published'}
                onCheckedChange={(checked) => 
                  onUpdate('status', checked ? 'published' : 'draft')
                }
              />
              <span className={formData.status === 'published' ? 'text-green-600' : 'text-gray-400'}>
                Publié
              </span>
            </div>
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

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="genre" className="text-sm font-medium">
              Genre cible
            </Label>
            <Select
              value={formData.genre || ''}
              onValueChange={(value) => onUpdate('genre', value as 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE')}
            >
              <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez le genre cible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOMME">Homme</SelectItem>
                <SelectItem value="FEMME">Femme</SelectItem>
                <SelectItem value="BEBE">Bébé</SelectItem>
                <SelectItem value="UNISEXE">Unisexe</SelectItem>
              </SelectContent>
            </Select>
            {errors.genre && (
              <p className="text-sm text-red-500">{errors.genre}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { vendorTypeService, CreateVendorTypeDto } from '../../services/vendorTypeService';

interface CreateVendorTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateVendorTypeModal: React.FC<CreateVendorTypeModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateVendorTypeDto>({
    label: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    label?: string;
    description?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validation du label
    if (!formData.label.trim()) {
      newErrors.label = 'Le label est requis';
    } else if (formData.label.trim().length < 2) {
      newErrors.label = 'Le label doit contenir au moins 2 caractères';
    } else if (formData.label.trim().length > 50) {
      newErrors.label = 'Le label ne peut pas dépasser 50 caractères';
    }

    // Validation de la description
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'La description doit contenir au moins 5 caractères';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await vendorTypeService.create({
        label: formData.label.trim(),
        description: formData.description.trim()
      });

      toast.success('Type de vendeur créé', {
        description: `Le type "${response.vendorType.label}" a été créé avec succès`
      });

      // Reset form
      setFormData({ label: '', description: '' });

      // Callback success
      onSuccess();

      // Close modal
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error: any) {
      console.error('Error creating vendor type:', error);
      const errorMessage = error.message || 'Erreur lors de la création';
      setErrors({ general: errorMessage });
      toast.error('Échec de la création', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ label: '', description: '' });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Créer un Type de Vendeur
          </DialogTitle>
          <DialogDescription>
            Définissez un nouveau type de vendeur pour catégoriser vos utilisateurs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label" className="text-sm font-medium">
              Label <span className="text-red-600">*</span>
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Ex: Photographe, Designer, Influenceur..."
              maxLength={50}
              disabled={loading}
              className={errors.label ? 'border-red-500' : ''}
            />
            {errors.label && (
              <p className="text-red-600 text-xs mt-1">{errors.label}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.label.length}/50 caractères
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Spécialiste de la photographie professionnelle"
              rows={3}
              maxLength={200}
              disabled={loading}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/200 caractères
            </p>
          </div>

          {/* Erreur générale */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
